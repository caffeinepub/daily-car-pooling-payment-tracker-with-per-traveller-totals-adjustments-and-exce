import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module Date {
    public type Date = {
      year : Nat;
      month : Nat;
      day : Nat;
    };

    public func toText(date : Date) : Text {
      date.year.toText() # "-" # date.month.toText() # "-" # date.day.toText();
    };
  };

  public type UserProfile = {
    name : Text;
  };

  module Payment {
    public type Payment = {
      amount : Nat;
      date : Date.Date;
      note : ?Text;
    };
  };

  module MonetaryEvent {
    public type MonetaryEvent = {
      description : Text;
      amount : Nat;
      participants : [Principal];
      timestamp : Time.Time;
      payments : List.List<Payment.Payment>;
    };
  };

  module TravelEntry {
    public type TravelEntry = {
      date : Date.Date;
      events : List.List<MonetaryEvent.MonetaryEvent>;
    };
  };

  module Traveller {
    public type Traveller = {
      principal : Principal;
      name : Text;
    };
  };

  public type BackupData = {
    userProfile : ?UserProfile;
  };

  let pendingBalances = Map.empty<Principal, Nat>();
  let entries = Map.empty<Text, TravelEntry.TravelEntry>();
  let travellers = Map.empty<Principal, Traveller.Traveller>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func compareByAmount(a : (Principal, Nat), b : (Principal, Nat)) : Order.Order {
    Nat.compare(a.1, b.1);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access other users' profiles");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func exportBackup() : async BackupData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can export their backup data");
    };

    {
      userProfile = userProfiles.get(caller);
    };
  };

  public shared ({ caller }) func importBackup(backup : BackupData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can import their backup data");
    };

    // Non-destructive merge: only restore profile if caller has no existing profile
    switch (userProfiles.get(caller)) {
      case (null) {
        // No existing profile, restore from backup if available
        switch (backup.userProfile) {
          case (?profile) {
            userProfiles.add(caller, profile);
          };
          case (null) {
            // No profile in backup, nothing to restore
          };
        };
      };
      case (?existingProfile) {
        // Existing profile present, do not overwrite (non-destructive)
      };
    };
  };

  public query ({ caller }) func getAllBalances() : async [(Principal, Nat)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all balances");
    };

    let balanceList = List.empty<(Principal, Nat)>();
    for ((principal, amount) in pendingBalances.entries()) {
      balanceList.add((principal, amount));
    };
    balanceList.toArray().sort(compareByAmount);
  };

  public query ({ caller }) func getBalance(user : Principal) : async Nat {
    if (caller != user and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view other users' balances");
    };

    switch (pendingBalances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  public shared ({ caller }) func startCharge(
    description : Text,
    amount : Nat,
    participants : [Principal]
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can issue charges");
    };

    let currentBalance = switch (pendingBalances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };

    if (currentBalance < amount) {
      Runtime.trap("Requested amount exceeds current balance");
    };

    pendingBalances.add(caller, currentBalance - amount);
  };
};

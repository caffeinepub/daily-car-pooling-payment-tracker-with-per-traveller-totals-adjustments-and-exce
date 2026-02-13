import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Amount = Nat;
  type Currency = Text;

  type Date = {
    year : Nat;
    month : Nat;
    day : Nat;
  };

  type Payment = {
    amount : Amount;
    date : Date;
    note : ?Text;
  };

  type MonetaryEvent = {
    description : Text;
    amount : Amount;
    participants : [Principal];
    timestamp : Time.Time;
    payments : List.List<Payment>;
  };

  type Traveller = {
    principal : Principal;
    name : Text;
  };

  type TravelEntry = {
    date : Date;
    events : List.List<MonetaryEvent>;
  };

  public type UserProfile = {
    name : Text;
    // Add other profile fields as needed
  };

  let travellers = Map.empty<Principal, Traveller>();
  let entries = Map.empty<Text, TravelEntry>();
  let pendingBalances = Map.empty<Principal, Amount>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func compareByAmount(a : (Principal, Amount), b : (Principal, Amount)) : Order.Order {
    Nat.compare(a.1, b.1);
  };

  module Date {
    public func toText(date : Date) : Text {
      date.year.toText() # "-" # date.month.toText() # "-" # date.day.toText();
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getBalance(user : Principal) : async Amount {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };

    switch (pendingBalances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  public shared ({ caller }) func startCharge(description : Text, amount : Amount, participants : [Principal]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can start charges");
    };

    let event = {
      description;
      amount;
      participants;
      timestamp = Time.now();
      payments = List.empty<Payment>();
    };

    let eventDate : Date = {
      year = 2024;
      month = 1;
      day = 1;
    };

    switch (entries.get(Date.toText(eventDate))) {
      case (null) {
        let entry = {
          date = eventDate;
          events = List.singleton<MonetaryEvent>(event);
        };
        entries.add(Date.toText(eventDate), entry);
      };
      case (?existingEntry) {
        existingEntry.events.add<MonetaryEvent>(event);
      };
    };

    for (participant in participants.values()) {
      let currentBalance = switch (pendingBalances.get(participant)) {
        case (null) { 0 };
        case (?balance) { balance };
      };
      pendingBalances.add(participant, currentBalance + amount);
    };
  };

  public shared ({ caller }) func recordPayment(eventDate : Date, amount : Amount, note : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can record payments");
    };

    let payment = {
      amount;
      date = eventDate;
      note;
    };

    let currentBalance = switch (pendingBalances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };

    if (currentBalance < amount) {
      Runtime.trap("Payment amount exceeds pending balance");
    };

    pendingBalances.add(caller, currentBalance - amount);

    switch (entries.get(Date.toText(eventDate))) {
      case (null) { Runtime.trap("Event not found for the given date") };
      case (?entry) {
        for (event in entry.events.values()) {
          event.payments.add(payment);
        };
      };
    };
  };

  public query ({ caller }) func getAllBalances() : async [(Principal, Amount)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all balances");
    };

    let balanceList = List.empty<(Principal, Amount)>();
    for ((principal, amount) in pendingBalances.entries()) {
      balanceList.add((principal, amount));
    };
    balanceList.toArray().sort(compareByAmount);
  };
};

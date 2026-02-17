import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";


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
      pseudo : Text;
    };
  };

  module CoTravellerIncome {
    public type CoTravellerIncome = {
      amount : Nat;
      date : Date.Date;
      note : ?Text;
    };
  };

  public type AppData = {
    userProfile : ?UserProfile;
    ledgerState : ?Text;
    lastUpdated : Time.Time;
    version : Nat;
  };

  let pendingBalances = Map.empty<Principal, Nat>();
  let entries = Map.empty<Text, TravelEntry.TravelEntry>();
  let travellers = Map.empty<Principal, Traveller.Traveller>();
  let userAppData = Map.empty<Principal, AppData>();
  let coTravellerIncomes = Map.empty<Principal, List.List<CoTravellerIncome.CoTravellerIncome>>();

  func compareByAmount(a : (Principal, Nat), b : (Principal, Nat)) : Order.Order {
    Nat.compare(a.1, b.1);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let currentTime = Time.now();

    let existingAppData = switch (userAppData.get(caller)) {
      case (null) {
        {
          userProfile = ?profile;
          ledgerState = null;
          lastUpdated = currentTime;
          version = 1;
        };
      };
      case (?appData) {
        {
          appData with
          userProfile = ?profile;
          lastUpdated = currentTime;
          version = appData.version + 1;
        };
      };
    };

    userAppData.add(caller, existingAppData);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profiles");
    };
    switch (userAppData.get(caller)) {
      case (?appData) { appData.userProfile };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access other users' profiles");
    };
    switch (userAppData.get(user)) {
      case (?appData) { appData.userProfile };
      case (null) { null };
    };
  };

  public query ({ caller }) func fetchAppData() : async ?AppData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch app data");
    };
    userAppData.get(caller);
  };

  public shared ({ caller }) func saveAppData(newAppData : AppData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save app data");
    };

    let currentTime = Time.now();
    let mergedAppData = {
      newAppData with
      lastUpdated = currentTime;
      version = newAppData.version + 1;
    };

    userAppData.add(caller, mergedAppData);
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

  public query ({ caller }) func getBalance() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their balance");
    };
    switch (pendingBalances.get(caller)) {
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

    if (participants.size() == 0) {
      Runtime.trap("Cannot charge zero participants");
    };

    let amountPerParticipant = amount / participants.size();

    for (participant in participants.vals()) {
      let currentBalance = switch (pendingBalances.get(participant)) {
        case (null) { 0 };
        case (?balance) { balance };
      };

      pendingBalances.add(participant, currentBalance + amountPerParticipant);
    };
  };

  public shared ({ caller }) func addCoTravellerIncome(amount : Nat, date : Date.Date, note : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add co-traveller income");
    };

    let newIncome : CoTravellerIncome.CoTravellerIncome = {
      amount;
      date;
      note;
    };

    switch (coTravellerIncomes.get(caller)) {
      case (null) {
        let incomeList = List.empty<CoTravellerIncome.CoTravellerIncome>();
        incomeList.add(newIncome);
        coTravellerIncomes.add(caller, incomeList);
      };
      case (?existingIncomes) {
        existingIncomes.add(newIncome);
      };
    };
  };

  public query ({ caller }) func getCoTravellerIncomes(user : Principal) : async [CoTravellerIncome.CoTravellerIncome] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own co-traveller incomes");
    };
    switch (coTravellerIncomes.get(user)) {
      case (null) { [] };
      case (?incomes) { incomes.toArray() };
    };
  };
};

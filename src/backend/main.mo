import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  //---------------------- Data Models ----------------------
  // Date representation.
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

  // Core user profile (kept stable — do NOT add fields here).
  public type UserProfile = {
    name : Text;
  };

  // Extended profile stored separately to avoid stable-variable compatibility issues.
  public type UserProfileExtended = {
    firstName : ?Text;
    lastName : ?Text;
    phone : ?Text;
    sex : ?Text;
    vehicleNumber : ?Text;
    profilePicture : ?Text;
  };

  // Payments.
  module Payment {
    public type Payment = {
      amount : Nat;
      date : Date.Date;
      note : ?Text;
    };
  };

  //---------------------- Transactions ----------------------
  // Monetary event structure.
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

  //---------------------- Expenses ----------------------
  // Trip time (morning/evening).
  public type TripTime = {
    #morning;
    #evening;
  };

  // Income from co-travellers.
  module CoTravellerIncome {
    public type CoTravellerIncome = {
      amount : Nat;
      date : Date.Date;
      note : ?Text;
      tripTime : ?TripTime;
    };
  };

  // Expense categories.
  public type Category = {
    #food;
    #transport;
    #accomodation;
    #activity;
    #other;
    #shopping;
    #cashWithdrawal;
    #entryFee;
    #tips;
  };

  module Expense {
    public type Expense = {
      amount : Nat;
      category : Category;
      date : Date.Date;
      note : ?Text;
      tripTime : ?TripTime;
    };
  };

  //---------------------- Pending Amounts ----------------------
  module OtherPendingAmount {
    public type OtherPendingAmount = {
      id : Text;
      traveller : Text;
      date : Date.Date;
      amount : Nat;
      comment : ?Text;
    };
  };

  //---------------------- App Data ----------------------
  public type AppData = {
    userProfile : ?UserProfile;
    ledgerState : ?Text;
    lastUpdated : Time.Time;
    version : Nat;
    otherPendingAmounts : [OtherPendingAmount.OtherPendingAmount];
  };

  // Persistent Maps
  let pendingBalances = Map.empty<Principal, Nat>();
  let entries = Map.empty<Text, TravelEntry.TravelEntry>();
  let travellers = Map.empty<Principal, Traveller.Traveller>();
  let userAppData = Map.empty<Principal, AppData>();
  let coTravellerIncomes = Map.empty<Principal, List.List<CoTravellerIncome.CoTravellerIncome>>();
  let expenseLists = Map.empty<Principal, List.List<Expense.Expense>>();
  // Separate map for extended profile fields — new, never stored before.
  let userProfileExtendedMap = Map.empty<Principal, UserProfileExtended>();

  //---------------------- Helper Functions ----------------------
  // Compare balances by amount.
  func compareByAmount(a : (Principal, Nat), b : (Principal, Nat)) : Order.Order {
    Nat.compare(a.1, b.1);
  };

  //---------------------- User Profiles ----------------------
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let currentTime = Time.now();
    let newAppData = switch (userAppData.get(caller)) {
      case (null) {
        {
          userProfile = ?profile;
          ledgerState = null;
          lastUpdated = currentTime;
          version = 1;
          otherPendingAmounts = [];
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

    userAppData.add(caller, newAppData);
  };

  // Get current user's profile.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profiles");
    };
    switch (userAppData.get(caller)) {
      case (?appData) { appData.userProfile };
      case (null) { null };
    };
  };

  // Retrieve profile for a specific user (admin only).
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access other users' profiles");
    };
    switch (userAppData.get(user)) {
      case (?appData) { appData.userProfile };
      case (null) { null };
    };
  };

  // Save extended profile fields.
  public shared ({ caller }) func saveCallerUserProfileExtended(profile : UserProfileExtended) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfileExtendedMap.add(caller, profile);
  };

  // Get extended profile fields.
  public query ({ caller }) func getCallerUserProfileExtended() : async ?UserProfileExtended {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their profiles");
    };
    userProfileExtendedMap.get(caller);
  };

  //---------------------- App Data Management ----------------------
  // Fetch complete app data object.
  public query ({ caller }) func fetchAppData() : async ?AppData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch app data");
    };
    userAppData.get(caller);
  };

  // Save/Update entire app data object.
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

  //---------------------- Expenses Management ----------------------
  // Get expenses of a specific user (admin only).
  public query ({ caller }) func getExpenses(user : Principal) : async [Expense.Expense] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own expenses");
    };
    switch (expenseLists.get(user)) {
      case (null) { [] };
      case (?expenses) { expenses.toArray() };
    };
  };

  //---------------------- Balances ----------------------
  // Get all balances (admin).
  public query ({ caller }) func getAllBalances() : async [(Principal, Nat)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all balances");
    };

    pendingBalances.toArray().sort(compareByAmount);
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

  //---------------------- Charges ----------------------
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

  //---------------------- Incomes ----------------------
  // Add travel income from a co-traveller.
  public shared ({ caller }) func addCoTravellerIncome(income : CoTravellerIncome.CoTravellerIncome) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add co-traveller income");
    };

    switch (coTravellerIncomes.get(caller)) {
      case (null) {
        let incomeList = List.empty<CoTravellerIncome.CoTravellerIncome>();
        incomeList.add(income);
        coTravellerIncomes.add(caller, incomeList);
      };
      case (?existingIncomes) {
        existingIncomes.add(income);
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

  //---------------------- Expenses ----------------------
  // Add a single expense.
  public shared ({ caller }) func addExpense(expense : Expense.Expense) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    let existingExpenses = switch (expenseLists.get(caller)) {
      case (null) { List.empty<Expense.Expense>() };
      case (?list) { list };
    };

    existingExpenses.add(expense);
    expenseLists.add(caller, existingExpenses);
  };

  // Add multiple expenses at once.
  public shared ({ caller }) func addExpenses(expenses : [Expense.Expense]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    let existingExpenses = switch (expenseLists.get(caller)) {
      case (null) { List.empty<Expense.Expense>() };
      case (?list) { list };
    };

    for (expense in expenses.values()) {
      existingExpenses.add(expense);
    };

    expenseLists.add(caller, existingExpenses);
  };

  //---------------------- Other Pending Amounts ----------------------
  // Add/Update a single pending amount.
  public shared ({ caller }) func addOrUpdateOtherPendingAmount(amount : OtherPendingAmount.OtherPendingAmount) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can modify pending amounts");
    };

    let currentAppData = switch (userAppData.get(caller)) {
      case (null) {
        {
          userProfile = null;
          ledgerState = null;
          lastUpdated = Time.now();
          version = 1;
          otherPendingAmounts = [];
        };
      };
      case (?appData) { appData };
    };

    // Update or add entry based on id.
    let filteredAmounts = currentAppData.otherPendingAmounts.filter(
      func(existing) {
        existing.id != amount.id;
      }
    );

    let newAmounts = filteredAmounts.concat([amount]);
    userAppData.add(
      caller,
      {
        currentAppData with
        otherPendingAmounts = newAmounts;
        lastUpdated = Time.now();
        version = currentAppData.version + 1;
      },
    );
  };

  // Delete a pending amount by id.
  public shared ({ caller }) func deleteOtherPendingAmount(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete pending amounts");
    };

    switch (userAppData.get(caller)) {
      case (null) {
        Runtime.trap("No app data found for user");
      };
      case (?currentAppData) {
        let filteredAmounts = currentAppData.otherPendingAmounts.filter(
          func(amount) {
            amount.id != id;
          }
        );

        userAppData.add(
          caller,
          {
            currentAppData with
            otherPendingAmounts = filteredAmounts;
            lastUpdated = Time.now();
            version = currentAppData.version + 1;
          },
        );
      };
    };
  };

  // Get all other pending amounts for current user.
  public query ({ caller }) func getOtherPendingAmounts() : async [OtherPendingAmount.OtherPendingAmount] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their pending amounts");
    };
    switch (userAppData.get(caller)) {
      case (null) { [] };
      case (?appData) { appData.otherPendingAmounts };
    };
  };
};

import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  //---------------------- Old Data Structures ----------------------
  type Date = {
    year : Nat;
    month : Nat;
    day : Nat;
  };

  type UserProfile = {
    name : Text;
  };

  type Payment = {
    amount : Nat;
    date : Date;
    note : ?Text;
  };

  type MonetaryEvent = {
    description : Text;
    amount : Nat;
    participants : [Principal];
    timestamp : Time.Time;
    payments : List.List<Payment>;
  };

  type TravelEntry = {
    date : Date;
    events : List.List<MonetaryEvent>;
  };

  type Traveller = {
    principal : Principal;
    pseudo : Text;
  };

  type TripTime = {
    #morning;
    #evening;
  };

  type CoTravellerIncome = {
    amount : Nat;
    date : Date;
    note : ?Text;
    tripTime : ?TripTime;
  };

  type Category = {
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

  type Expense = {
    amount : Nat;
    category : Category;
    date : Date;
    note : ?Text;
    tripTime : ?TripTime;
  };

  type OldAppData = {
    userProfile : ?UserProfile;
    ledgerState : ?Text;
    lastUpdated : Time.Time;
    version : Nat;
  };

  type OldActor = {
    pendingBalances : Map.Map<Principal, Nat>;
    entries : Map.Map<Text, TravelEntry>;
    travellers : Map.Map<Principal, Traveller>;
    userAppData : Map.Map<Principal, OldAppData>;
    coTravellerIncomes : Map.Map<Principal, List.List<CoTravellerIncome>>;
    expenseLists : Map.Map<Principal, List.List<Expense>>;
  };

  //---------------------- New Data Structures ----------------------
  type OtherPendingAmount = {
    id : Text;
    traveller : Text;
    date : Date;
    amount : Nat;
    comment : ?Text;
  };

  type AppData = {
    userProfile : ?UserProfile;
    ledgerState : ?Text;
    lastUpdated : Time.Time;
    version : Nat;
    otherPendingAmounts : [OtherPendingAmount];
  };

  type NewActor = {
    pendingBalances : Map.Map<Principal, Nat>;
    entries : Map.Map<Text, TravelEntry>;
    travellers : Map.Map<Principal, Traveller>;
    userAppData : Map.Map<Principal, AppData>;
    coTravellerIncomes : Map.Map<Principal, List.List<CoTravellerIncome>>;
    expenseLists : Map.Map<Principal, List.List<Expense>>;
  };

  //---------------------- Migration Function ----------------------
  public func run(old : OldActor) : NewActor {
    let migratedAppData = old.userAppData.map<Principal, OldAppData, AppData>(
      func(_principal, oldAppData) {
        {
          oldAppData with
          otherPendingAmounts = [];
        };
      }
    );

    { old with userAppData = migratedAppData };
  };
};

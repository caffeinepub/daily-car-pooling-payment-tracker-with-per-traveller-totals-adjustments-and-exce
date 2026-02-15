import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  public type Date = {
    year : Nat;
    month : Nat;
    day : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  public type Payment = {
    amount : Nat;
    date : Date;
    note : ?Text;
  };

  public type MonetaryEvent = {
    description : Text;
    amount : Nat;
    participants : [Principal];
    timestamp : Time.Time;
    payments : List.List<Payment>;
  };

  public type TravelEntry = {
    date : Date;
    events : List.List<MonetaryEvent>;
  };

  public type OldTraveller = {
    principal : Principal;
    name : Text;
  };

  public type NewTraveller = {
    principal : Principal;
    pseudo : Text;
  };

  public type CoTravellerIncome = {
    amount : Nat;
    date : Date;
    note : ?Text;
  };

  public type AppData = {
    userProfile : ?UserProfile;
    ledgerState : ?Text;
    lastUpdated : Time.Time;
    version : Nat;
  };

  public type OldActor = {
    pendingBalances : Map.Map<Principal, Nat>;
    entries : Map.Map<Text, TravelEntry>;
    travellers : Map.Map<Principal, OldTraveller>;
    userAppData : Map.Map<Principal, AppData>;
    coTravellerIncomes : Map.Map<Principal, List.List<CoTravellerIncome>>;
  };

  public type NewActor = {
    pendingBalances : Map.Map<Principal, Nat>;
    entries : Map.Map<Text, TravelEntry>;
    travellers : Map.Map<Principal, NewTraveller>;
    userAppData : Map.Map<Principal, AppData>;
    coTravellerIncomes : Map.Map<Principal, List.List<CoTravellerIncome>>;
  };

  public func run(old : OldActor) : NewActor {
    let newTravellers = old.travellers.map<Principal, OldTraveller, NewTraveller>(
      func(_, oldTraveller) {
        { oldTraveller with pseudo = oldTraveller.name };
      }
    );
    { old with travellers = newTravellers };
  };
};

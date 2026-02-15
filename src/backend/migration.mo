import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    name : Text;
  };

  type NewAppData = {
    userProfile : ?OldUserProfile;
    ledgerState : ?Text;
    lastUpdated : Time.Time;
    version : Nat;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewActor = {
    userAppData : Map.Map<Principal, NewAppData>;
  };

  public func run(old : OldActor) : NewActor {
    let currentTime = Time.now();
    let newUserAppData = old.userProfiles.map<Principal, OldUserProfile, NewAppData>(
      func(_principal, profile) {
        {
          userProfile = ?profile;
          ledgerState = null;
          lastUpdated = currentTime;
          version = 1;
        };
      }
    );
    { userAppData = newUserAppData };
  };
};

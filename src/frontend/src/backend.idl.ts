/**
 * Candid interface definition for the backend canister.
 * This file provides the IDL factory needed to create actors.
 */

export const idlFactory = ({ IDL }: any) => {
  const UserRole = IDL.Variant({
    'admin': IDL.Null,
    'user': IDL.Null,
    'guest': IDL.Null,
  });
  
  const UserProfile = IDL.Record({
    'name': IDL.Text,
  });
  
  const Date_ = IDL.Record({
    'day': IDL.Nat,
    'month': IDL.Nat,
    'year': IDL.Nat,
  });
  
  const Amount = IDL.Nat;
  
  return IDL.Service({
    'assignCallerUserRole': IDL.Func([IDL.Principal, UserRole], [], []),
    'getAllBalances': IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, Amount))], ['query']),
    'getBalance': IDL.Func([IDL.Principal], [Amount], ['query']),
    'getCallerUserProfile': IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole': IDL.Func([], [UserRole], ['query']),
    'getUserProfile': IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'isCallerAdmin': IDL.Func([], [IDL.Bool], ['query']),
    'recordPayment': IDL.Func([Date_, Amount, IDL.Opt(IDL.Text)], [], []),
    'saveCallerUserProfile': IDL.Func([UserProfile], [], []),
    'startCharge': IDL.Func([IDL.Text, Amount, IDL.Vec(IDL.Principal)], [], []),
    '_initializeAccessControlWithSecret': IDL.Func([IDL.Text], [], []),
  });
};

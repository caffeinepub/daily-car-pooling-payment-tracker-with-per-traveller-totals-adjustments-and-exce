import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CoTravellerIncome {
    date: Date_;
    note?: string;
    amount: bigint;
}
export interface AppData {
    lastUpdated: Time;
    version: bigint;
    ledgerState?: string;
    userProfile?: UserProfile;
}
export type Time = bigint;
export interface Date_ {
    day: bigint;
    month: bigint;
    year: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCoTravellerIncome(amount: bigint, date: Date_, note: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    fetchAppData(): Promise<AppData | null>;
    getAllBalances(): Promise<Array<[Principal, bigint]>>;
    getBalance(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoTravellerIncomes(user: Principal): Promise<Array<CoTravellerIncome>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveAppData(newAppData: AppData): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startCharge(description: string, amount: bigint, participants: Array<Principal>): Promise<void>;
}

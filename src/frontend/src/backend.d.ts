import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Date_ {
    day: bigint;
    month: bigint;
    year: bigint;
}
export type Amount = bigint;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllBalances(): Promise<Array<[Principal, Amount]>>;
    getBalance(user: Principal): Promise<Amount>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordPayment(eventDate: Date_, amount: Amount, note: string | null): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startCharge(description: string, amount: Amount, participants: Array<Principal>): Promise<void>;
}

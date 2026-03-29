import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShareAccessEntry {
    permissions: Array<TabPermission>;
    email: string;
}
export type Time = bigint;
export interface UserProfileExtended {
    sex?: string;
    vehicleNumber?: string;
    phone?: string;
    profilePicture?: string;
    lastName?: string;
    firstName?: string;
}
export interface OtherPendingAmount {
    id: string;
    date: Date_;
    traveller: string;
    comment?: string;
    amount: bigint;
}
export interface Date_ {
    day: bigint;
    month: bigint;
    year: bigint;
}
export interface AppData {
    lastUpdated: Time;
    otherPendingAmounts: Array<OtherPendingAmount>;
    version: bigint;
    ledgerState?: string;
    userProfile?: UserProfile;
}
export interface Expense {
    tripTime?: TripTime;
    date: Date_;
    note?: string;
    category: Category;
    amount: bigint;
}
export interface SharedDataResult {
    permissions: Array<TabPermission>;
    ledgerState?: string;
}
export interface CoTravellerIncome {
    tripTime?: TripTime;
    date: Date_;
    note?: string;
    amount: bigint;
}
export interface TabPermission {
    access: string;
    tabKey: string;
}
export interface UserProfile {
    name: string;
}
export enum Category {
    accomodation = "accomodation",
    cashWithdrawal = "cashWithdrawal",
    other = "other",
    food = "food",
    transport = "transport",
    tips = "tips",
    shopping = "shopping",
    entryFee = "entryFee",
    activity = "activity"
}
export enum TripTime {
    morning = "morning",
    evening = "evening"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCoTravellerIncome(income: CoTravellerIncome): Promise<void>;
    addExpense(expense: Expense): Promise<void>;
    addExpenses(expenses: Array<Expense>): Promise<void>;
    addOrUpdateOtherPendingAmount(amount: OtherPendingAmount): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteOtherPendingAmount(id: string): Promise<void>;
    fetchAppData(): Promise<AppData | null>;
    getAdminSharedData(admin: Principal): Promise<SharedDataResult | null>;
    getAdminSharedDataByEmail(admin: Principal, email: string): Promise<SharedDataResult | null>;
    getAllBalances(): Promise<Array<[Principal, bigint]>>;
    getBalance(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserProfileExtended(): Promise<UserProfileExtended | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoTravellerIncomes(user: Principal): Promise<Array<CoTravellerIncome>>;
    getExpenses(user: Principal): Promise<Array<Expense>>;
    getOtherPendingAmounts(): Promise<Array<OtherPendingAmount>>;
    getShareAccessConfig(): Promise<Array<ShareAccessEntry>>;
    getShareAccessVisitCounts(): Promise<Array<[string, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordSharedUserVisit(admin: Principal, email: string): Promise<void>;
    registerSharedUserEmail(email: string): Promise<void>;
    saveAppData(newAppData: AppData): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCallerUserProfileExtended(profile: UserProfileExtended): Promise<void>;
    saveShareAccessConfig(configs: Array<ShareAccessEntry>): Promise<void>;
    startCharge(description: string, amount: bigint, participants: Array<Principal>): Promise<void>;
}

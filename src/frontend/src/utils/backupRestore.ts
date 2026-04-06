import type {
  CarExpense,
  CashPayment,
  CoTravellerIncome,
  DailyData,
  OtherPending,
  PerDayAutoTollSelection,
  Traveller,
} from "../hooks/useLedgerLocalState";
import type { UserProfileExtended } from "../hooks/useUserProfileExtended";
import type { RateHistoryEntry } from "./rateHistory";

export interface LocalLedgerState {
  travellers: Traveller[];
  dailyData: DailyData;
  dateRange: { start: string; end: string };
  ratePerTrip: number;
  rateHistory?: RateHistoryEntry[];
  cashPayments: CashPayment[];
  otherPending: OtherPending[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
  coTravellerIncomes?: CoTravellerIncome[];
  perDayAutoTollSelection?: PerDayAutoTollSelection;
  userProfileExtended?: UserProfileExtended;
}

export interface BackupData {
  version: number;
  timestamp: string;
  ledgerState: LocalLedgerState;
}

export interface BackupPayload {
  version: number;
  timestamp: string;
  localState: LocalLedgerState;
}

export function exportBackup(ledgerState: LocalLedgerState): string {
  const backup: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    ledgerState,
  };
  return JSON.stringify(backup, null, 2);
}

export function exportBackupToFile(ledgerState: LocalLedgerState): void {
  const backupJson = exportBackup(ledgerState);
  const blob = new Blob([backupJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  link.href = url;
  link.download = `carpool-backup-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importBackupFromFile(file: File): Promise<BackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = validateBackup(content);
        resolve({
          version: backup.version,
          timestamp: backup.timestamp,
          localState: backup.ledgerState,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

export function validateBackup(jsonString: string): BackupData {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed.version || !parsed.timestamp || !parsed.ledgerState) {
      throw new Error("Invalid backup format: missing required fields");
    }

    const state = parsed.ledgerState;
    if (
      !Array.isArray(state.travellers) ||
      !state.dailyData ||
      !state.dateRange
    ) {
      throw new Error("Invalid backup format: malformed ledger state");
    }

    return parsed as BackupData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw error;
  }
}

export function mergeLocalStates(
  local: LocalLedgerState,
  remote: LocalLedgerState,
): LocalLedgerState {
  // Merge travellers by ID (union)
  const travellerMap = new Map<string, Traveller>();
  for (const t of [...local.travellers, ...remote.travellers]) {
    if (!travellerMap.has(t.id)) travellerMap.set(t.id, t);
  }

  // Merge dailyData with OR logic
  const mergedDailyData: DailyData = {};
  const allDateKeys = new Set([
    ...Object.keys(local.dailyData),
    ...Object.keys(remote.dailyData),
  ]);

  for (const dateKey of allDateKeys) {
    const localDay = local.dailyData[dateKey] || {};
    const remoteDay = remote.dailyData[dateKey] || {};
    const allTravellerIds = new Set([
      ...Object.keys(localDay),
      ...Object.keys(remoteDay),
    ]);

    mergedDailyData[dateKey] = {};
    for (const travellerId of allTravellerIds) {
      const localTrip = localDay[travellerId] || {
        morning: false,
        evening: false,
      };
      const remoteTrip = remoteDay[travellerId] || {
        morning: false,
        evening: false,
      };
      mergedDailyData[dateKey][travellerId] = {
        morning: localTrip.morning || remoteTrip.morning,
        evening: localTrip.evening || remoteTrip.evening,
      };
    }
  }

  // Merge payments by ID (union)
  const paymentMap = new Map<string, CashPayment>();
  for (const p of [...local.cashPayments, ...remote.cashPayments]) {
    if (!paymentMap.has(p.id)) paymentMap.set(p.id, p);
  }

  // Merge other pending by ID (union)
  const otherPendingMap = new Map<string, OtherPending>();
  for (const p of [...local.otherPending, ...remote.otherPending]) {
    if (!otherPendingMap.has(p.id)) otherPendingMap.set(p.id, p);
  }

  // Merge car expenses by ID (union)
  const expenseMap = new Map<string, CarExpense>();
  for (const e of [...local.carExpenses, ...remote.carExpenses]) {
    if (!expenseMap.has(e.id)) expenseMap.set(e.id, e);
  }

  // Merge co-traveller incomes by ID (union)
  const coTravellerIncomeMap = new Map<string, CoTravellerIncome>();
  for (const income of [
    ...(local.coTravellerIncomes || []),
    ...(remote.coTravellerIncomes || []),
  ]) {
    if (!coTravellerIncomeMap.has(income.id))
      coTravellerIncomeMap.set(income.id, income);
  }

  // Merge rateHistory by ID (union)
  const rateHistoryMap = new Map<string, RateHistoryEntry>();
  for (const e of [
    ...(local.rateHistory || []),
    ...(remote.rateHistory || []),
  ]) {
    if (!rateHistoryMap.has(e.id)) rateHistoryMap.set(e.id, e);
  }

  // Merge perDayAutoTollSelection with OR logic
  const mergedPerDayAutoTollSelection: PerDayAutoTollSelection = {};
  const localSelection = local.perDayAutoTollSelection || {};
  const remoteSelection = remote.perDayAutoTollSelection || {};
  for (const dateKey of new Set([
    ...Object.keys(localSelection),
    ...Object.keys(remoteSelection),
  ])) {
    mergedPerDayAutoTollSelection[dateKey] =
      localSelection[dateKey] || remoteSelection[dateKey] || false;
  }

  // Merge userProfileExtended — remote wins if present, otherwise keep local
  const mergedProfileExtended =
    remote.userProfileExtended || local.userProfileExtended;

  return {
    travellers: Array.from(travellerMap.values()),
    dailyData: mergedDailyData,
    dateRange: remote.dateRange,
    ratePerTrip: remote.ratePerTrip,
    rateHistory: Array.from(rateHistoryMap.values()),
    cashPayments: Array.from(paymentMap.values()),
    otherPending: Array.from(otherPendingMap.values()),
    carExpenses: Array.from(expenseMap.values()),
    includeSaturday: remote.includeSaturday,
    includeSunday: remote.includeSunday,
    coTravellerIncomes: Array.from(coTravellerIncomeMap.values()),
    perDayAutoTollSelection: mergedPerDayAutoTollSelection,
    userProfileExtended: mergedProfileExtended,
  };
}

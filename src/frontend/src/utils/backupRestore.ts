import type { Traveller, DailyData, CashPayment, OtherPending, CarExpense, CoTravellerIncome, PerDayAutoTollSelection } from '../hooks/useLedgerLocalState';

export interface LocalLedgerState {
  travellers: Traveller[];
  dailyData: DailyData;
  dateRange: { start: string; end: string };
  ratePerTrip: number;
  cashPayments: CashPayment[];
  otherPending: OtherPending[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
  coTravellerIncomes?: CoTravellerIncome[];
  perDayAutoTollSelection?: PerDayAutoTollSelection;
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
  const blob = new Blob([backupJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
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
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

export function validateBackup(jsonString: string): BackupData {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!parsed.version || !parsed.timestamp || !parsed.ledgerState) {
      throw new Error('Invalid backup format: missing required fields');
    }

    const state = parsed.ledgerState;
    if (!Array.isArray(state.travellers) || !state.dailyData || !state.dateRange) {
      throw new Error('Invalid backup format: malformed ledger state');
    }

    return parsed as BackupData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

export function mergeLocalStates(local: LocalLedgerState, remote: LocalLedgerState): LocalLedgerState {
  // Merge travellers by ID (union)
  const travellerMap = new Map<string, Traveller>();
  [...local.travellers, ...remote.travellers].forEach((t) => {
    if (!travellerMap.has(t.id)) {
      travellerMap.set(t.id, t);
    }
  });
  const mergedTravellers = Array.from(travellerMap.values());

  // Merge dailyData with OR logic (if either has a trip, include it)
  const mergedDailyData: DailyData = {};
  const allDateKeys = new Set([...Object.keys(local.dailyData), ...Object.keys(remote.dailyData)]);
  
  allDateKeys.forEach((dateKey) => {
    const localDay = local.dailyData[dateKey] || {};
    const remoteDay = remote.dailyData[dateKey] || {};
    const allTravellerIds = new Set([...Object.keys(localDay), ...Object.keys(remoteDay)]);
    
    mergedDailyData[dateKey] = {};
    allTravellerIds.forEach((travellerId) => {
      const localTrip = localDay[travellerId] || { morning: false, evening: false };
      const remoteTrip = remoteDay[travellerId] || { morning: false, evening: false };
      
      mergedDailyData[dateKey][travellerId] = {
        morning: localTrip.morning || remoteTrip.morning,
        evening: localTrip.evening || remoteTrip.evening,
      };
    });
  });

  // Merge payments by ID (union)
  const paymentMap = new Map<string, CashPayment>();
  [...local.cashPayments, ...remote.cashPayments].forEach((p) => {
    if (!paymentMap.has(p.id)) {
      paymentMap.set(p.id, p);
    }
  });
  const mergedPayments = Array.from(paymentMap.values());

  // Merge other pending by ID (union)
  const otherPendingMap = new Map<string, OtherPending>();
  [...local.otherPending, ...remote.otherPending].forEach((p) => {
    if (!otherPendingMap.has(p.id)) {
      otherPendingMap.set(p.id, p);
    }
  });
  const mergedOtherPending = Array.from(otherPendingMap.values());

  // Merge car expenses by ID (union)
  const expenseMap = new Map<string, CarExpense>();
  [...local.carExpenses, ...remote.carExpenses].forEach((e) => {
    if (!expenseMap.has(e.id)) {
      expenseMap.set(e.id, e);
    }
  });
  const mergedExpenses = Array.from(expenseMap.values());

  // Merge co-traveller incomes by ID (union)
  const coTravellerIncomeMap = new Map<string, CoTravellerIncome>();
  const localIncomes = local.coTravellerIncomes || [];
  const remoteIncomes = remote.coTravellerIncomes || [];
  [...localIncomes, ...remoteIncomes].forEach((income) => {
    if (!coTravellerIncomeMap.has(income.id)) {
      coTravellerIncomeMap.set(income.id, income);
    }
  });
  const mergedCoTravellerIncomes = Array.from(coTravellerIncomeMap.values());

  // Merge perDayAutoTollSelection with OR logic (if either has it enabled, include it)
  const mergedPerDayAutoTollSelection: PerDayAutoTollSelection = {};
  const localSelection = local.perDayAutoTollSelection || {};
  const remoteSelection = remote.perDayAutoTollSelection || {};
  const allSelectionDateKeys = new Set([...Object.keys(localSelection), ...Object.keys(remoteSelection)]);
  
  allSelectionDateKeys.forEach((dateKey) => {
    mergedPerDayAutoTollSelection[dateKey] = localSelection[dateKey] || remoteSelection[dateKey] || false;
  });

  // Use remote settings (date range, rate, weekend inclusion) as they're likely more recent
  return {
    travellers: mergedTravellers,
    dailyData: mergedDailyData,
    dateRange: remote.dateRange,
    ratePerTrip: remote.ratePerTrip,
    cashPayments: mergedPayments,
    otherPending: mergedOtherPending,
    carExpenses: mergedExpenses,
    includeSaturday: remote.includeSaturday,
    includeSunday: remote.includeSunday,
    coTravellerIncomes: mergedCoTravellerIncomes,
    perDayAutoTollSelection: mergedPerDayAutoTollSelection,
  };
}

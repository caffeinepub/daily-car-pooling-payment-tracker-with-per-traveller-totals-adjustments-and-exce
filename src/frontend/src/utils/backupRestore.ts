export interface LocalLedgerState {
  travellers: Array<{ id: string; name: string }>;
  dailyData: Record<string, Record<string, { morning: boolean; evening: boolean }>>;
  dateRange: { start: string; end: string };
  ratePerTrip: number;
  cashPayments: Array<{ id: string; travellerId: string; amount: number; date: string; note?: string }>;
  otherPending: Array<{ id: string; travellerId: string; amount: number; date: string; note?: string }>;
  carExpenses: Array<{ id: string; date: string; category: string; amount: number; note?: string }>;
  includeSaturday: boolean;
  includeSunday: boolean;
}

export interface BackupPayload {
  version: string;
  timestamp: string;
  localState: LocalLedgerState;
}

/**
 * Export backup to a downloadable JSON file
 */
export function exportBackupToFile(localState: LocalLedgerState): void {
  const backup: BackupPayload = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    localState,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = `carpool-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import and validate backup from a JSON file
 */
export async function importBackupFromFile(file: File): Promise<BackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate backup structure
        if (!parsed.localState) {
          throw new Error('Invalid backup file: missing required sections');
        }

        if (!parsed.localState.travellers || !parsed.localState.dailyData) {
          throw new Error('Invalid backup file: missing ledger data');
        }

        resolve(parsed as BackupPayload);
      } catch (error: any) {
        reject(new Error('Failed to parse backup file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Merge backup state into existing state (non-destructive)
 */
export function mergeLocalStates(
  existing: LocalLedgerState,
  backup: LocalLedgerState
): LocalLedgerState {
  // Merge travellers by id (keep local on conflict)
  const travellerMap = new Map(existing.travellers.map(t => [t.id, t]));
  backup.travellers.forEach(t => {
    if (!travellerMap.has(t.id)) {
      travellerMap.set(t.id, t);
    }
  });

  // Merge cash payments by id (keep local on conflict)
  const paymentMap = new Map(existing.cashPayments.map(p => [p.id, p]));
  backup.cashPayments.forEach(p => {
    if (!paymentMap.has(p.id)) {
      paymentMap.set(p.id, p);
    }
  });

  // Merge other pending by id (keep local on conflict)
  const pendingMap = new Map(existing.otherPending.map(p => [p.id, p]));
  backup.otherPending.forEach(p => {
    if (!pendingMap.has(p.id)) {
      pendingMap.set(p.id, p);
    }
  });

  // Merge car expenses by id (keep local on conflict)
  const expenseMap = new Map(existing.carExpenses.map(e => [e.id, e]));
  backup.carExpenses.forEach(e => {
    if (!expenseMap.has(e.id)) {
      expenseMap.set(e.id, e);
    }
  });

  // Merge dailyData: for each date+traveller, OR the booleans
  const mergedDailyData: LocalLedgerState['dailyData'] = { ...existing.dailyData };
  
  for (const dateKey in backup.dailyData) {
    if (!mergedDailyData[dateKey]) {
      mergedDailyData[dateKey] = {};
    }
    
    for (const travellerId in backup.dailyData[dateKey]) {
      const existingTrip = mergedDailyData[dateKey][travellerId];
      const backupTrip = backup.dailyData[dateKey][travellerId];
      
      if (!existingTrip) {
        // No existing trip for this date+traveller, use backup
        mergedDailyData[dateKey][travellerId] = { ...backupTrip };
      } else {
        // Merge with OR logic
        mergedDailyData[dateKey][travellerId] = {
          morning: existingTrip.morning || backupTrip.morning,
          evening: existingTrip.evening || backupTrip.evening,
        };
      }
    }
  }

  // Settings: take from backup (as documented)
  return {
    travellers: Array.from(travellerMap.values()),
    dailyData: mergedDailyData,
    dateRange: backup.dateRange,
    ratePerTrip: backup.ratePerTrip,
    cashPayments: Array.from(paymentMap.values()),
    otherPending: Array.from(pendingMap.values()),
    carExpenses: Array.from(expenseMap.values()),
    includeSaturday: backup.includeSaturday,
    includeSunday: backup.includeSunday,
  };
}

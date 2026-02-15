import { createContext, useContext, ReactNode } from 'react';
import { useLedgerLocalState } from '../../hooks/useLedgerLocalState';
import type {
  Traveller,
  DailyData,
  DateRange,
  CashPayment,
  OtherPending,
  CarExpense,
  CoTravellerIncome,
} from '../../hooks/useLedgerLocalState';
import type { LocalLedgerState } from '../../utils/backupRestore';

interface LedgerState {
  travellers: Traveller[];
  dailyData: DailyData;
  draftDailyData: DailyData;
  dateRange: DateRange;
  ratePerTrip: number;
  cashPayments: CashPayment[];
  otherPending: OtherPending[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
  coTravellerIncomes: CoTravellerIncome[];
  stateRevision: number;
  addTraveller: (name: string) => void;
  renameTraveller: (id: string, newName: string) => void;
  removeTraveller: (id: string) => void;
  toggleDraftTrip: (dateKey: string, travellerId: string, period: 'morning' | 'evening') => void;
  setDraftTripsForAllTravellers: (dateKey: string, morning: boolean, evening: boolean) => void;
  saveDraftDailyData: () => void;
  discardDraftDailyData: () => void;
  hasDraftChanges: () => boolean;
  updateTravellerParticipation: (travellerId: string, date: string, morning: boolean, evening: boolean) => void;
  deleteTravellerParticipation: (travellerId: string, date: string) => void;
  setDateRange: (range: DateRange) => void;
  setRatePerTrip: (rate: number) => void;
  addCashPayment: (payment: Omit<CashPayment, 'id'>) => void;
  updateCashPayment: (id: string, updates: Partial<CashPayment>) => void;
  removeCashPayment: (id: string) => void;
  addOtherPending: (pending: Omit<OtherPending, 'id'>) => void;
  addCarExpense: (expense: Omit<CarExpense, 'id'>) => void;
  updateCarExpense: (id: string, updates: Partial<CarExpense>) => void;
  removeCarExpense: (id: string) => void;
  addCoTravellerIncome: (income: CoTravellerIncome) => void;
  updateCoTravellerIncome: (id: string, amount: number, date: string, note?: string) => void;
  removeCoTravellerIncome: (id: string) => void;
  setIncludeSaturday: (include: boolean) => void;
  setIncludeSunday: (include: boolean) => void;
  clearAllLedgerData: () => void;
  clearDailyData: () => void;
  clearCashPayments: () => void;
  clearOtherPending: () => void;
  clearCarExpenses: () => void;
  getPersistedState: () => LocalLedgerState;
  applyMergedState: (mergedState: LocalLedgerState) => void;
  mergeRestoreFromBackup: (backupState: LocalLedgerState) => void;
}

const LedgerStateContext = createContext<LedgerState | undefined>(undefined);

export function LedgerStateProvider({ children }: { children: ReactNode }) {
  const ledgerState = useLedgerLocalState();

  return (
    <LedgerStateContext.Provider value={ledgerState}>
      {children}
    </LedgerStateContext.Provider>
  );
}

export function useLedgerState() {
  const context = useContext(LedgerStateContext);
  if (!context) {
    throw new Error('useLedgerState must be used within LedgerStateProvider');
  }
  return context;
}

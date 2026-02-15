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
  PerDayAutoTollSelection,
} from '../../hooks/useLedgerLocalState';
import type { LocalLedgerState } from '../../utils/backupRestore';

interface LedgerStateContextValue {
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
  perDayAutoTollSelection: PerDayAutoTollSelection;
  stateRevision: number;
  addTraveller: (name: string) => void;
  renameTraveller: (id: string, newName: string) => void;
  removeTraveller: (id: string) => void;
  toggleDraftTrip: (dateKey: string, travellerId: string, period: 'morning' | 'evening') => void;
  setDraftTripsForAllTravellers: (dateKey: string, morning: boolean, evening: boolean) => void;
  updateTravellerTrip: (dateKey: string, travellerId: string, morning: boolean, evening: boolean) => void;
  saveDraftDailyData: () => void;
  discardDraftDailyData: () => void;
  hasDraftChanges: () => boolean;
  setDateRange: (range: DateRange) => void;
  setRatePerTrip: (rate: number) => void;
  addCashPayment: (payment: Omit<CashPayment, 'id'>) => void;
  updateCashPayment: (id: string, updates: Partial<Omit<CashPayment, 'id'>>) => void;
  removeCashPayment: (id: string) => void;
  addOtherPending: (pending: Omit<OtherPending, 'id'>) => void;
  removeOtherPending: (id: string) => void;
  addCarExpense: (expense: Omit<CarExpense, 'id'>) => void;
  updateCarExpense: (id: string, updates: Partial<Omit<CarExpense, 'id'>>) => void;
  removeCarExpense: (id: string) => void;
  addCoTravellerIncome: (income: CoTravellerIncome) => void;
  updateCoTravellerIncome: (id: string, updates: Partial<Omit<CoTravellerIncome, 'id'>>) => void;
  removeCoTravellerIncome: (id: string) => void;
  setIncludeSaturday: (include: boolean) => void;
  setIncludeSunday: (include: boolean) => void;
  togglePerDayAutoToll: (dateKey: string) => void;
  clearAllLedgerData: () => void;
  clearDailyData: () => void;
  clearCashPayments: () => void;
  clearOtherPending: () => void;
  clearCarExpenses: () => void;
  getPersistedState: () => LocalLedgerState;
  applyMergedState: (state: LocalLedgerState) => void;
  mergeRestoreFromBackup: (backupState: LocalLedgerState) => void;
}

const LedgerStateContext = createContext<LedgerStateContextValue | null>(null);

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

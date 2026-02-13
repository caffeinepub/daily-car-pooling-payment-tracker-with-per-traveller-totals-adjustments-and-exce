import { createContext, useContext, ReactNode } from 'react';
import { useLedgerLocalState } from '../../hooks/useLedgerLocalState';
import type {
  Traveller,
  DailyData,
  DateRange,
  CashPayment,
  OtherPending,
  CarExpense,
} from '../../types/ledger';

interface LedgerStateContextValue {
  travellers: Traveller[];
  addTraveller: (name: string) => void;
  renameTraveller: (id: string, newName: string) => void;
  removeTraveller: (id: string) => void;
  dailyData: DailyData;
  draftDailyData: DailyData;
  toggleDraftTrip: (dateKey: string, travellerId: string, period: 'morning' | 'evening') => void;
  setDraftTripsForAllTravellers: (dateKey: string, morning: boolean, evening: boolean) => void;
  saveDraftDailyData: () => void;
  discardDraftDailyData: () => void;
  hasDraftChanges: () => boolean;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  ratePerTrip: number;
  setRatePerTrip: (rate: number) => void;
  cashPayments: CashPayment[];
  addCashPayment: (payment: Omit<CashPayment, 'id'>) => void;
  updateCashPayment: (id: string, updates: Partial<Omit<CashPayment, 'id'>>) => void;
  removeCashPayment: (id: string) => void;
  otherPending: OtherPending[];
  addOtherPending: (pending: Omit<OtherPending, 'id'>) => void;
  carExpenses: CarExpense[];
  addCarExpense: (expense: Omit<CarExpense, 'id'>) => void;
  updateCarExpense: (id: string, updates: Partial<Omit<CarExpense, 'id'>>) => void;
  removeCarExpense: (id: string) => void;
  includeSaturday: boolean;
  setIncludeSaturday: (include: boolean) => void;
  includeSunday: boolean;
  setIncludeSunday: (include: boolean) => void;
  clearAllLedgerData: () => void;
  clearDailyData: () => void;
  clearCashPayments: () => void;
  clearOtherPending: () => void;
  clearCarExpenses: () => void;
  refreshFromCanister: () => void;
  isLoading: boolean;
}

const LedgerStateContext = createContext<LedgerStateContextValue | null>(null);

export function LedgerStateProvider({ children }: { children: ReactNode }) {
  const state = useLedgerLocalState();
  return <LedgerStateContext.Provider value={state}>{children}</LedgerStateContext.Provider>;
}

export function useLedgerState() {
  const context = useContext(LedgerStateContext);
  if (!context) {
    throw new Error('useLedgerState must be used within LedgerStateProvider');
  }
  return context;
}

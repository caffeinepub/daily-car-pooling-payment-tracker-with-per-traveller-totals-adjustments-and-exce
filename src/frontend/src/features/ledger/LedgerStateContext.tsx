import { createContext, useContext, ReactNode } from 'react';
import { useLedgerLocalState } from '../../hooks/useLedgerLocalState';
import type { Traveller, DateRange, DailyData, CashPayment } from '../../hooks/useLedgerLocalState';

interface LedgerStateContextValue {
  travellers: Traveller[];
  addTraveller: (name: string) => void;
  removeTraveller: (id: string) => void;
  renameTraveller: (id: string, newName: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  dailyData: DailyData;
  toggleTrip: (dateKey: string, travellerId: string, trip: 'morning' | 'evening') => void;
  ratePerTrip: number;
  setRatePerTrip: (rate: number) => void;
  cashPayments: CashPayment[];
  addCashPayment: (travellerId: string, amount: number, date: string, note?: string) => void;
  removeCashPayment: (paymentId: string) => void;
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

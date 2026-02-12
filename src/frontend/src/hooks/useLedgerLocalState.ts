import { useState, useEffect } from 'react';

export interface Traveller {
  id: string;
  name: string;
}

export interface TripData {
  morning: boolean;
  evening: boolean;
}

export interface DailyData {
  [dateKey: string]: {
    [travellerId: string]: TripData;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CashPayment {
  id: string;
  travellerId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface OtherPending {
  id: string;
  travellerId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface CarExpense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
}

const STORAGE_KEY = 'carpool-ledger-state';

interface StoredState {
  travellers: Traveller[];
  dailyData: DailyData;
  dateRange: { start: string; end: string };
  ratePerTrip: number;
  cashPayments: CashPayment[];
  otherPending: OtherPending[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
}

// Simple UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultDateRange(): DateRange {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
}

function loadState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        includeSaturday: parsed.includeSaturday ?? false,
        includeSunday: parsed.includeSunday ?? false,
      };
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  
  const defaultRange = getDefaultDateRange();
  return {
    travellers: [],
    dailyData: {},
    dateRange: {
      start: defaultRange.start.toISOString(),
      end: defaultRange.end.toISOString(),
    },
    ratePerTrip: 50,
    cashPayments: [],
    otherPending: [],
    carExpenses: [],
    includeSaturday: false,
    includeSunday: false,
  };
}

function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export function useLedgerLocalState() {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [draftDailyData, setDraftDailyData] = useState<DailyData>({});
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [ratePerTrip, setRatePerTrip] = useState(50);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [otherPending, setOtherPending] = useState<OtherPending[]>([]);
  const [carExpenses, setCarExpenses] = useState<CarExpense[]>([]);
  const [includeSaturday, setIncludeSaturday] = useState(false);
  const [includeSunday, setIncludeSunday] = useState(false);

  // Load state on mount
  useEffect(() => {
    const loaded = loadState();
    setTravellers(loaded.travellers);
    setDailyData(loaded.dailyData);
    setDraftDailyData(loaded.dailyData);
    setDateRange({
      start: new Date(loaded.dateRange.start),
      end: new Date(loaded.dateRange.end),
    });
    setRatePerTrip(loaded.ratePerTrip);
    setCashPayments(loaded.cashPayments);
    setOtherPending(loaded.otherPending);
    setCarExpenses(loaded.carExpenses);
    setIncludeSaturday(loaded.includeSaturday);
    setIncludeSunday(loaded.includeSunday);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    const state: StoredState = {
      travellers,
      dailyData,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      ratePerTrip,
      cashPayments,
      otherPending,
      carExpenses,
      includeSaturday,
      includeSunday,
    };
    saveState(state);
  }, [travellers, dailyData, dateRange, ratePerTrip, cashPayments, otherPending, carExpenses, includeSaturday, includeSunday]);

  const addTraveller = (name: string) => {
    const newTraveller: Traveller = {
      id: generateId(),
      name,
    };
    setTravellers([...travellers, newTraveller]);
  };

  const renameTraveller = (id: string, newName: string) => {
    setTravellers(travellers.map((t) => (t.id === id ? { ...t, name: newName } : t)));
  };

  const removeTraveller = (id: string) => {
    setTravellers(travellers.filter((t) => t.id !== id));
    
    const newDailyData = { ...dailyData };
    Object.keys(newDailyData).forEach((dateKey) => {
      delete newDailyData[dateKey][id];
    });
    setDailyData(newDailyData);
    setDraftDailyData(newDailyData);
    
    setCashPayments(cashPayments.filter((p) => p.travellerId !== id));
    setOtherPending(otherPending.filter((p) => p.travellerId !== id));
  };

  const toggleDraftTrip = (dateKey: string, travellerId: string, period: 'morning' | 'evening') => {
    setDraftDailyData((prev) => {
      const newData = { ...prev };
      if (!newData[dateKey]) {
        newData[dateKey] = {};
      }
      if (!newData[dateKey][travellerId]) {
        newData[dateKey][travellerId] = { morning: false, evening: false };
      }
      newData[dateKey][travellerId] = {
        ...newData[dateKey][travellerId],
        [period]: !newData[dateKey][travellerId][period],
      };
      return newData;
    });
  };

  const setDraftTripsForAllTravellers = (dateKey: string, morning: boolean, evening: boolean) => {
    setDraftDailyData((prev) => {
      const newData = { ...prev };
      if (!newData[dateKey]) {
        newData[dateKey] = {};
      }
      travellers.forEach((t) => {
        newData[dateKey][t.id] = { morning, evening };
      });
      return newData;
    });
  };

  const saveDraftDailyData = () => {
    setDailyData(draftDailyData);
  };

  const discardDraftDailyData = () => {
    setDraftDailyData(dailyData);
  };

  const hasDraftChanges = (): boolean => {
    return JSON.stringify(dailyData) !== JSON.stringify(draftDailyData);
  };

  const addCashPayment = (payment: Omit<CashPayment, 'id'>) => {
    const newPayment: CashPayment = {
      ...payment,
      id: generateId(),
    };
    setCashPayments([...cashPayments, newPayment]);
  };

  const updateCashPayment = (id: string, updates: Partial<Omit<CashPayment, 'id'>>) => {
    setCashPayments(cashPayments.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeCashPayment = (id: string) => {
    setCashPayments(cashPayments.filter((p) => p.id !== id));
  };

  const addOtherPending = (pending: Omit<OtherPending, 'id'>) => {
    const newPending: OtherPending = {
      ...pending,
      id: generateId(),
    };
    setOtherPending([...otherPending, newPending]);
  };

  const addCarExpense = (expense: Omit<CarExpense, 'id'>) => {
    const newExpense: CarExpense = {
      ...expense,
      id: generateId(),
    };
    setCarExpenses([...carExpenses, newExpense]);
  };

  const updateCarExpense = (id: string, updates: Partial<Omit<CarExpense, 'id'>>) => {
    setCarExpenses(carExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeCarExpense = (id: string) => {
    setCarExpenses(carExpenses.filter((e) => e.id !== id));
  };

  return {
    travellers,
    addTraveller,
    renameTraveller,
    removeTraveller,
    dailyData,
    draftDailyData,
    toggleDraftTrip,
    setDraftTripsForAllTravellers,
    saveDraftDailyData,
    discardDraftDailyData,
    hasDraftChanges,
    dateRange,
    setDateRange,
    ratePerTrip,
    setRatePerTrip,
    cashPayments,
    addCashPayment,
    updateCashPayment,
    removeCashPayment,
    otherPending,
    addOtherPending,
    carExpenses,
    addCarExpense,
    updateCarExpense,
    removeCarExpense,
    includeSaturday,
    setIncludeSaturday,
    includeSunday,
    setIncludeSunday,
  };
}

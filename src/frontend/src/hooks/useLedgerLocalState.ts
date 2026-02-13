import { useState, useEffect, useCallback } from 'react';
import { useLoadLedgerState, useSaveLedgerState } from './useLedgerQueries';
import type {
  Traveller,
  TripData,
  DailyData,
  DateRange,
  CashPayment,
  OtherPending,
  CarExpense,
  LedgerState,
} from '../types/ledger';

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

// Deep clone helper to prevent shared references
function deepCloneDailyData(data: DailyData): DailyData {
  const cloned: DailyData = {};
  for (const dateKey in data) {
    cloned[dateKey] = {};
    for (const travellerId in data[dateKey]) {
      cloned[dateKey][travellerId] = {
        morning: data[dateKey][travellerId].morning,
        evening: data[dateKey][travellerId].evening,
      };
    }
  }
  return cloned;
}

function getDefaultState(): LedgerState {
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

export function useLedgerLocalState() {
  const { data: loadedState, isLoading: isLoadingState, isFetched } = useLoadLedgerState();
  const { mutate: saveState } = useSaveLedgerState();

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from canister on mount
  useEffect(() => {
    if (isFetched && !isInitialized) {
      const state = loadedState || getDefaultState();
      setTravellers(state.travellers);
      const loadedDailyData = state.dailyData;
      setDailyData(loadedDailyData);
      setDraftDailyData(deepCloneDailyData(loadedDailyData));
      setDateRange({
        start: new Date(state.dateRange.start),
        end: new Date(state.dateRange.end),
      });
      setRatePerTrip(state.ratePerTrip);
      setCashPayments(state.cashPayments);
      setOtherPending(state.otherPending);
      setCarExpenses(state.carExpenses);
      setIncludeSaturday(state.includeSaturday);
      setIncludeSunday(state.includeSunday);
      setIsInitialized(true);
    }
  }, [loadedState, isFetched, isInitialized]);

  // Persist state to canister whenever it changes
  const persistState = useCallback(() => {
    if (!isInitialized) return;

    const state: LedgerState = {
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
  }, [
    isInitialized,
    travellers,
    dailyData,
    dateRange,
    ratePerTrip,
    cashPayments,
    otherPending,
    carExpenses,
    includeSaturday,
    includeSunday,
    saveState,
  ]);

  useEffect(() => {
    persistState();
  }, [persistState]);

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
    setCashPayments(cashPayments.filter((p) => p.travellerId !== id));
    setOtherPending(otherPending.filter((p) => p.travellerId !== id));
  };

  const toggleDraftTrip = (dateKey: string, travellerId: string, period: 'morning' | 'evening') => {
    setDraftDailyData((prev) => {
      const newData = deepCloneDailyData(prev);
      
      if (!newData[dateKey]) {
        newData[dateKey] = {};
      }
      if (!newData[dateKey][travellerId]) {
        newData[dateKey][travellerId] = { morning: false, evening: false };
      }
      
      newData[dateKey][travellerId] = {
        morning: period === 'morning' ? !newData[dateKey][travellerId].morning : newData[dateKey][travellerId].morning,
        evening: period === 'evening' ? !newData[dateKey][travellerId].evening : newData[dateKey][travellerId].evening,
      };
      
      return newData;
    });
  };

  const setDraftTripsForAllTravellers = (dateKey: string, morning: boolean, evening: boolean) => {
    setDraftDailyData((prev) => {
      const newData = deepCloneDailyData(prev);
      
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
    const clonedDraft = deepCloneDailyData(draftDailyData);
    setDailyData(clonedDraft);
  };

  const discardDraftDailyData = () => {
    setDraftDailyData(deepCloneDailyData(dailyData));
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

  const clearAllLedgerData = () => {
    const defaultRange = getDefaultDateRange();
    setTravellers([]);
    setDailyData({});
    setDraftDailyData({});
    setDateRange(defaultRange);
    setRatePerTrip(50);
    setCashPayments([]);
    setOtherPending([]);
    setCarExpenses([]);
    setIncludeSaturday(false);
    setIncludeSunday(false);
  };

  const clearDailyData = () => {
    setDailyData({});
    setDraftDailyData({});
  };

  const clearCashPayments = () => {
    setCashPayments([]);
  };

  const clearOtherPending = () => {
    setOtherPending([]);
  };

  const clearCarExpenses = () => {
    setCarExpenses([]);
  };

  const refreshFromCanister = useCallback(() => {
    setIsInitialized(false);
  }, []);

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
    clearAllLedgerData,
    clearDailyData,
    clearCashPayments,
    clearOtherPending,
    clearCarExpenses,
    refreshFromCanister,
    isLoading: isLoadingState,
  };
}

export type { Traveller, TripData, DailyData, DateRange, CashPayment, OtherPending, CarExpense };

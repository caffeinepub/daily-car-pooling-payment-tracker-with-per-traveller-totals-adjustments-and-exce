import { useState, useEffect, useRef } from 'react';
import type { LocalLedgerState } from '../utils/backupRestore';
import { mergeLocalStates } from '../utils/backupRestore';
import { getCurrentWeekMondayToFriday } from '../utils/dateRange';

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

export interface CoTravellerIncome {
  id: string;
  amount: number;
  date: string;
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
  coTravellerIncomes: CoTravellerIncome[];
}

// Simple UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultDateRange(): DateRange {
  return getCurrentWeekMondayToFriday();
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

function loadState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        includeSaturday: parsed.includeSaturday ?? false,
        includeSunday: parsed.includeSunday ?? false,
        coTravellerIncomes: parsed.coTravellerIncomes ?? [],
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
    coTravellerIncomes: [],
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
  const [coTravellerIncomes, setCoTravellerIncomes] = useState<CoTravellerIncome[]>([]);
  const [stateRevision, setStateRevision] = useState(0);
  
  // Track if we should skip the next save (used for clearAllLedgerData)
  const skipNextSave = useRef(false);
  const skipRevisionIncrement = useRef(false);

  // Load state on mount
  useEffect(() => {
    const loaded = loadState();
    setTravellers(loaded.travellers);
    const loadedDailyData = loaded.dailyData;
    setDailyData(loadedDailyData);
    // Deep clone to prevent shared references
    setDraftDailyData(deepCloneDailyData(loadedDailyData));
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
    setCoTravellerIncomes(loaded.coTravellerIncomes);
  }, []);

  // Save state whenever it changes and increment revision
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    
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
      coTravellerIncomes,
    };
    saveState(state);

    // Increment revision for sync detection (skip on initial load and external merges)
    if (!skipRevisionIncrement.current) {
      setStateRevision((prev) => prev + 1);
    }
    skipRevisionIncrement.current = false;
  }, [travellers, dailyData, dateRange, ratePerTrip, cashPayments, otherPending, carExpenses, includeSaturday, includeSunday, coTravellerIncomes]);

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
    // Remove traveller from the list
    setTravellers(travellers.filter((t) => t.id !== id));
    
    // Remove traveller-specific cash payments and other pending amounts
    setCashPayments(cashPayments.filter((p) => p.travellerId !== id));
    setOtherPending(otherPending.filter((p) => p.travellerId !== id));
    
    // DO NOT remove traveller's entries from dailyData or draftDailyData
    // This preserves historical trip participation for Overall Summary income calculations
  };

  const toggleDraftTrip = (dateKey: string, travellerId: string, period: 'morning' | 'evening') => {
    setDraftDailyData((prev) => {
      // Deep clone to ensure immutability
      const newData = deepCloneDailyData(prev);
      
      if (!newData[dateKey]) {
        newData[dateKey] = {};
      }
      if (!newData[dateKey][travellerId]) {
        newData[dateKey][travellerId] = { morning: false, evening: false };
      }
      
      // Create new TripData object instead of mutating
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
    setDailyData(deepCloneDailyData(draftDailyData));
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

  const updateCashPayment = (id: string, updates: Partial<CashPayment>) => {
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

  const updateCarExpense = (id: string, updates: Partial<CarExpense>) => {
    setCarExpenses(carExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeCarExpense = (id: string) => {
    setCarExpenses(carExpenses.filter((e) => e.id !== id));
  };

  const addCoTravellerIncome = (income: CoTravellerIncome) => {
    setCoTravellerIncomes([...coTravellerIncomes, income]);
  };

  const clearAllLedgerData = () => {
    skipNextSave.current = true;
    setTravellers([]);
    setDailyData({});
    setDraftDailyData({});
    setCashPayments([]);
    setOtherPending([]);
    setCarExpenses([]);
    setCoTravellerIncomes([]);
    
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
    setRatePerTrip(50);
    setIncludeSaturday(false);
    setIncludeSunday(false);
    
    const clearedState: StoredState = {
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
      coTravellerIncomes: [],
    };
    saveState(clearedState);
    setStateRevision((prev) => prev + 1);
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

  const getPersistedState = (): LocalLedgerState => {
    return {
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
      coTravellerIncomes,
    };
  };

  const applyMergedState = (mergedState: LocalLedgerState) => {
    skipRevisionIncrement.current = true;
    
    setTravellers(mergedState.travellers);
    const newDailyData = mergedState.dailyData;
    setDailyData(newDailyData);
    setDraftDailyData(deepCloneDailyData(newDailyData));
    setDateRange({
      start: new Date(mergedState.dateRange.start),
      end: new Date(mergedState.dateRange.end),
    });
    setRatePerTrip(mergedState.ratePerTrip);
    setCashPayments(mergedState.cashPayments);
    setOtherPending(mergedState.otherPending);
    setCarExpenses(mergedState.carExpenses);
    setIncludeSaturday(mergedState.includeSaturday);
    setIncludeSunday(mergedState.includeSunday);
    setCoTravellerIncomes(mergedState.coTravellerIncomes || []);
  };

  const mergeRestoreFromBackup = (backupState: LocalLedgerState) => {
    const currentState = getPersistedState();
    const merged = mergeLocalStates(currentState, backupState);
    applyMergedState(merged);
  };

  return {
    travellers,
    dailyData,
    draftDailyData,
    dateRange,
    ratePerTrip,
    cashPayments,
    otherPending,
    carExpenses,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    stateRevision,
    addTraveller,
    renameTraveller,
    removeTraveller,
    toggleDraftTrip,
    setDraftTripsForAllTravellers,
    saveDraftDailyData,
    discardDraftDailyData,
    hasDraftChanges,
    setDateRange,
    setRatePerTrip,
    addCashPayment,
    updateCashPayment,
    removeCashPayment,
    addOtherPending,
    addCarExpense,
    updateCarExpense,
    removeCarExpense,
    addCoTravellerIncome,
    setIncludeSaturday,
    setIncludeSunday,
    clearAllLedgerData,
    clearDailyData,
    clearCashPayments,
    clearOtherPending,
    clearCarExpenses,
    getPersistedState,
    applyMergedState,
    mergeRestoreFromBackup,
  };
}

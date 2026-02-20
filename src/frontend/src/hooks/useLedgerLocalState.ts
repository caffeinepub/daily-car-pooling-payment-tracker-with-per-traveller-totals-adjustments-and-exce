import { useState, useEffect, useRef } from 'react';
import type { LocalLedgerState } from '../utils/backupRestore';
import { mergeLocalStates } from '../utils/backupRestore';
import { getCurrentMonthRange } from '../utils/dateRange';

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
  note?: string;
}

export interface PerDayAutoTollSelection {
  [dateKey: string]: boolean;
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
  perDayAutoTollSelection?: PerDayAutoTollSelection;
}

// Simple UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultDateRange(): DateRange {
  return getCurrentMonthRange();
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
        perDayAutoTollSelection: parsed.perDayAutoTollSelection ?? {},
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
    perDayAutoTollSelection: {},
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
  const [perDayAutoTollSelection, setPerDayAutoTollSelection] = useState<PerDayAutoTollSelection>({});
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
    setPerDayAutoTollSelection(loaded.perDayAutoTollSelection ?? {});
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    saveState({
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
      perDayAutoTollSelection,
    });

    if (!skipRevisionIncrement.current) {
      setStateRevision((prev) => prev + 1);
    } else {
      skipRevisionIncrement.current = false;
    }
  }, [
    travellers,
    dailyData,
    dateRange,
    ratePerTrip,
    cashPayments,
    otherPending,
    carExpenses,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    perDayAutoTollSelection,
  ]);

  const addTraveller = (name: string) => {
    const newTraveller: Traveller = {
      id: generateId(),
      name,
    };
    setTravellers((prev) => [...prev, newTraveller]);
  };

  const renameTraveller = (id: string, newName: string) => {
    setTravellers((prev) => prev.map((t) => (t.id === id ? { ...t, name: newName } : t)));
  };

  const removeTraveller = (id: string) => {
    setTravellers((prev) => prev.filter((t) => t.id !== id));
    // Also remove from daily data
    setDailyData((prev) => {
      const updated = { ...prev };
      for (const dateKey in updated) {
        const { [id]: _, ...rest } = updated[dateKey];
        updated[dateKey] = rest;
      }
      return updated;
    });
    setDraftDailyData((prev) => {
      const updated = { ...prev };
      for (const dateKey in updated) {
        const { [id]: _, ...rest } = updated[dateKey];
        updated[dateKey] = rest;
      }
      return updated;
    });
  };

  const toggleDraftTrip = (dateKey: string, travellerId: string, period: 'morning' | 'evening') => {
    setDraftDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      if (!updated[dateKey][travellerId]) {
        updated[dateKey][travellerId] = { morning: false, evening: false };
      }
      updated[dateKey][travellerId] = {
        ...updated[dateKey][travellerId],
        [period]: !updated[dateKey][travellerId][period],
      };
      return updated;
    });
  };

  const setDraftTripsForAllTravellers = (dateKey: string, morning: boolean, evening: boolean) => {
    setDraftDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      travellers.forEach((t) => {
        updated[dateKey][t.id] = { morning, evening };
      });
      return updated;
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

  const updateTravellerTrip = (dateKey: string, travellerId: string, morning: boolean, evening: boolean) => {
    setDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      updated[dateKey][travellerId] = { morning, evening };
      return updated;
    });
  };

  const addCashPayment = (payment: Omit<CashPayment, 'id'>) => {
    const newPayment: CashPayment = {
      ...payment,
      id: generateId(),
    };
    setCashPayments((prev) => [...prev, newPayment]);
  };

  const updateCashPayment = (id: string, updates: Partial<Omit<CashPayment, 'id'>>) => {
    setCashPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const removeCashPayment = (id: string) => {
    setCashPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const addOtherPending = (pending: Omit<OtherPending, 'id'>) => {
    const newPending: OtherPending = {
      ...pending,
      id: generateId(),
    };
    setOtherPending((prev) => [...prev, newPending]);
  };

  const removeOtherPending = (id: string) => {
    setOtherPending((prev) => prev.filter((p) => p.id !== id));
  };

  const addCarExpense = (expense: Omit<CarExpense, 'id'>) => {
    const newExpense: CarExpense = {
      ...expense,
      id: generateId(),
    };
    setCarExpenses((prev) => [...prev, newExpense]);
  };

  const updateCarExpense = (id: string, updates: Partial<Omit<CarExpense, 'id'>>) => {
    setCarExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const removeCarExpense = (id: string) => {
    setCarExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addCoTravellerIncome = (income: Omit<CoTravellerIncome, 'id'>) => {
    const newIncome: CoTravellerIncome = {
      ...income,
      id: generateId(),
    };
    setCoTravellerIncomes((prev) => [...prev, newIncome]);
  };

  const updateCoTravellerIncome = (id: string, updates: Partial<Omit<CoTravellerIncome, 'id'>>) => {
    setCoTravellerIncomes((prev) =>
      prev.map((income) => (income.id === id ? { ...income, ...updates } : income))
    );
  };

  const removeCoTravellerIncome = (id: string) => {
    setCoTravellerIncomes((prev) => prev.filter((income) => income.id !== id));
  };

  const togglePerDayAutoToll = (dateKey: string) => {
    setPerDayAutoTollSelection((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const clearAllLedgerData = () => {
    skipNextSave.current = true;
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
    setCoTravellerIncomes([]);
    setPerDayAutoTollSelection({});
    localStorage.removeItem(STORAGE_KEY);
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
      perDayAutoTollSelection,
    };
  };

  const applyMergedState = (state: LocalLedgerState) => {
    skipRevisionIncrement.current = true;
    setTravellers(state.travellers);
    const newDailyData = state.dailyData;
    setDailyData(newDailyData);
    setDraftDailyData(deepCloneDailyData(newDailyData));
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
    setCoTravellerIncomes(state.coTravellerIncomes || []);
    setPerDayAutoTollSelection(state.perDayAutoTollSelection || {});
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
    perDayAutoTollSelection,
    stateRevision,
    addTraveller,
    renameTraveller,
    removeTraveller,
    toggleDraftTrip,
    setDraftTripsForAllTravellers,
    saveDraftDailyData,
    discardDraftDailyData,
    hasDraftChanges,
    updateTravellerTrip,
    setDateRange,
    setRatePerTrip,
    addCashPayment,
    updateCashPayment,
    removeCashPayment,
    addOtherPending,
    removeOtherPending,
    addCarExpense,
    updateCarExpense,
    removeCarExpense,
    setIncludeSaturday,
    setIncludeSunday,
    addCoTravellerIncome,
    updateCoTravellerIncome,
    removeCoTravellerIncome,
    togglePerDayAutoToll,
    clearAllLedgerData,
    clearDailyData,
    clearCashPayments,
    clearOtherPending,
    clearCarExpenses,
    getPersistedState,
    applyMergedState,
    mergeRestoreFromBackup,
    setPerDayAutoTollSelection,
  };
}

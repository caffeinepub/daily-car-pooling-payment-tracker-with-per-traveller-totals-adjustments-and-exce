import { useState, useEffect, useRef } from 'react';
import type { LocalLedgerState } from '../utils/backupRestore';
import { mergeLocalStates } from '../utils/backupRestore';
import { getCurrentWeekMondayToFriday, formatDateKey } from '../utils/dateRange';
import { useAutoTollSettings } from './useAutoTollSettings';

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

  // Get auto toll settings
  const { enabled: autoTollEnabled, amount: autoTollAmount } = useAutoTollSettings();

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

  // Auto-add toll for current day when app opens
  useEffect(() => {
    if (!autoTollEnabled) return;

    const today = formatDateKey(new Date());
    const existingTollForToday = carExpenses.some(
      (e) => e.category === 'Toll' && e.date === today
    );

    if (!existingTollForToday) {
      const newExpense: CarExpense = {
        id: generateId(),
        category: 'Toll',
        amount: autoTollAmount,
        date: today,
        note: 'Auto-added',
      };
      setCarExpenses((prev) => [...prev, newExpense]);
    }
  }, []); // Run only on mount

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
      travellers.forEach((traveller) => {
        updated[dateKey][traveller.id] = { morning, evening };
      });
      return updated;
    });
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
    setDraftDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      updated[dateKey][travellerId] = { morning, evening };
      return updated;
    });
  };

  const saveDraftDailyData = () => {
    // Detect which dates changed
    const changedDates = new Set<string>();
    
    // Check all dates in draft
    for (const dateKey in draftDailyData) {
      const draftDateData = draftDailyData[dateKey];
      const savedDateData = dailyData[dateKey] || {};
      
      // Compare each traveller's data
      for (const travellerId in draftDateData) {
        const draftTrip = draftDateData[travellerId];
        const savedTrip = savedDateData[travellerId] || { morning: false, evening: false };
        
        if (draftTrip.morning !== savedTrip.morning || draftTrip.evening !== savedTrip.evening) {
          changedDates.add(dateKey);
          break;
        }
      }
    }

    // Save the draft data
    setDailyData(deepCloneDailyData(draftDailyData));

    // Auto-add toll for changed dates if enabled
    if (autoTollEnabled && changedDates.size > 0) {
      const existingTollDates = new Set(
        carExpenses.filter((e) => e.category === 'Toll').map((e) => e.date)
      );

      const newExpenses: CarExpense[] = [];
      changedDates.forEach((dateKey) => {
        if (!existingTollDates.has(dateKey)) {
          newExpenses.push({
            id: generateId(),
            category: 'Toll',
            amount: autoTollAmount,
            date: dateKey,
            note: 'Auto-added',
          });
        }
      });

      if (newExpenses.length > 0) {
        setCarExpenses((prev) => [...prev, ...newExpenses]);
      }
    }
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

  const addCoTravellerIncome = (income: CoTravellerIncome) => {
    setCoTravellerIncomes((prev) => [...prev, income]);
  };

  const updateCoTravellerIncome = (id: string, updates: Partial<Omit<CoTravellerIncome, 'id'>>) => {
    setCoTravellerIncomes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const removeCoTravellerIncome = (id: string) => {
    setCoTravellerIncomes((prev) => prev.filter((i) => i.id !== id));
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
    setStateRevision(0);
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
    };
  };

  const applyMergedState = (state: LocalLedgerState) => {
    skipRevisionIncrement.current = true;
    setTravellers(state.travellers);
    setDailyData(state.dailyData);
    setDraftDailyData(deepCloneDailyData(state.dailyData));
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
  };

  const mergeRestoreFromBackup = (backupState: LocalLedgerState) => {
    const currentState = getPersistedState();
    const mergedState = mergeLocalStates(currentState, backupState);
    applyMergedState(mergedState);
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
    updateTravellerTrip,
    saveDraftDailyData,
    discardDraftDailyData,
    hasDraftChanges,
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
    addCoTravellerIncome,
    updateCoTravellerIncome,
    removeCoTravellerIncome,
    setIncludeSaturday,
    setIncludeSunday,
    togglePerDayAutoToll,
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

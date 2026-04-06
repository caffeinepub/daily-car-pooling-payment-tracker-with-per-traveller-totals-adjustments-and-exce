import { useEffect, useRef, useState } from "react";
import type { LocalLedgerState } from "../utils/backupRestore";
import { mergeLocalStates } from "../utils/backupRestore";
import { getCurrentMonthRange } from "../utils/dateRange";
import type { RateHistoryEntry } from "../utils/rateHistory";
import {
  type UserProfileExtended,
  loadProfileExtended,
  saveProfileExtended,
} from "./useUserProfileExtended";

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
  tripTime?: "morning" | "evening";
}

export interface PerDayAutoTollSelection {
  [dateKey: string]: boolean;
}

const STORAGE_KEY = "carpool-ledger-state";

interface StoredState {
  travellers: Traveller[];
  dailyData: DailyData;
  dateRange: { start: string; end: string };
  ratePerTrip: number;
  rateHistory: RateHistoryEntry[];
  cashPayments: CashPayment[];
  otherPending: OtherPending[];
  carExpenses: CarExpense[];
  includeSaturday: boolean;
  includeSunday: boolean;
  coTravellerIncomes: CoTravellerIncome[];
  perDayAutoTollSelection?: PerDayAutoTollSelection;
  userProfileExtended?: UserProfileExtended;
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
        rateHistory: parsed.rateHistory ?? [],
        includeSaturday: parsed.includeSaturday ?? false,
        includeSunday: parsed.includeSunday ?? false,
        coTravellerIncomes: parsed.coTravellerIncomes ?? [],
        perDayAutoTollSelection: parsed.perDayAutoTollSelection ?? {},
        userProfileExtended: parsed.userProfileExtended ?? undefined,
      };
    }
  } catch (error) {
    console.error("Failed to load state:", error);
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
    rateHistory: [],
    cashPayments: [],
    otherPending: [],
    carExpenses: [],
    includeSaturday: false,
    includeSunday: false,
    coTravellerIncomes: [],
    perDayAutoTollSelection: {},
  };
}

function saveState(state: StoredState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Failed to save state:", error);
    return false;
  }
}

/**
 * Immediately persist the current full state snapshot to localStorage.
 * Used to guarantee persistence before async operations or dialog close.
 */
function saveStateImmediate(state: StoredState): void {
  const success = saveState(state);
  if (!success) {
    // Retry once after a short delay as a fallback
    setTimeout(() => saveState(state), 100);
  }
}

export function useLedgerLocalState() {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [draftDailyData, setDraftDailyData] = useState<DailyData>({});
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [ratePerTrip, setRatePerTrip] = useState(50);
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [otherPending, setOtherPending] = useState<OtherPending[]>([]);
  const [carExpenses, setCarExpenses] = useState<CarExpense[]>([]);
  const [includeSaturday, setIncludeSaturday] = useState(false);
  const [includeSunday, setIncludeSunday] = useState(false);
  const [coTravellerIncomes, setCoTravellerIncomes] = useState<
    CoTravellerIncome[]
  >([]);
  const [perDayAutoTollSelection, setPerDayAutoTollSelection] =
    useState<PerDayAutoTollSelection>({});
  const [userProfileExtended, setUserProfileExtended] =
    useState<UserProfileExtended | null>(null);
  const [stateRevision, setStateRevision] = useState(0);

  // Track if we should skip the next save (used for clearAllLedgerData)
  const skipNextSave = useRef(false);
  const skipRevisionIncrement = useRef(false);

  // Refs to always have the latest state values for synchronous saves
  const travellersRef = useRef(travellers);
  const dailyDataRef = useRef(dailyData);
  const dateRangeRef = useRef(dateRange);
  const ratePerTripRef = useRef(ratePerTrip);
  const rateHistoryRef = useRef(rateHistory);
  const cashPaymentsRef = useRef(cashPayments);
  const otherPendingRef = useRef(otherPending);
  const carExpensesRef = useRef(carExpenses);
  const includeSaturdayRef = useRef(includeSaturday);
  const includeSundayRef = useRef(includeSunday);
  const coTravellerIncomesRef = useRef(coTravellerIncomes);
  const perDayAutoTollSelectionRef = useRef(perDayAutoTollSelection);
  const userProfileExtendedRef = useRef(userProfileExtended);

  // Keep refs in sync with state
  useEffect(() => {
    travellersRef.current = travellers;
  }, [travellers]);
  useEffect(() => {
    dailyDataRef.current = dailyData;
  }, [dailyData]);
  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);
  useEffect(() => {
    ratePerTripRef.current = ratePerTrip;
  }, [ratePerTrip]);
  useEffect(() => {
    rateHistoryRef.current = rateHistory;
  }, [rateHistory]);
  useEffect(() => {
    cashPaymentsRef.current = cashPayments;
  }, [cashPayments]);
  useEffect(() => {
    otherPendingRef.current = otherPending;
  }, [otherPending]);
  useEffect(() => {
    carExpensesRef.current = carExpenses;
  }, [carExpenses]);
  useEffect(() => {
    includeSaturdayRef.current = includeSaturday;
  }, [includeSaturday]);
  useEffect(() => {
    includeSundayRef.current = includeSunday;
  }, [includeSunday]);
  useEffect(() => {
    coTravellerIncomesRef.current = coTravellerIncomes;
  }, [coTravellerIncomes]);
  useEffect(() => {
    perDayAutoTollSelectionRef.current = perDayAutoTollSelection;
  }, [perDayAutoTollSelection]);
  useEffect(() => {
    userProfileExtendedRef.current = userProfileExtended;
  }, [userProfileExtended]);

  // Build a snapshot of the current state for immediate persistence
  const buildSnapshot = (
    overrides: Partial<StoredState> = {},
  ): StoredState => ({
    travellers: travellersRef.current,
    dailyData: dailyDataRef.current,
    dateRange: {
      start: dateRangeRef.current.start.toISOString(),
      end: dateRangeRef.current.end.toISOString(),
    },
    ratePerTrip: ratePerTripRef.current,
    rateHistory: rateHistoryRef.current,
    cashPayments: cashPaymentsRef.current,
    otherPending: otherPendingRef.current,
    carExpenses: carExpensesRef.current,
    includeSaturday: includeSaturdayRef.current,
    includeSunday: includeSundayRef.current,
    coTravellerIncomes: coTravellerIncomesRef.current,
    perDayAutoTollSelection: perDayAutoTollSelectionRef.current,
    userProfileExtended: userProfileExtendedRef.current ?? undefined,
    ...overrides,
  });

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
    setRateHistory(loaded.rateHistory ?? []);
    setCashPayments(loaded.cashPayments);
    setOtherPending(loaded.otherPending);
    setCarExpenses(loaded.carExpenses);
    setIncludeSaturday(loaded.includeSaturday);
    setIncludeSunday(loaded.includeSunday);
    setCoTravellerIncomes(loaded.coTravellerIncomes);
    setPerDayAutoTollSelection(loaded.perDayAutoTollSelection ?? {});
    // Load extended profile from both ledger state and dedicated localStorage key
    const storedProfile = loadProfileExtended();
    const ledgerProfile = loaded.userProfileExtended;
    // Prefer dedicated key if available, otherwise use ledger state
    if (storedProfile) {
      setUserProfileExtended(storedProfile);
    } else if (ledgerProfile) {
      setUserProfileExtended(ledgerProfile);
      saveProfileExtended(ledgerProfile);
    }
  }, []);

  // Save state whenever it changes (reactive effect-based persistence)
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
      rateHistory,
      cashPayments,
      otherPending,
      carExpenses,
      includeSaturday,
      includeSunday,
      coTravellerIncomes,
      perDayAutoTollSelection,
      userProfileExtended: userProfileExtended ?? undefined,
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
    rateHistory,
    cashPayments,
    otherPending,
    carExpenses,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    perDayAutoTollSelection,
    userProfileExtended,
  ]);

  const addTraveller = (name: string) => {
    const newTraveller: Traveller = {
      id: generateId(),
      name,
    };
    setTravellers((prev) => [...prev, newTraveller]);
  };

  const renameTraveller = (id: string, newName: string) => {
    setTravellers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t)),
    );
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

  const toggleDraftTrip = (
    dateKey: string,
    travellerId: string,
    period: "morning" | "evening",
  ) => {
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

  const setDraftTripsForAllTravellers = (
    dateKey: string,
    morning: boolean,
    evening: boolean,
  ) => {
    setDraftDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      for (const t of travellers) {
        updated[dateKey][t.id] = { morning, evening };
      }
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

  const updateTravellerTrip = (
    dateKey: string,
    travellerId: string,
    morning: boolean,
    evening: boolean,
  ) => {
    setDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      updated[dateKey][travellerId] = { morning, evening };
      return updated;
    });
  };

  const addCashPayment = (payment: Omit<CashPayment, "id">) => {
    const newPayment: CashPayment = {
      ...payment,
      id: generateId(),
    };
    setCashPayments((prev) => [...prev, newPayment]);
  };

  const updateCashPayment = (
    id: string,
    updates: Partial<Omit<CashPayment, "id">>,
  ) => {
    setCashPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const removeCashPayment = (id: string) => {
    setCashPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const addOtherPending = (pending: Omit<OtherPending, "id">) => {
    const newPending: OtherPending = {
      ...pending,
      id: generateId(),
    };
    setOtherPending((prev) => [...prev, newPending]);
  };

  const updateOtherPending = (
    id: string,
    updates: Partial<Omit<OtherPending, "id">>,
  ) => {
    setOtherPending((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const removeOtherPending = (id: string) => {
    setOtherPending((prev) => prev.filter((p) => p.id !== id));
  };

  const addCarExpense = (expense: Omit<CarExpense, "id">) => {
    const newExpense: CarExpense = {
      ...expense,
      id: generateId(),
    };

    // Update React state for immediate UI re-render
    setCarExpenses((prev) => {
      const updated = [...prev, newExpense];
      // Synchronously persist to localStorage with the new expense included
      // so it survives a refresh even before the effect fires
      saveStateImmediate(buildSnapshot({ carExpenses: updated }));
      return updated;
    });
  };

  const updateCarExpense = (
    id: string,
    updates: Partial<Omit<CarExpense, "id">>,
  ) => {
    setCarExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  };

  const removeCarExpense = (id: string) => {
    setCarExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addCoTravellerIncome = (income: Omit<CoTravellerIncome, "id">) => {
    const newIncome: CoTravellerIncome = {
      ...income,
      id: generateId(),
    };
    setCoTravellerIncomes((prev) => [...prev, newIncome]);
  };

  const updateCoTravellerIncome = (
    id: string,
    updates: Partial<Omit<CoTravellerIncome, "id">>,
  ) => {
    setCoTravellerIncomes((prev) =>
      prev.map((income) =>
        income.id === id ? { ...income, ...updates } : income,
      ),
    );
  };

  const removeCoTravellerIncome = (id: string) => {
    setCoTravellerIncomes((prev) => prev.filter((income) => income.id !== id));
  };

  const addRateHistoryEntry = (entry: Omit<RateHistoryEntry, "id">) => {
    const newEntry: RateHistoryEntry = { ...entry, id: generateId() };
    setRateHistory((prev) => [...prev, newEntry]);
  };

  const removeRateHistoryEntry = (id: string) => {
    setRateHistory((prev) => prev.filter((e) => e.id !== id));
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
    setRateHistory([]);
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
      rateHistory,
      cashPayments,
      otherPending,
      carExpenses,
      includeSaturday,
      includeSunday,
      coTravellerIncomes,
      perDayAutoTollSelection,
      userProfileExtended: userProfileExtended ?? undefined,
    };
  };

  const mergeRestoreFromBackup = (backupState: LocalLedgerState) => {
    skipRevisionIncrement.current = true;
    const currentState = getPersistedState();
    const merged = mergeLocalStates(currentState, backupState);

    setTravellers(merged.travellers);
    const mergedDailyData = merged.dailyData as DailyData;
    setDailyData(mergedDailyData);
    setDraftDailyData(deepCloneDailyData(mergedDailyData));
    setDateRange({
      start: new Date(merged.dateRange.start),
      end: new Date(merged.dateRange.end),
    });
    setRatePerTrip(merged.ratePerTrip);
    setRateHistory(merged.rateHistory ?? []);
    setCashPayments(merged.cashPayments);
    setOtherPending(merged.otherPending);
    setCarExpenses(merged.carExpenses);
    setIncludeSaturday(merged.includeSaturday);
    setIncludeSunday(merged.includeSunday);
    setCoTravellerIncomes(merged.coTravellerIncomes as CoTravellerIncome[]);
    setPerDayAutoTollSelection(
      (merged.perDayAutoTollSelection as PerDayAutoTollSelection) ?? {},
    );
    // Sync extended profile from merged state
    if (merged.userProfileExtended) {
      setUserProfileExtended(merged.userProfileExtended);
      saveProfileExtended(merged.userProfileExtended);
    }
  };

  const updateUserProfileExtended = (profile: UserProfileExtended) => {
    setUserProfileExtended(profile);
    saveProfileExtended(profile);
  };

  const restoreFromBackup = (backupState: LocalLedgerState) => {
    mergeRestoreFromBackup(backupState);
  };

  return {
    travellers,
    dailyData,
    draftDailyData,
    dateRange,
    setDateRange,
    ratePerTrip,
    setRatePerTrip,
    rateHistory,
    addRateHistoryEntry,
    removeRateHistoryEntry,
    cashPayments,
    otherPending,
    carExpenses,
    includeSaturday,
    setIncludeSaturday,
    includeSunday,
    setIncludeSunday,
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
    addCashPayment,
    updateCashPayment,
    removeCashPayment,
    addOtherPending,
    updateOtherPending,
    removeOtherPending,
    addCarExpense,
    updateCarExpense,
    removeCarExpense,
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
    mergeRestoreFromBackup,
    restoreFromBackup,
    userProfileExtended,
    updateUserProfileExtended,
  };
}

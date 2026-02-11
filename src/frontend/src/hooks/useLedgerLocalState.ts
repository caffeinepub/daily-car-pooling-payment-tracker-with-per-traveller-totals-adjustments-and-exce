import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';

export interface Traveller {
  id: string;
  name: string;
}

export interface DateRange {
  start: Date;
  end: Date;
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

export interface CashPayment {
  id: string;
  travellerId: string;
  amount: number;
  date: string; // ISO date string
  note?: string;
}

const STORAGE_KEY_TRAVELLERS = 'carpool_travellers';
const STORAGE_KEY_DAILY_DATA = 'carpool_daily_data';
const STORAGE_KEY_RATE = 'carpool_rate_per_trip';
const STORAGE_KEY_PAYMENTS = 'carpool_cash_payments';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Migration function to convert old boolean format to new TripData format
function migrateDailyData(data: any): DailyData {
  const migrated: DailyData = {};
  
  for (const dateKey in data) {
    migrated[dateKey] = {};
    for (const travellerId in data[dateKey]) {
      const value = data[dateKey][travellerId];
      
      // Check if it's already in new format
      if (typeof value === 'object' && value !== null && ('morning' in value || 'evening' in value)) {
        migrated[dateKey][travellerId] = {
          morning: value.morning || false,
          evening: value.evening || false,
        };
      } else {
        // Old format: boolean - convert true to morning=true, evening=false
        migrated[dateKey][travellerId] = {
          morning: value === true,
          evening: false,
        };
      }
    }
  }
  
  return migrated;
}

export function useLedgerLocalState() {
  const [travellers, setTravellers] = useState<Traveller[]>(() => loadFromStorage(STORAGE_KEY_TRAVELLERS, []));
  const [dailyData, setDailyData] = useState<DailyData>(() => {
    const stored = loadFromStorage(STORAGE_KEY_DAILY_DATA, {});
    return migrateDailyData(stored);
  });
  
  const [cashPayments, setCashPayments] = useState<CashPayment[]>(() => 
    loadFromStorage(STORAGE_KEY_PAYMENTS, [])
  );
  
  // Migrate old rate key to new one
  const [ratePerTrip, setRatePerTrip] = useState<number>(() => {
    // Try new key first
    const newRate = localStorage.getItem(STORAGE_KEY_RATE);
    if (newRate) {
      try {
        return JSON.parse(newRate);
      } catch {
        // Fall through to old key
      }
    }
    
    // Try old key
    const oldRate = localStorage.getItem('carpool_rate_per_day');
    if (oldRate) {
      try {
        return JSON.parse(oldRate);
      } catch {
        // Fall through to default
      }
    }
    
    return 200; // Default to 200 INR per trip
  });
  
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  }));

  useEffect(() => {
    saveToStorage(STORAGE_KEY_TRAVELLERS, travellers);
  }, [travellers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_DAILY_DATA, dailyData);
  }, [dailyData]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_RATE, ratePerTrip);
  }, [ratePerTrip]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_PAYMENTS, cashPayments);
  }, [cashPayments]);

  const addTraveller = (name: string) => {
    const newTraveller: Traveller = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
    };
    setTravellers((prev) => [...prev, newTraveller]);
  };

  const removeTraveller = (id: string) => {
    setTravellers((prev) => prev.filter((t) => t.id !== id));
    // Clean up daily data
    setDailyData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((dateKey) => {
        if (updated[dateKey]) {
          delete updated[dateKey][id];
        }
      });
      return updated;
    });
    // Clean up cash payments
    setCashPayments((prev) => prev.filter((p) => p.travellerId !== id));
  };

  const renameTraveller = (id: string, newName: string) => {
    setTravellers((prev) => prev.map((t) => (t.id === id ? { ...t, name: newName } : t)));
  };

  const toggleTrip = (dateKey: string, travellerId: string, trip: 'morning' | 'evening') => {
    setDailyData((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = {};
      }
      if (!updated[dateKey][travellerId]) {
        updated[dateKey][travellerId] = { morning: false, evening: false };
      }
      
      updated[dateKey][travellerId] = {
        ...updated[dateKey][travellerId],
        [trip]: !updated[dateKey][travellerId][trip],
      };
      
      return updated;
    });
  };

  const addCashPayment = (travellerId: string, amount: number, date: string, note?: string) => {
    const newPayment: CashPayment = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      travellerId,
      amount,
      date,
      note,
    };
    setCashPayments((prev) => [...prev, newPayment]);
  };

  const removeCashPayment = (paymentId: string) => {
    setCashPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  return {
    travellers,
    addTraveller,
    removeTraveller,
    renameTraveller,
    dateRange,
    setDateRange,
    dailyData,
    toggleTrip,
    ratePerTrip,
    setRatePerTrip,
    cashPayments,
    addCashPayment,
    removeCashPayment,
  };
}

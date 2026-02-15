import { useState, useEffect } from 'react';

const STORAGE_KEY = 'carpool-auto-toll-settings';

interface AutoTollSettings {
  enabled: boolean;
  amount: number;
}

const DEFAULT_SETTINGS: AutoTollSettings = {
  enabled: false,
  amount: 30,
};

function loadSettings(): AutoTollSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
        amount: typeof parsed.amount === 'number' && parsed.amount > 0 
          ? parsed.amount 
          : DEFAULT_SETTINGS.amount,
      };
    }
  } catch (error) {
    console.error('Failed to load Auto Toll settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AutoTollSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save Auto Toll settings:', error);
  }
}

export function useAutoTollSettings() {
  const [settings, setSettings] = useState<AutoTollSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setEnabled = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enabled }));
  };

  const setAmount = (amount: number) => {
    if (amount > 0) {
      setSettings((prev) => ({ ...prev, amount }));
    }
  };

  return {
    enabled: settings.enabled,
    amount: settings.amount,
    setEnabled,
    setAmount,
  };
}

import { useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AuthGate from './components/AuthGate';
import ProfileSetupModal from './components/ProfileSetupModal';
import LedgerPage from './features/ledger/LedgerPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useLedgerLocalState } from './hooks/useLedgerLocalState';
import { useAutoTollSettings } from './hooks/useAutoTollSettings';
import { formatDateKey } from './utils/dateRange';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { carExpenses, addCarExpense } = useLedgerLocalState();
  const { enabled: autoTollEnabled, amount: autoTollAmount, lastAutoTollDate, setLastAutoTollDate } = useAutoTollSettings();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Auto-add toll once per weekday on app launch
  useEffect(() => {
    if (!autoTollEnabled) return;

    const today = new Date();
    const todayKey = formatDateKey(today);
    const dayOfWeek = today.getDay();

    // Check if today is a weekday (Monday = 1, Friday = 5)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (!isWeekday) return;

    // Check if we already auto-added toll today
    if (lastAutoTollDate === todayKey) return;

    // Check if a toll expense already exists for today
    const existingTollForToday = carExpenses.some(
      (e) => e.category === 'Toll' && e.date === todayKey
    );

    if (!existingTollForToday) {
      addCarExpense({
        category: 'Toll',
        amount: autoTollAmount,
        date: todayKey,
        note: 'Auto-added',
      });
      setLastAutoTollDate(todayKey);
    }
  }, [autoTollEnabled, autoTollAmount, carExpenses, lastAutoTollDate, addCarExpense, setLastAutoTollDate]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AuthGate>
          {showProfileSetup ? <ProfileSetupModal /> : <LedgerPage />}
        </AuthGate>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

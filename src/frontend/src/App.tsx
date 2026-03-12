import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import AuthGate from "./components/AuthGate";
import ProfileSetupModal from "./components/ProfileSetupModal";
import LedgerPage from "./features/ledger/LedgerPage";
import { useAutoTollSettings } from "./hooks/useAutoTollSettings";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useLedgerLocalState } from "./hooks/useLedgerLocalState";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "./hooks/useQueries";
import { getTodayIST } from "./utils/dateRange";

export default function App() {
  const { identity } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { mutate: saveProfile, isPending: isSavingProfile } =
    useSaveCallerUserProfile();
  const { carExpenses, addCarExpense } = useLedgerLocalState();
  const {
    enabled: autoTollEnabled,
    amount: autoTollAmount,
    lastAutoTollDate,
    setLastAutoTollDate,
  } = useAutoTollSettings();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Auto-add toll once per weekday on app launch — uses IST date to avoid day-ahead issue
  useEffect(() => {
    if (!autoTollEnabled) return;

    // Use IST date string directly for comparison
    const todayKey = getTodayIST();

    // Derive day of week from the IST date string
    const [year, month, day] = todayKey.split("-").map(Number);
    const todayIST = new Date(year, month - 1, day);
    const dayOfWeek = todayIST.getDay();

    // Check if today is a weekday (Monday = 1, Friday = 5)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (!isWeekday) return;

    // Check if we already auto-added toll today
    if (lastAutoTollDate === todayKey) return;

    // Check if a toll expense already exists for today
    const existingTollForToday = carExpenses.some(
      (e) => e.category === "Toll" && e.date === todayKey,
    );

    if (!existingTollForToday) {
      addCarExpense({
        category: "Toll",
        amount: autoTollAmount,
        date: todayKey,
        note: "Auto-added",
      });
      setLastAutoTollDate(todayKey);
    }
  }, [
    autoTollEnabled,
    autoTollAmount,
    carExpenses,
    lastAutoTollDate,
    addCarExpense,
    setLastAutoTollDate,
  ]);

  const handleSaveProfile = (name: string) => {
    saveProfile({ name });
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background">
        <AuthGate>
          {showProfileSetup ? (
            <ProfileSetupModal
              open={showProfileSetup}
              onSave={handleSaveProfile}
              isLoading={isSavingProfile}
            />
          ) : (
            <LedgerPage />
          )}
        </AuthGate>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

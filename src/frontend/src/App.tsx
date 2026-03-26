import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import AuthGate from "./components/AuthGate";
import ProfileSetupModal from "./components/ProfileSetupModal";
import UserProfileDialog from "./components/UserProfileDialog";
import LedgerPage from "./features/ledger/LedgerPage";
import { useAutoTollSettings } from "./hooks/useAutoTollSettings";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useLedgerLocalState } from "./hooks/useLedgerLocalState";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "./hooks/useQueries";
import { useUserProfileExtended } from "./hooks/useUserProfileExtended";
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

  // Extended profile — stored in localStorage, auto-updates via custom event
  const { profile: userProfileExtended } = useUserProfileExtended();

  // Ledger state needed for auto-toll logic
  const { carExpenses, addCarExpense } = useLedgerLocalState();
  const {
    enabled: autoTollEnabled,
    amount: autoTollAmount,
    lastAutoTollDate,
    setLastAutoTollDate,
  } = useAutoTollSettings();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Auto-add toll once per weekday on app launch
  useEffect(() => {
    if (!autoTollEnabled) return;

    const todayKey = getTodayIST();
    const [year, month, day] = todayKey.split("-").map(Number);
    const todayIST = new Date(year, month - 1, day);
    const dayOfWeek = todayIST.getDay();

    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (!isWeekday) return;

    if (lastAutoTollDate === todayKey) return;

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

  // Profile picture from localStorage-backed extended profile
  const profilePicture = userProfileExtended?.profilePicture ?? undefined;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-background">
        <AuthGate>
          {showProfileSetup ? (
            <ProfileSetupModal
              open={showProfileSetup}
              onSave={handleSaveProfile}
              isLoading={isSavingProfile}
            />
          ) : (
            <LedgerPage
              onOpenProfile={() => setProfileDialogOpen(true)}
              profilePicture={profilePicture}
            />
          )}
          <UserProfileDialog
            open={profileDialogOpen}
            onClose={() => setProfileDialogOpen(false)}
            userProfile={userProfile}
            userProfileExtended={userProfileExtended}
          />
        </AuthGate>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

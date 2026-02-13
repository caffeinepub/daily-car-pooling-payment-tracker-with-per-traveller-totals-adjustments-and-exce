import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import AuthGate from './components/AuthGate';
import ProfileSetupModal from './components/ProfileSetupModal';
import LedgerPage from './features/ledger/LedgerPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';

export default function App() {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Clear all cached data on logout
  useEffect(() => {
    if (!identity) {
      queryClient.clear();
    }
  }, [identity, queryClient]);

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

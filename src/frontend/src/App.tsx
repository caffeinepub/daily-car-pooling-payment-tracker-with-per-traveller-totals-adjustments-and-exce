import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AuthGate from './components/AuthGate';
import ProfileSetupModal from './components/ProfileSetupModal';
import LedgerPage from './features/ledger/LedgerPage';
import { LedgerStateProvider } from './features/ledger/LedgerStateContext';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import AppErrorBoundary from './components/AppErrorBoundary';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <AppErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background">
          <AuthGate>
            {showProfileSetup ? (
              <ProfileSetupModal />
            ) : (
              <LedgerStateProvider>
                <LedgerPage />
              </LedgerStateProvider>
            )}
          </AuthGate>
          <Toaster />
        </div>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

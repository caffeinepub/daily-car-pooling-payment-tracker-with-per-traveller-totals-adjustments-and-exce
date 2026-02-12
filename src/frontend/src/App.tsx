import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AuthGate from './components/AuthGate';
import ProfileSetupModal from './components/ProfileSetupModal';
import LedgerPage from './features/ledger/LedgerPage';
import InitLoadingScreen from './components/InitLoadingScreen';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

/**
 * Main app component handling authentication flow, profile setup, and ledger page rendering.
 * Includes explicit loading states to prevent black screen during initialization.
 */
export default function App() {
  const { identity, isInitializing: authInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Show loading screen during authenticated initialization (actor + profile lookup)
  const isAuthenticatedLoading = isAuthenticated && (profileLoading || !isFetched);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AuthGate>
          {isAuthenticatedLoading ? (
            <InitLoadingScreen message="Loading your profile..." />
          ) : showProfileSetup ? (
            <ProfileSetupModal />
          ) : (
            <LedgerPage />
          )}
        </AuthGate>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

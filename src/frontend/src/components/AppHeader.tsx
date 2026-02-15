import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import SyncStatusIndicator from './SyncStatusIndicator';
import type { SyncStatus } from '../hooks/useAppDataSync';

interface AppHeaderProps {
  syncStatus?: SyncStatus;
  lastSyncTime?: Date | null;
  syncError?: string | null;
  onLogout?: () => void;
}

export default function AppHeader({ syncStatus, lastSyncTime, syncError, onLogout }: AppHeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear local storage
      localStorage.clear();
      
      // Call parent callback if provided
      if (onLogout) {
        onLogout();
      }
      
      // Clear Internet Identity
      await clear();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/carpool-ledger-logo.dim_512x512.png"
            alt="Carpool Ledger"
            className="h-10 w-10 rounded-lg"
          />
          <div>
            <h1 className="text-lg font-bold">Carpool Ledger</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Track & Manage Carpool Expenses</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && syncStatus && (
            <SyncStatusIndicator status={syncStatus} lastSyncTime={lastSyncTime || null} error={syncError} />
          )}

          {isAuthenticated && (
            <>
              {/* Desktop Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden md:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>

              {/* Mobile/Tablet User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, User } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import SyncStatusIndicator from "./SyncStatusIndicator";

export type SyncStatus = "idle" | "syncing" | "synced" | "failed";

export interface AppHeaderProps {
  userName?: string;
  onLogout?: () => void;
  syncStatus?: SyncStatus;
  lastSyncTime?: Date | null;
  syncError?: string | null;
}

export default function AppHeader({
  userName,
  onLogout,
  syncStatus,
  lastSyncTime,
}: AppHeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    localStorage.clear();
    onLogout?.();
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Determine sync props to pass down
  const syncProps =
    syncStatus !== undefined
      ? { status: syncStatus, lastSyncTime: lastSyncTime ?? null }
      : undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo / Branding */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/assets/generated/carpool-ledger-logo.dim_512x512.png"
            alt="Carpool Ledger"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-md flex-shrink-0"
          />
          <span className="font-bold text-sm sm:text-base md:text-lg text-foreground truncate leading-tight">
            Carpool Ledger
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isAuthenticated && syncProps && (
            <div className="hidden sm:flex">
              <SyncStatusIndicator
                status={syncProps.status}
                lastSyncTime={syncProps.lastSyncTime}
              />
            </div>
          )}

          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 h-8 sm:h-9 rounded-lg hover:bg-accent"
                >
                  <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                    <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs sm:text-sm font-medium max-w-[80px] truncate">
                    {userName || "User"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuLabel className="text-xs sm:text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold truncate">
                      {userName || "User"}
                    </span>
                    <span className="text-muted-foreground font-normal text-xs truncate">
                      {identity?.getPrincipal().toString().slice(0, 20)}...
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs sm:text-sm">
                  <User className="mr-2 h-3.5 w-3.5" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive text-xs sm:text-sm"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile sync indicator row */}
      {isAuthenticated && syncProps && (
        <div className="flex sm:hidden justify-center pb-1 px-3">
          <SyncStatusIndicator
            status={syncProps.status}
            lastSyncTime={syncProps.lastSyncTime}
          />
        </div>
      )}
    </header>
  );
}

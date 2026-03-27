import { Principal } from "@dfinity/principal";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalLedgerState } from "../utils/backupRestore";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type SyncStatus = "idle" | "syncing" | "synced" | "failed";

interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
}

interface UseSharedDataSyncProps {
  adminPrincipalStr: string;
  applyMergedState: (state: LocalLedgerState) => void;
}

const POLL_INTERVAL = 3000;

function hashState(state: string): string {
  let hash = 0;
  for (let i = 0; i < state.length; i++) {
    const char = state.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function useSharedDataSync({
  adminPrincipalStr,
  applyMergedState,
}: UseSharedDataSyncProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSyncTime: null,
    error: null,
  });

  const applyMergedStateRef = useRef(applyMergedState);
  useEffect(() => {
    applyMergedStateRef.current = applyMergedState;
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLedgerHashRef = useRef<string | null>(null);
  const isPollingActiveRef = useRef(false);

  const isAuthenticated = !!identity && !!actor && !actorFetching;

  const fetchAdminData = useCallback(async () => {
    if (!actor || !isAuthenticated) return;
    try {
      setSyncState((prev) => ({ ...prev, status: "syncing", error: null }));

      const adminPrincipal = Principal.fromText(adminPrincipalStr);
      const result = await actor.getAdminSharedData(adminPrincipal);

      if (result?.ledgerState) {
        const hash = hashState(result.ledgerState);
        if (hash !== lastLedgerHashRef.current) {
          lastLedgerHashRef.current = hash;
          try {
            const parsed: LocalLedgerState = JSON.parse(result.ledgerState);
            applyMergedStateRef.current(parsed);
          } catch {
            // ignore parse errors
          }
        }
      }

      setSyncState({
        status: "synced",
        lastSyncTime: new Date(),
        error: null,
      });
    } catch (error) {
      setSyncState((prev) => ({
        ...prev,
        status: "failed",
        error: error instanceof Error ? error.message : "Sync failed",
      }));
    }
  }, [actor, isAuthenticated, adminPrincipalStr]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isPollingActiveRef.current = false;
      setSyncState({ status: "idle", lastSyncTime: null, error: null });
      return;
    }

    fetchAdminData();

    if (!isPollingActiveRef.current) {
      isPollingActiveRef.current = true;
      pollIntervalRef.current = setInterval(() => {
        fetchAdminData();
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isPollingActiveRef.current = false;
    };
  }, [isAuthenticated, fetchAdminData]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    syncStatus: syncState.status,
    lastSyncTime: syncState.lastSyncTime,
    error: syncState.error,
  };
}

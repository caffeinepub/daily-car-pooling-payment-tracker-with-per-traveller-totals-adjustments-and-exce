import { useEffect, useRef, useState, useCallback } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { AppData } from '../backend';
import type { LocalLedgerState } from '../utils/backupRestore';
import { mergeLocalStates } from '../utils/backupRestore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
}

interface UseAppDataSyncProps {
  getLocalState: () => LocalLedgerState;
  applyMergedState: (state: LocalLedgerState) => void;
  stateRevision: number;
}

const POLL_INTERVAL = 3000; // 3 seconds
const DEBOUNCE_DELAY = 1000; // 1 second debounce for outbound saves

export function useAppDataSync({ getLocalState, applyMergedState, stateRevision }: UseAppDataSyncProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSyncTime: null,
    error: null,
  });

  // Stable refs for callbacks to prevent dependency churn
  const getLocalStateRef = useRef(getLocalState);
  const applyMergedStateRef = useRef(applyMergedState);
  const stateRevisionRef = useRef(stateRevision);

  // Update refs on every render
  useEffect(() => {
    getLocalStateRef.current = getLocalState;
    applyMergedStateRef.current = applyMergedState;
    stateRevisionRef.current = stateRevision;
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRemoteVersionRef = useRef<bigint | null>(null);
  const lastRemoteTimestampRef = useRef<bigint | null>(null);
  const lastRemoteLedgerHashRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedRevisionRef = useRef<number>(0);
  const hasInitialFetchRef = useRef(false);
  const isPollingActiveRef = useRef(false);

  const isAuthenticated = !!identity && !!actor && !actorFetching;

  // Helper to hash ledger state for comparison
  const hashLedgerState = (state: string): string => {
    let hash = 0;
    for (let i = 0; i < state.length; i++) {
      const char = state.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  // Fetch and merge remote data - stabilized with useCallback
  const fetchAndMerge = useCallback(async () => {
    if (!actor || !isAuthenticated) return;

    try {
      setSyncState((prev) => ({ ...prev, status: 'syncing', error: null }));

      const remoteAppData = await actor.fetchAppData();

      if (remoteAppData && remoteAppData.ledgerState) {
        const remoteHash = hashLedgerState(remoteAppData.ledgerState);
        
        // Check if remote data has actually changed
        const hasRemoteChanged =
          lastRemoteVersionRef.current === null ||
          lastRemoteLedgerHashRef.current === null ||
          remoteAppData.version > lastRemoteVersionRef.current ||
          remoteAppData.lastUpdated > (lastRemoteTimestampRef.current || BigInt(0)) ||
          remoteHash !== lastRemoteLedgerHashRef.current;

        if (hasRemoteChanged) {
          // Parse remote ledger state
          const remoteLedgerState: LocalLedgerState = JSON.parse(remoteAppData.ledgerState);
          const currentLocalState = getLocalStateRef.current();

          // Merge remote with local (deterministic, non-destructive)
          const mergedState = mergeLocalStates(currentLocalState, remoteLedgerState);

          // Apply merged state to local storage
          applyMergedStateRef.current(mergedState);

          // Update tracking refs with authoritative remote values
          lastRemoteVersionRef.current = remoteAppData.version;
          lastRemoteTimestampRef.current = remoteAppData.lastUpdated;
          lastRemoteLedgerHashRef.current = remoteHash;
        }
      } else if (remoteAppData) {
        // Remote exists but no ledger state yet
        lastRemoteVersionRef.current = remoteAppData.version;
        lastRemoteTimestampRef.current = remoteAppData.lastUpdated;
        lastRemoteLedgerHashRef.current = null;
      }

      setSyncState({
        status: 'synced',
        lastSyncTime: new Date(),
        error: null,
      });
      hasInitialFetchRef.current = true;
    } catch (error) {
      console.error('Sync fetch error:', error);
      setSyncState((prev) => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      // Don't stop polling on error - keep retrying
    }
  }, [actor, isAuthenticated]);

  // Save local state to backend with merge-before-save and fetch-after-save - stabilized
  const saveToBackend = useCallback(async () => {
    if (!actor || !isAuthenticated || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setSyncState((prev) => ({ ...prev, status: 'syncing', error: null }));

      // Fetch latest remote to check for conflicts
      const remoteAppData = await actor.fetchAppData();
      const currentLocalState = getLocalStateRef.current();

      let stateToSave = currentLocalState;

      // If remote has newer data, merge before saving
      if (
        remoteAppData &&
        remoteAppData.ledgerState &&
        remoteAppData.version > (lastRemoteVersionRef.current || BigInt(0))
      ) {
        const remoteLedgerState: LocalLedgerState = JSON.parse(remoteAppData.ledgerState);
        stateToSave = mergeLocalStates(remoteLedgerState, currentLocalState);
        // Apply merged state locally before saving
        applyMergedStateRef.current(stateToSave);
      }

      // Prepare AppData for save
      const appDataToSave: AppData = {
        userProfile: remoteAppData?.userProfile,
        ledgerState: JSON.stringify(stateToSave),
        lastUpdated: BigInt(Date.now() * 1000000), // nanoseconds
        version: remoteAppData?.version || BigInt(0),
      };

      await actor.saveAppData(appDataToSave);

      // Fetch back the authoritative post-save values
      const postSaveData = await actor.fetchAppData();
      if (postSaveData) {
        lastRemoteVersionRef.current = postSaveData.version;
        lastRemoteTimestampRef.current = postSaveData.lastUpdated;
        if (postSaveData.ledgerState) {
          lastRemoteLedgerHashRef.current = hashLedgerState(postSaveData.ledgerState);
        }
      }

      lastSavedRevisionRef.current = stateRevisionRef.current;

      setSyncState({
        status: 'synced',
        lastSyncTime: new Date(),
        error: null,
      });
    } catch (error) {
      console.error('Sync save error:', error);
      setSyncState((prev) => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Save failed',
      }));
      // Don't stop retrying on error
    } finally {
      isSavingRef.current = false;
    }
  }, [actor, isAuthenticated]);

  // Initial fetch on authentication
  useEffect(() => {
    if (isAuthenticated && !hasInitialFetchRef.current) {
      fetchAndMerge();
    }
  }, [isAuthenticated, fetchAndMerge]);

  // Start polling when authenticated - only set up once per auth session
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear polling when logged out
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isPollingActiveRef.current = false;
      setSyncState({ status: 'idle', lastSyncTime: null, error: null });
      lastRemoteVersionRef.current = null;
      lastRemoteTimestampRef.current = null;
      lastRemoteLedgerHashRef.current = null;
      hasInitialFetchRef.current = false;
      return;
    }

    // Only start polling if not already active
    if (!isPollingActiveRef.current) {
      isPollingActiveRef.current = true;
      pollIntervalRef.current = setInterval(() => {
        fetchAndMerge();
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isPollingActiveRef.current = false;
    };
  }, [isAuthenticated, fetchAndMerge]);

  // Trigger fetch on window focus/visibility change
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAndMerge();
      }
    };

    const handleFocus = () => {
      fetchAndMerge();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, fetchAndMerge]);

  // Debounced outbound sync on state changes
  useEffect(() => {
    if (!isAuthenticated || stateRevision === 0) return;

    // Skip if this revision was already saved
    if (stateRevision === lastSavedRevisionRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      saveToBackend();
    }, DEBOUNCE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isAuthenticated, stateRevision, saveToBackend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncStatus: syncState.status,
    lastSyncTime: syncState.lastSyncTime,
    error: syncState.error,
  };
}

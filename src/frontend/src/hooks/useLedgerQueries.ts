import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { LedgerState, LedgerBackup } from '../types/ledger';

// Hook to load ledger state from canister
export function useLoadLedgerState() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<LedgerState | null>({
    queryKey: ['ledgerState'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Call backend method when available
      // return actor.loadLedgerState();
      return null;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// Hook to save ledger state to canister
export function useSaveLedgerState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (state: LedgerState) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Call backend method when available
      // return actor.saveLedgerState(state);
      console.log('Save ledger state (backend not implemented):', state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgerState'] });
    },
  });
}

// Hook to export ledger data for backup
export function useExportLedgerBackup() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (): Promise<LedgerBackup> => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Call backend method when available
      // const data = await actor.exportLedgerData();
      
      // Temporary: return empty backup structure
      const data: LedgerState = {
        travellers: [],
        dailyData: {},
        dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
        ratePerTrip: 50,
        cashPayments: [],
        otherPending: [],
        carExpenses: [],
        includeSaturday: false,
        includeSunday: false,
      };
      
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data,
      };
    },
  });
}

// Hook to restore ledger data from backup
export function useRestoreLedgerBackup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backup: LedgerBackup) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Call backend method when available
      // return actor.restoreLedgerData(backup.data);
      console.log('Restore ledger backup (backend not implemented):', backup);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgerState'] });
    },
  });
}

// Hook to clear all ledger data
export function useClearAllLedgerData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Call backend method when available
      // return actor.clearAllLedgerData();
      console.log('Clear all ledger data (backend not implemented)');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgerState'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "../backend";
import { useActor } from "./useActor";
import {
  type UserProfileExtended,
  loadProfileExtended,
  saveProfileExtended,
} from "./useUserProfileExtended";

// Re-export for backward compatibility
export type { UserProfileExtended };

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Extended profile — stored in localStorage and synced via ledger state JSON.
// The backend never had a working IDL method for this, so we use local storage.
export function useGetCallerUserProfileExtended() {
  const query = useQuery<UserProfileExtended | null>({
    queryKey: ["currentUserProfileExtended"],
    queryFn: () => loadProfileExtended(),
    staleTime: 0,
  });

  return {
    ...query,
    isLoading: false,
    isFetched: true,
  };
}

export function useSaveCallerUserProfileExtended() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileExtended) => {
      saveProfileExtended(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfileExtended"],
      });
    },
  });
}

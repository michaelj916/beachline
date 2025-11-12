"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type SavedSpotsResponse = {
  spotIds: string[];
};

async function fetchSavedSpots(): Promise<SavedSpotsResponse> {
  const res = await fetch("/api/user/spots", {
    credentials: "include",
  });
  if (res.status === 401) {
    return { spotIds: [] };
  }
  if (!res.ok) {
    throw new Error("Failed to load saved spots");
  }
  return res.json();
}

export function useSavedSpots() {
  const { session } = useSupabase();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const query = useQuery({
    queryKey: ["saved-spots"],
    queryFn: fetchSavedSpots,
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
    initialData: { spotIds: [] },
  });

  const mutate = useMutation({
    mutationFn: async ({
      spotId,
      save,
    }: {
      spotId: string;
      save: boolean;
    }) => {
      const res = await fetch(`/api/user/spots/${spotId}`, {
        method: save ? "POST" : "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        throw new Error("Failed to update saved spot");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-spots"] });
    },
  });

  const ensureMutation = useMutation({
    mutationFn: async (spotIds: string[]) => {
      if (spotIds.length === 0) return;
      const res = await fetch("/api/user/spots", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spotIds }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        throw new Error("Failed to save spots");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-spots"] });
    },
  });

  const toggleSpot = useCallback(
    async (spotId: string, save: boolean) => {
      if (!session) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      await mutate.mutateAsync({ spotId, save });
    },
    [mutate, pathname, router, session]
  );

  const ensureSaved = useCallback(
    async (spotIds: string[]) => {
      if (!session) return;
      await ensureMutation.mutateAsync(spotIds);
    },
    [ensureMutation, session]
  );

  return {
    savedSpotIds: query.data?.spotIds ?? [],
    isLoading: query.isLoading,
    toggleSpot,
    ensureSaved,
    session,
  };
}



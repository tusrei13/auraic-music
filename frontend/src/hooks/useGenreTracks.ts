import { useQuery } from "@tanstack/react-query";
import { StreamEngineService } from "@/lib/sound-engine/client";
import type { EngineTrack } from "@/types/sound-engine";

function pickRandomTrack(tracks: EngineTrack[]): EngineTrack | null {
  if (tracks.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * tracks.length);
  return tracks[randomIndex];
}

export { pickRandomTrack };

export function useGenreTracks(genre: string | null) {
  return useQuery<EngineTrack[]>({
    queryKey: ["genreTracks", genre],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      if (!genre) return [];
      return StreamEngineService.fetchTracksByTag(genre, 24);
    },
    enabled: Boolean(genre),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        return previousData;
      }
      return undefined;
    },
  });
}


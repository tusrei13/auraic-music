import { useQuery } from "@tanstack/react-query";
import { ApiError, getJamendoTracks, type JamendoSong } from "@/lib/api";

function pickRandomTrack(tracks: JamendoSong[]): JamendoSong | null {
  if (tracks.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * tracks.length);
  return tracks[randomIndex];
}

export { pickRandomTrack };

export function useGenreTracks(genre: string | null) {
  return useQuery<JamendoSong[]>({
    queryKey: ["genreTracks", genre],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      if (!genre) return [];
      return getJamendoTracks({ limit: 24, tags: genre, signal });
    },
    enabled: Boolean(genre),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        if ([400, 401, 403, 404].includes(error.status)) return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        return previousData;
      }
      return undefined;
    },
  });
}

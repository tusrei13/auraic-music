import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./useToastStore";
import { getLikedSongs, recordListening, toggleLikeSong } from "../lib/api";
import { useAuthStore } from "./useAuthStore";
import { EngineTrack } from "@/types/sound-engine";
import { AuraicAudioAdapter, isValidTrackId, sanitizeTrackId, PROXY_BASE } from "@/lib/sound-engine/client";

export interface Track {
  id: number | string;
  title: string;
  artist: string | { id?: string; name: string; avatar?: string };
  image: string;
  audioUrl: string;
  genre?: string | { name: string } | null;
  duration?: number | string | null;
  lyrics?: string | { time: number; text: string }[];
  isEngineTrack?: boolean;
  rawEngineTrack?: EngineTrack;
  streamSource?: "youtube";
}

export function normalizeTrack(track: Track | EngineTrack): Track {
  if (!track) return track as Track;
  if ("is_streamable" in track && "user" in track) {
    const converted = AuraicAudioAdapter.toPlayerTrack(track as EngineTrack);
    return {
      ...converted,
      isEngineTrack: true,
      rawEngineTrack: track as EngineTrack,
    };
  }
  const normalized = track as Track;
  if (normalized.isEngineTrack || normalized.rawEngineTrack) {
    const streamSource = "youtube";
    const cleanId = sanitizeTrackId(normalized.id, "youtube");
    return {
      ...normalized,
      streamSource,
      audioUrl: isValidTrackId(cleanId)
        ? `${PROXY_BASE}/stream?id=${encodeURIComponent(cleanId)}&source=${streamSource}`
        : "",
    };
  }
  return normalized;
}

export interface LocalListeningHistoryItem {
  id: string;
  listenedAt: string;
  song: Track;
}

export type RepeatMode = "off" | "all" | "one";
export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "buffering" | "error";

interface PlayerState {
  currentTrack: Track | null;
  userQueue: Track[];
  contextQueue: Track[];
  originalQueue: Track[];
  contextTitle: string;
  contextIndex: number;
  isPlaying: boolean;
  playbackStatus: PlaybackStatus;
  playbackError: string | null;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  likedIds: (number | string)[];
  likedTracks: Track[];
  isLyricsOpen: boolean;

  playTrack: (track: Track | EngineTrack, contextQueue?: (Track | EngineTrack)[], contextTitle?: string) => void;
  playMix: (tracks: (Track | EngineTrack)[], contextTitle?: string) => void;
  playEngineTrack: (track: EngineTrack, contextQueue?: EngineTrack[], contextTitle?: string) => void;
  addToQueue: (track: Track | EngineTrack) => void;
  removeFromUserQueue: (index: number) => void;
  removeFromContextQueue: (index: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (newQueue: Track[]) => void;
  setQueue: (newQueue: (Track | EngineTrack)[]) => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleCrossfade: () => void;
  setCrossfadeDuration: (duration: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLike: (trackOrId: number | string | Track) => Promise<void>;
  setPlaybackStatus: (status: PlaybackStatus, error?: string | null) => void;
  handlePlaybackError: (errorDetails?: string | unknown) => void;
  recordListening: (songId: number | string) => Promise<void>;
  switchUser: (userId: string | null) => void;
  toggleLyrics: () => void;
  closeLyrics: () => void;
}

export const removeDuplicateTracks = (tracks: Track[]): Track[] => {
  const seen = new Set<string | number>();
  return tracks.filter((t) => {
    if (!t || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

const isPlayableTrack = (track: Track): boolean =>
  !(track.isEngineTrack || track.rawEngineTrack) || isValidTrackId(track.id);

const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getGenrePriority = (track: Track, currentTrack: Track | null): number => {
  if (!currentTrack) return 0;
  const currentGenre = typeof currentTrack.genre === "string" ? currentTrack.genre : currentTrack.genre?.name;
  const trackGenre = typeof track.genre === "string" ? track.genre : track.genre?.name;
  if (currentGenre && trackGenre && currentGenre === trackGenre) return 2;
  return 0;
};

const getArtistPenalty = (track: Track, currentTrack: Track | null): number => {
  if (!currentTrack) return 0;
  const currentArtist = typeof currentTrack.artist === "string" ? currentTrack.artist : currentTrack.artist?.name;
  const trackArtist = typeof track.artist === "string" ? track.artist : track.artist?.name;
  if (currentArtist && trackArtist && currentArtist === trackArtist) return -5;
  return 0;
};

export const smartShuffleArray = (array: Track[], currentTrack: Track | null): Track[] => {
  if (array.length <= 1) return array;
  const arr = [...array];
  const scored = arr.map((track) => ({
    track,
    score: getGenrePriority(track, currentTrack) + getArtistPenalty(track, currentTrack) + Math.random() * 2,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((item) => item.track);
};

let activeUserId: string | null = null;

const saveLikes = (userId: string | null, likedIds: (number | string)[]) => {
  if (typeof window !== "undefined" && userId) {
    localStorage.setItem(`auraic-likes-${userId}`, JSON.stringify(likedIds));
  }
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      userQueue: [],
      contextQueue: [],
      originalQueue: [],
      contextTitle: "Trang chủ",
      contextIndex: 0,
      isPlaying: false,
      playbackStatus: "idle",
      playbackError: null,
      isShuffle: false,
      repeatMode: "off",
      crossfadeEnabled: false,
      crossfadeDuration: 3,
      likedIds: [],
      likedTracks: [],
      isLyricsOpen: false,

      switchUser: (userId) => {
        saveLikes(activeUserId, get().likedIds);
        activeUserId = userId;
        const storageKey = userId ? `auraic-likes-${userId}` : null;
        let likedIds: (number | string)[] = [];
        if (storageKey && typeof window !== "undefined") {
          try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
            if (Array.isArray(stored)) likedIds = stored;
          } catch {
            likedIds = [];
          }
        }
        set({ currentTrack: null, userQueue: [], contextQueue: [], originalQueue: [], contextIndex: 0, isPlaying: false, playbackStatus: "idle", playbackError: null, isShuffle: false, repeatMode: "off", crossfadeEnabled: false, crossfadeDuration: 3, likedIds, likedTracks: [] });
        if (userId && typeof window !== "undefined" && localStorage.getItem("token")) {
          void getLikedSongs().then((likes) => {
            if (activeUserId !== userId) return;
            const likedTracks = likes.map((like) => like.song as Track);
            const serverIds = likedTracks.map((track) => track.id);
            set({ likedIds: serverIds, likedTracks });
            saveLikes(userId, serverIds);
          }).catch(() => undefined);
        }
      },

      playTrack: (track, pageQueue, title) => {
        const normalizedItem = normalizeTrack(track);
        if (normalizedItem.isEngineTrack || normalizedItem.rawEngineTrack) {
          const streamSource = "youtube";
          const cleanId = sanitizeTrackId(normalizedItem.id, "youtube");
          normalizedItem.streamSource = streamSource;
          normalizedItem.audioUrl = isValidTrackId(cleanId)
            ? `${PROXY_BASE}/stream?id=${encodeURIComponent(cleanId)}&source=${streamSource}`
            : "";
        }
        const currentList = pageQueue && pageQueue.length > 0
          ? pageQueue.map(normalizeTrack)
          : [normalizedItem];
        const cleanList = removeDuplicateTracks(currentList).filter(isPlayableTrack);
        if (cleanList.length === 0) {
          useToastStore.getState().addToast("Không có bài hát hợp lệ để phát.", "error");
          return;
        }

        let foundIdx = cleanList.findIndex((t) => String(t.id) === String(normalizedItem.id));
        if (foundIdx === -1) foundIdx = 0;

        const displayTitle = title && title.trim() !== "" ? title : "Auraic Sound Stream";
        const isShuffle = get().isShuffle;

        let activeQueue = [...cleanList];
        let activeIdx = foundIdx;

        if (isShuffle && activeQueue.length > 1) {
          const selectedTrack = activeQueue[foundIdx];
          const remaining = activeQueue.filter((_, idx) => idx !== foundIdx);
          activeQueue = [selectedTrack, ...shuffleArray(remaining)];
          activeIdx = 0;
        }

        set({
          currentTrack: cleanList[foundIdx],
          contextQueue: activeQueue,
          originalQueue: cleanList,
          contextTitle: displayTitle,
          contextIndex: activeIdx,
          isPlaying: true,
          playbackStatus: "loading",
          playbackError: null,
        });
      },

      playEngineTrack: (engineTrack, queue, title) => {
        const normalized = normalizeTrack(engineTrack);
        const normalizedQueue = queue ? queue.map(normalizeTrack) : undefined;
        get().playTrack(normalized, normalizedQueue, title || "Auraic Sound Engine Stream");
      },

      playMix: (tracks, contextTitle = "Mix ngẫu nhiên") => {
        const pool = tracks && tracks.length > 0 ? tracks.map(normalizeTrack) : [];
        if (pool.length === 0) return;
        const cleanTracks = removeDuplicateTracks(pool).filter(isPlayableTrack);
        if (cleanTracks.length === 0) return;
        const shuffled = shuffleArray(cleanTracks);

        set({
          currentTrack: shuffled[0],
          contextQueue: shuffled,
          originalQueue: cleanTracks,
          contextTitle,
          contextIndex: 0,
          isPlaying: true,
          playbackStatus: "loading",
          playbackError: null,
          isShuffle: true,
        });
      },

      addToQueue: (track) => {
        const normalized = normalizeTrack(track);
        const { userQueue, currentTrack } = get();
        if (String(currentTrack?.id) === String(normalized.id)) {
          useToastStore.getState().addToast("Bài hát đang phát!", "info");
          return;
        }

        const filtered = userQueue.filter((t) => String(t.id) !== String(normalized.id));
        set({ userQueue: [...filtered, normalized] });
        useToastStore.getState().addToast(`Đã thêm "${normalized.title}" vào Hàng đợi`, "success");
      },

      removeFromUserQueue: (index) => {
        const track = get().userQueue[index];
        set((state) => ({
          userQueue: state.userQueue.filter((_, i) => i !== index),
        }));
        if (track) {
          useToastStore.getState().addToast(`Đã xóa "${track.title}" khỏi Hàng đợi`, "info");
        }
      },

      removeFromContextQueue: (index) => {
        set((state) => {
          const track = state.contextQueue[index];
          const newContext = state.contextQueue.filter((_, i) => i !== index);
          let newIndex = state.contextIndex;
          if (index < state.contextIndex) {
            newIndex = Math.max(0, state.contextIndex - 1);
          } else if (newIndex >= newContext.length) {
            newIndex = Math.max(0, newContext.length - 1);
          }

          if (track) {
            useToastStore.getState().addToast(`Đã xóa "${track.title}" khỏi danh sách`, "info");
          }

          return {
            contextQueue: newContext,
            contextIndex: newIndex,
          };
        });
      },

      removeFromQueue: (index) => {
        const { userQueue } = get();
        if (index < userQueue.length) {
          get().removeFromUserQueue(index);
        } else {
          get().removeFromContextQueue(index - userQueue.length);
        }
      },

      clearQueue: () => {
        set({ userQueue: [] });
        useToastStore.getState().addToast("Đã xóa toàn bộ Hàng đợi", "info");
      },

      reorderQueue: (newQueue) => set({ userQueue: removeDuplicateTracks(newQueue) }),

      setQueue: (newQueue) => {
        const normalized = newQueue.map(normalizeTrack);
        set({ 
          contextQueue: removeDuplicateTracks(normalized), 
          originalQueue: removeDuplicateTracks(normalized) 
        });
      },

      togglePlay: () => set((state) => ({
        isPlaying: !state.isPlaying,
        playbackStatus: state.isPlaying ? "paused" : "loading",
        playbackError: null,
      })),

      handlePlaybackError: (errorDetails?: string | unknown) => {
        const state = get();
        const current = state.currentTrack;
        if (state.playbackStatus === "error") return;

        console.warn(
          `[PlayerStore] Playback error on track "${current?.title}" (ID: ${current?.id}):`,
          errorDetails
        );

        const errorMsg =
          typeof errorDetails === "string"
            ? errorDetails
            : "Không thể phát bài hát này.";

        set({
          playbackStatus: "error",
          playbackError: errorMsg,
          isPlaying: false,
        });

        useToastStore
          .getState()
          .addToast(
            `Không thể tải "${current?.title || "bài hát"}". Chuyển bài tiếp theo...`,
            "error"
          );

        // Auto-advance to the next available track after a short delay
        setTimeout(() => {
          const latestState = get();
          // Only skip if the errored track is still the current one
          if (
            latestState.playbackStatus === "error" &&
            latestState.currentTrack &&
            String(latestState.currentTrack.id) === String(current?.id)
          ) {
            latestState.nextTrack();
          }
        }, 1500);
      },

      setPlaybackStatus: (playbackStatus, playbackError = null) => {
        const previousState = get();
        if (
          playbackStatus === "error" &&
          previousState.playbackStatus === "error" &&
          previousState.currentTrack
        ) {
          return;
        }

        set({ playbackStatus, playbackError });
        if (playbackStatus === "error") {
          const state = get();
          const current = state.currentTrack;
          console.warn(
            `[PlayerStore] Playback status error on track "${current?.title}" (ID: ${current?.id}):`,
            playbackError
          );
          if (current) {
            useToastStore
              .getState()
              .addToast(
                `Không thể tải "${current.title}". Chuyển bài tiếp theo...`,
                "error"
              );
            setTimeout(() => {
              const latestState = get();
              // Only auto-advance if still in error state on the same track
              if (
                latestState.playbackStatus === "error" &&
                latestState.currentTrack &&
                String(latestState.currentTrack.id) === String(current.id)
              ) {
                latestState.nextTrack();
              }
            }, 1500);
          }
        }
      },

      recordListening: async (songId) => {
        if (typeof window === "undefined" || !localStorage.getItem("token")) return;
        if (AuraicAudioAdapter.isYouTubeTrackId(songId)) {
          // Record provider track play to local history
          const userId = useAuthStore.getState().user?.id;
          if (userId && get().currentTrack) {
            const storageKey = `auraic-history-${userId}`;
            let history: any[] = [];
            try {
              const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
              if (Array.isArray(stored)) history = stored;
            } catch {
              history = [];
            }
            history = [
              {
                id: `${String(songId)}-${Date.now()}`,
                listenedAt: new Date().toISOString(),
                song: get().currentTrack,
              },
              ...history.filter((item) => String(item.song?.id) !== String(songId)),
            ].slice(0, 50);
            localStorage.setItem(storageKey, JSON.stringify(history));
            window.dispatchEvent(new CustomEvent("auraic:history-updated"));
          }
          return;
        }

        try {
          await recordListening(songId);
        } catch {
          // Listening history must not interrupt playback.
        }
      },

      toggleShuffle: () =>
        set((state) => {
          const newIsShuffle = !state.isShuffle;

          if (newIsShuffle && state.contextQueue.length > 1) {
            const played = state.contextQueue.slice(0, state.contextIndex + 1);
            const remaining = state.contextQueue.slice(state.contextIndex + 1);

            return { 
              isShuffle: true, 
              contextQueue: [...played, ...smartShuffleArray(remaining, state.currentTrack)] 
            };
          } else if (!newIsShuffle && state.originalQueue.length > 0 && state.currentTrack) {
            const cleanOriginal = removeDuplicateTracks(state.originalQueue);
            const foundIdx = cleanOriginal.findIndex((t) => String(t.id) === String(state.currentTrack?.id));
            
            if (foundIdx !== -1) {
              return { isShuffle: false, contextQueue: cleanOriginal, contextIndex: foundIdx };
            }
          }

          return { isShuffle: newIsShuffle };
        }),

      toggleRepeat: () =>
        set((state) => {
          const modes: RepeatMode[] = ["off", "all", "one"];
          return { repeatMode: modes[(modes.indexOf(state.repeatMode) + 1) % modes.length] };
        }),

      toggleCrossfade: () =>
        set((state) => ({ crossfadeEnabled: !state.crossfadeEnabled })),

      setCrossfadeDuration: (duration: number) =>
        set({ crossfadeDuration: Math.min(10, Math.max(1, duration)) }),

      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      closeLyrics: () => set({ isLyricsOpen: false }),

      nextTrack: () => {
        const { userQueue, contextQueue, contextIndex, repeatMode, isShuffle, currentTrack } = get();

        if (repeatMode === "one") {
          set({ isPlaying: true });
          return;
        }

        if (userQueue.length > 0) {
          const next = userQueue[0];
          set({
            currentTrack: next,
            userQueue: userQueue.slice(1),
            isPlaying: true,
          });
          return;
        }

        if (contextQueue.length === 0) return;

        let newQueue = [...contextQueue];
        let nextIdx = 0;

        if (isShuffle) {
          if (contextIndex < newQueue.length - 1) {
            const remaining = newQueue.slice(contextIndex + 1);
            const shuffled = smartShuffleArray(remaining, currentTrack);
            newQueue = [...newQueue.slice(0, contextIndex + 1), ...shuffled];
            nextIdx = contextIndex + 1;
          } else {
            newQueue = smartShuffleArray(newQueue, currentTrack);
            nextIdx = 0;
          }
        } else {
          nextIdx = (contextIndex + 1) % newQueue.length;
        }

        set({
          currentTrack: newQueue[nextIdx],
          contextQueue: newQueue,
          contextIndex: nextIdx,
          isPlaying: true,
          playbackStatus: "loading",
          playbackError: null,
        });
      },

      prevTrack: () => {
        const { contextQueue, contextIndex } = get();
        if (contextQueue.length === 0) return;

        const prevIdx = (contextIndex - 1 + contextQueue.length) % contextQueue.length;

        set({
          currentTrack: contextQueue[prevIdx],
          contextIndex: prevIdx,
          isPlaying: true,
        });
      },

      toggleLike: async (trackOrId) => {
        if (typeof window !== "undefined" && !localStorage.getItem("token")) {
          useAuthStore.getState().openAuthModal();
          return;
        }
        let id: number | string;
        let trackTitle = "";
        const state = get();
        if (typeof trackOrId === "object" && trackOrId !== null) {
          id = trackOrId.id;
          trackTitle = trackOrId.title || "";
        } else {
          id = trackOrId;
          const foundTrack = state.currentTrack?.id === id
            ? state.currentTrack
            : state.contextQueue.find((t) => String(t.id) === String(id)) ||
              state.userQueue.find((t) => String(t.id) === String(id)) ||
              state.originalQueue.find((t) => String(t.id) === String(id)) ||
              undefined;
          trackTitle = foundTrack?.title || "";
        }
        const wasLiked = state.likedIds.some((item) => String(item) === String(id));
        set((current) => ({
          likedIds: wasLiked
            ? current.likedIds.filter((item) => String(item) !== String(id))
            : [...current.likedIds, id],
        }));
        saveLikes(activeUserId, get().likedIds);
        const formattedTitle = trackTitle.trim() ? `"${trackTitle}"` : "bài hát";
        useToastStore.getState().addToast(
          `${wasLiked ? "Đã xóa" : "Đã thêm"} ${formattedTitle} ${wasLiked ? "khỏi" : "vào"} Yêu thích`,
          wasLiked ? "info" : "success"
        );
        if (typeof window !== "undefined" && localStorage.getItem("token")) {
          try {
            const result = await toggleLikeSong(id);
            set((current) => ({
              likedIds: result.liked
                ? current.likedIds.some((item) => String(item) === String(id))
                  ? current.likedIds
                  : [...current.likedIds, id]
                : current.likedIds.filter((item) => String(item) !== String(id)),
              likedTracks: result.liked && typeof trackOrId === "object"
                ? [trackOrId, ...current.likedTracks.filter((item) => String(item.id) !== String(id))]
                : current.likedTracks.filter((item) => String(item.id) !== String(id)),
            }));
          } catch {
            set((current) => ({
              likedIds: wasLiked
                ? [...current.likedIds, id]
                : current.likedIds.filter((item) => String(item) !== String(id)),
              likedTracks: wasLiked || typeof trackOrId !== "object"
                ? current.likedTracks
                : current.likedTracks.filter((item) => String(item.id) !== String(id)),
            }));
          }
        }
      },
    }),
    {
      name: "auraic-player-storage",
      partialize: (state) => ({
        likedIds: state.likedIds,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
      }),
    }
  )
);

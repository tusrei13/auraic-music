import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./useToastStore";
import { recordListening, toggleLikeSong } from "../lib/api";
import { useAuthStore } from "./useAuthStore";

export interface Track {
  id: number | string;
  title: string;
  artist: string | { name: string };
  image: string;
  audioUrl: string;
  genre?: string | { name: string } | null;
  duration?: number | string | null;
  lyrics?: string | { time: number; text: string }[];
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
  likedIds: (number | string)[];

  playTrack: (track: Track, contextQueue?: Track[], contextTitle?: string) => void;
  playMix: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromUserQueue: (index: number) => void;
  removeFromContextQueue: (index: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (newQueue: Track[]) => void;
  setQueue: (newQueue: Track[]) => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLike: (trackOrId: number | string | Track) => Promise<void>;
  setPlaybackStatus: (status: PlaybackStatus, error?: string | null) => void;
  recordListening: (songId: number | string) => Promise<void>;
}

export const removeDuplicateTracks = (tracks: Track[]): Track[] => {
  const seen = new Set<string | number>();
  return tracks.filter((t) => {
    if (!t || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
      likedIds: [],

      playTrack: (track, pageQueue, title) => {
        const currentList = pageQueue && pageQueue.length > 0 ? [...pageQueue] : [track];
        const cleanList = removeDuplicateTracks(currentList);

        let foundIdx = cleanList.findIndex((t) => String(t.id) === String(track.id));
        if (foundIdx === -1) {
          cleanList.unshift(track);
          foundIdx = 0;
        }

        const displayTitle = title && title.trim() !== "" ? title : "Danh sách phát";
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
          currentTrack: track,
          contextQueue: activeQueue,
          originalQueue: cleanList,
          contextTitle: displayTitle,
          contextIndex: activeIdx,
          isPlaying: true,
          playbackStatus: "loading",
          playbackError: null,
        });
      },

      playMix: (tracks) => {
        const pool = tracks && tracks.length > 0 ? tracks : [];
        if (pool.length === 0) return;
        const cleanTracks = removeDuplicateTracks(pool);
        const shuffled = shuffleArray(cleanTracks);

        set({
          currentTrack: shuffled[0],
          contextQueue: shuffled,
          originalQueue: cleanTracks,
          contextTitle: "Mix ngẫu nhiên",
          contextIndex: 0,
          isPlaying: true,
          playbackStatus: "loading",
          playbackError: null,
          isShuffle: true,
        });
      },

      addToQueue: (track) => {
        const { userQueue, currentTrack } = get();
        if (String(currentTrack?.id) === String(track.id)) {
          useToastStore.getState().addToast("Bài hát đang phát!", "info");
          return;
        }

        const filtered = userQueue.filter((t) => String(t.id) !== String(track.id));
        set({ userQueue: [...filtered, track] });
        useToastStore.getState().addToast(`Đã thêm "${track.title}" vào Hàng đợi`, "success");
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

      setQueue: (newQueue) => set({ 
        contextQueue: removeDuplicateTracks(newQueue), 
        originalQueue: removeDuplicateTracks(newQueue) 
      }),

      togglePlay: () => set((state) => ({
        isPlaying: !state.isPlaying,
        playbackStatus: state.isPlaying ? "paused" : "loading",
        playbackError: null,
      })),

      setPlaybackStatus: (playbackStatus, playbackError = null) =>
        set({ playbackStatus, playbackError }),

      recordListening: async (songId) => {
        if (typeof window === "undefined" || !localStorage.getItem("token")) return;
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
              contextQueue: [...played, ...shuffleArray(remaining)] 
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

      nextTrack: () => {
        const { userQueue, contextQueue, contextIndex, repeatMode, isShuffle } = get();

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
            const randomIndex = Math.floor(
              Math.random() * (newQueue.length - (contextIndex + 1))
            ) + (contextIndex + 1);

            [newQueue[contextIndex + 1], newQueue[randomIndex]] = [
              newQueue[randomIndex],
              newQueue[contextIndex + 1],
            ];

            nextIdx = contextIndex + 1;
          } else {
            newQueue = shuffleArray(newQueue);
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
            }));
          } catch {
            set((current) => ({
              likedIds: wasLiked
                ? [...current.likedIds, id]
                : current.likedIds.filter((item) => String(item) !== String(id)),
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

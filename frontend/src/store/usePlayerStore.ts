import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./useToastStore";

export interface Track {
  id: number | string;
  title: string;
  artist: string | { name: string };
  image: string;
  audioUrl: string;
  genre?: string;
  duration?: string;
  lyrics?: { time: number; text: string }[];
}

export type RepeatMode = "off" | "all" | "one";

export const ALL_TRACKS: Track[] = [
  { id: 1, title: "Chúng Ta Của Tương Lai", artist: "Sơn Tùng M-TP", image: "/images/1.jpg", audioUrl: "/audio/1.mp3", genre: "Pop" },
  { id: 2, title: "Nấu Ăn Cho Em", artist: "Đen Vâu", image: "/images/2.jpg", audioUrl: "/audio/2.mp3", genre: "Hip Hop / Rap" },
  { id: 3, title: "Nốt Nhạc Trôi", artist: "Chillies", image: "/images/3.jpg", audioUrl: "/audio/3.mp3", genre: "Indie Vietnam" },
  { id: 4, title: "Dạ Vũ Không Tên", artist: "Hoàng Dũng", image: "/images/4.jpg", audioUrl: "/audio/4.mp3", genre: "Indie Vietnam" },
  { id: 5, title: "Midnight City", artist: "M83", image: "/images/5.jpg", audioUrl: "/audio/5.mp3", genre: "Synthwave" },
  { id: 6, title: "Coffee & Rain", artist: "Lofi Girl", image: "/images/6.jpg", audioUrl: "/audio/6.mp3", genre: "Lofi Chill" },
];

interface PlayerState {
  currentTrack: Track | null;
  userQueue: Track[];
  contextQueue: Track[];
  originalQueue: Track[];
  contextTitle: string;
  contextIndex: number;
  isPlaying: boolean;
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
  toggleLike: (id: number | string) => void;
}

const removeDuplicateTracks = (tracks: Track[]): Track[] => {
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
        });
      },

      playMix: (tracks) => {
        const pool = tracks && tracks.length > 0 ? tracks : ALL_TRACKS;
        const cleanTracks = removeDuplicateTracks(pool);
        const shuffled = shuffleArray(cleanTracks);

        set({
          currentTrack: shuffled[0],
          contextQueue: shuffled,
          originalQueue: cleanTracks,
          contextTitle: "Mix ngẫu nhiên",
          contextIndex: 0,
          isPlaying: true,
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

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

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

      toggleLike: (id) =>
        set((state) => {
          const isLiked = state.likedIds.some((item) => String(item) === String(id));
          const track = ALL_TRACKS.find((t) => String(t.id) === String(id)) || state.currentTrack;
          const trackTitle = track ? `"${track.title}"` : "bài hát";

          if (isLiked) {
            useToastStore.getState().addToast(`Đã xóa ${trackTitle} khỏi Yêu thích`, "info");
          } else {
            useToastStore.getState().addToast(`Đã thêm ${trackTitle} vào Yêu thích`, "success");
          }

          return {
            likedIds: isLiked
              ? state.likedIds.filter((item) => String(item) !== String(id))
              : [...state.likedIds, id],
          };
        }),
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
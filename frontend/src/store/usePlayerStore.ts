import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Track {
  id: number;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
  genre?: string;
  duration?: string;
  lyrics?: { time: number; text: string }[];
}

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentTrack: Track | null;
  currentIndex: number;
  queue: Track[];
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  likedIds: number[];

  playTrack: (track: Track, queue?: Track[], index?: number) => void;
  playMix: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLike: (id: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      currentIndex: 0,
      queue: [],
      isPlaying: false,
      isShuffle: false,
      repeatMode: "off",
      likedIds: [],

      playTrack: (track, newQueue, index) => {
        const currentQueue = newQueue && newQueue.length > 0 ? newQueue : get().queue;
        let targetIndex = index;

        // Nếu không truyền index cụ thể thì tìm vị trí đầu tiên của bài hát trong queue
        if (targetIndex === undefined) {
          const foundIndex = currentQueue.findIndex((t) => t.id === track.id);
          targetIndex = foundIndex !== -1 ? foundIndex : 0;
        }

        set({
          currentTrack: track,
          currentIndex: targetIndex,
          queue: currentQueue,
          isPlaying: true,
        });
      },

      playMix: (tracks) => {
        if (!tracks || tracks.length === 0) return;
        const randomIndex = Math.floor(Math.random() * tracks.length);
        set({
          currentTrack: tracks[randomIndex],
          currentIndex: randomIndex,
          queue: tracks,
          isPlaying: true,
          isShuffle: true,
        });
      },

      // Thêm bài hát vào cuối hàng đợi phát hiện tại
      addToQueue: (track) => {
        set((state) => ({
          queue: [...state.queue, track],
        }));
      },

      // Xóa bài hát khỏi hàng đợi theo vị trí
      removeFromQueue: (index) => {
        set((state) => {
          const newQueue = state.queue.filter((_, i) => i !== index);
          let newIndex = state.currentIndex;

          if (index < state.currentIndex) {
            newIndex = Math.max(0, state.currentIndex - 1);
          } else if (index === state.currentIndex && newQueue.length > 0) {
            newIndex = Math.min(state.currentIndex, newQueue.length - 1);
          }

          return {
            queue: newQueue,
            currentIndex: newIndex,
            currentTrack: newQueue.length > 0 ? newQueue[newIndex] : null,
          };
        });
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

      toggleRepeat: () =>
        set((state) => {
          const modes: RepeatMode[] = ["off", "all", "one"];
          const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
          return { repeatMode: modes[nextIndex] };
        }),

      nextTrack: () => {
        const { queue, currentIndex, isShuffle, repeatMode } = get();
        if (queue.length === 0) return;

        if (repeatMode === "one") {
          set({ isPlaying: true });
          return;
        }

        if (isShuffle && queue.length > 1) {
          let randomIndex = currentIndex;
          while (randomIndex === currentIndex) {
            randomIndex = Math.floor(Math.random() * queue.length);
          }
          set({
            currentIndex: randomIndex,
            currentTrack: queue[randomIndex],
            isPlaying: true,
          });
          return;
        }

        if (currentIndex < queue.length - 1) {
          const nextIndex = currentIndex + 1;
          set({
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex],
            isPlaying: true,
          });
        } else if (repeatMode === "all") {
          set({
            currentIndex: 0,
            currentTrack: queue[0],
            isPlaying: true,
          });
        } else {
          set({ isPlaying: false });
        }
      },

      prevTrack: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;

        const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
        set({
          currentIndex: prevIndex,
          currentTrack: queue[prevIndex],
          isPlaying: true,
        });
      },

      toggleLike: (id) =>
        set((state) => ({
          likedIds: state.likedIds.includes(id)
            ? state.likedIds.filter((item) => item !== id)
            : [...state.likedIds, id],
        })),
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
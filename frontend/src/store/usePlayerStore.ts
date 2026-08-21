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
  queue: Track[];
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  likedIds: number[];

  playTrack: (track: Track, queue?: Track[]) => void;
  playMix: (tracks: Track[]) => void;
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
      queue: [],
      isPlaying: false,
      isShuffle: false,
      repeatMode: "off",
      likedIds: [],

      playTrack: (track, queue) => {
        set({
          currentTrack: track,
          queue: queue && queue.length > 0 ? queue : get().queue,
          isPlaying: true,
        });
      },

      playMix: (tracks) => {
        if (!tracks || tracks.length === 0) return;
        const randomIndex = Math.floor(Math.random() * tracks.length);
        set({
          currentTrack: tracks[randomIndex],
          queue: tracks,
          isPlaying: true,
          isShuffle: true,
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
        const { queue, currentTrack, isShuffle, repeatMode } = get();
        if (!currentTrack || queue.length === 0) return;

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

        if (repeatMode === "one") {
          set({ isPlaying: true });
          return;
        }

        if (isShuffle && queue.length > 1) {
          let randomIndex = currentIndex;
          while (randomIndex === currentIndex) {
            randomIndex = Math.floor(Math.random() * queue.length);
          }
          set({ currentTrack: queue[randomIndex], isPlaying: true });
          return;
        }

        if (currentIndex < queue.length - 1) {
          set({ currentTrack: queue[currentIndex + 1], isPlaying: true });
        } else if (repeatMode === "all") {
          set({ currentTrack: queue[0], isPlaying: true });
        } else {
          set({ isPlaying: false });
        }
      },

      prevTrack: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack || queue.length === 0) return;

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
        if (currentIndex > 0) {
          set({ currentTrack: queue[currentIndex - 1], isPlaying: true });
        } else {
          set({ currentTrack: queue[queue.length - 1], isPlaying: true });
        }
      },

      toggleLike: (id) =>
        set((state) => ({
          likedIds: state.likedIds.includes(id)
            ? state.likedIds.filter((item) => item !== id)
            : [...state.likedIds, id],
        })),
    }),
    {
      name: "auraic-player-storage", // Khóa lưu trữ dưới localStorage
      partialize: (state) => ({
        likedIds: state.likedIds,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
      }), // Chỉ lưu các state này, không lưu trạng thái đang phát hay bài hát hiện tại
    }
  )
);
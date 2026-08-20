import { create } from "zustand";

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
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLike: (id: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
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

    // Chế độ Lặp 1 bài
    if (repeatMode === "one") {
      set({ isPlaying: true });
      return;
    }

    // Chế độ Trộn bài (Phát ngẫu nhiên bài khác bài hiện tại)
    if (isShuffle && queue.length > 1) {
      let randomIndex = currentIndex;
      while (randomIndex === currentIndex) {
        randomIndex = Math.floor(Math.random() * queue.length);
      }
      set({ currentTrack: queue[randomIndex], isPlaying: true });
      return;
    }

    // Chế độ phát theo thứ tự danh sách
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
}));
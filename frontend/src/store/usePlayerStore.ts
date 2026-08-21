import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Track {
  id: number;
  title: string;
  artist: string | { name: string };
  image: string;
  audioUrl: string;
  genre?: string;
  duration?: string;
  lyrics?: { time: number; text: string }[];
}

export type RepeatMode = "off" | "all" | "one";

// Kho bài hát hệ thống đầy đủ để bù vào hàng đợi khi trang hiện tại hết bài
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
  contextTitle: string;
  contextIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  likedIds: number[];

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
  toggleLike: (id: number) => void;
}

const removeDuplicateTracks = (tracks: Track[]): Track[] => {
  const seen = new Set<number>();
  return tracks.filter((t) => {
    if (!t || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      userQueue: [],
      contextQueue: [],
      contextTitle: "Trang chủ",
      contextIndex: 0,
      isPlaying: false,
      isShuffle: false,
      repeatMode: "off",
      likedIds: [],

      playTrack: (track, pageQueue, title = "Gợi ý hôm nay") => {
        // 1. Lấy danh sách phát từ trang hiện tại
        const currentList = pageQueue && pageQueue.length > 0 ? pageQueue : [track];

        // 2. Định vị bài được chọn
        let foundIdx = currentList.findIndex((t) => t.id === track.id);
        if (foundIdx === -1) {
          currentList.unshift(track);
          foundIdx = 0;
        }

        // 3. Lấy bài chọn + các bài đứng sau nó trên trang
        const remainingInPage = currentList.slice(foundIdx);

        // 4. Lấy tất cả bài còn lại trong hệ thống làm nguồn gợi ý dự phòng
        const fallbackPool = ALL_TRACKS.filter(
          (t) => !remainingInPage.some((item) => item.id === t.id)
        );

        // 5. Kết hợp lại thành hàng đợi không bao giờ trống
        const fullContextQueue = removeDuplicateTracks([...remainingInPage, ...fallbackPool]);

        set({
          currentTrack: track,
          contextQueue: fullContextQueue,
          contextTitle: title,
          contextIndex: 0,
          isPlaying: true,
        });
      },

      playMix: (tracks) => {
        const pool = tracks && tracks.length > 0 ? tracks : ALL_TRACKS;
        const cleanTracks = removeDuplicateTracks(pool);

        for (let i = cleanTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cleanTracks[i], cleanTracks[j]] = [cleanTracks[j], cleanTracks[i]];
        }

        set({
          currentTrack: cleanTracks[0],
          contextQueue: cleanTracks,
          contextTitle: "Mix ngẫu nhiên",
          contextIndex: 0,
          isPlaying: true,
          isShuffle: true,
        });
      },

      addToQueue: (track) => {
        const { userQueue, currentTrack } = get();
        if (currentTrack?.id === track.id) return;

        const filtered = userQueue.filter((t) => t.id !== track.id);
        set({ userQueue: [...filtered, track] });
      },

      removeFromUserQueue: (index) => {
        set((state) => ({
          userQueue: state.userQueue.filter((_, i) => i !== index),
        }));
      },

      removeFromContextQueue: (index) => {
        set((state) => ({
          contextQueue: state.contextQueue.filter((_, i) => i !== index),
        }));
      },

      removeFromQueue: (index) => {
        const { userQueue } = get();
        if (index < userQueue.length) {
          get().removeFromUserQueue(index);
        } else {
          get().removeFromContextQueue(index - userQueue.length);
        }
      },

      clearQueue: () => set({ userQueue: [] }),

      reorderQueue: (newQueue) => set({ userQueue: removeDuplicateTracks(newQueue) }),

      setQueue: (newQueue) => set({ contextQueue: removeDuplicateTracks(newQueue) }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      toggleShuffle: () =>
        set((state) => {
          const newIsShuffle = !state.isShuffle;
          if (newIsShuffle && state.contextQueue.length > 1) {
            const played = state.contextQueue.slice(0, state.contextIndex + 1);
            const remaining = [...state.contextQueue.slice(state.contextIndex + 1)];

            for (let i = remaining.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
            }

            return { isShuffle: true, contextQueue: [...played, ...remaining] };
          }
          return { isShuffle: newIsShuffle };
        }),

      toggleRepeat: () =>
        set((state) => {
          const modes: RepeatMode[] = ["off", "all", "one"];
          return { repeatMode: modes[(modes.indexOf(state.repeatMode) + 1) % modes.length] };
        }),

      nextTrack: () => {
        const { userQueue, contextQueue, contextIndex, repeatMode } = get();

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

        if (contextIndex < contextQueue.length - 1) {
          const nextIdx = contextIndex + 1;
          set({
            currentTrack: contextQueue[nextIdx],
            contextIndex: nextIdx,
            isPlaying: true,
          });
        } else if (repeatMode === "all" && contextQueue.length > 0) {
          set({
            currentTrack: contextQueue[0],
            contextIndex: 0,
            isPlaying: true,
          });
        } else {
          set({ isPlaying: false });
        }
      },

      prevTrack: () => {
        const { contextQueue, contextIndex } = get();
        if (contextQueue.length === 0) return;

        const prevIdx = contextIndex > 0 ? contextIndex - 1 : contextQueue.length - 1;
        set({
          currentTrack: contextQueue[prevIdx],
          contextIndex: prevIdx,
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
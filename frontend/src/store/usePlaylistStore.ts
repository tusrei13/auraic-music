import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Track } from "./usePlayerStore";
import { useToastStore } from "./useToastStore";

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  tracks: Track[];
  coverImage?: string;
  createdAt: string;
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (title: string, initialTrack?: Track) => Playlist;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string | number) => void;
  deletePlaylist: (playlistId: string) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [
        {
          id: "1",
          title: "you",
          description: "Playlist cá nhân mới tạo trên AURAIC Sound Space.",
          tracks: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "chill",
          description: "Playlist cá nhân mới tạo trên AURAIC Sound Space.",
          tracks: [],
          createdAt: new Date().toISOString(),
        },
      ],

      createPlaylist: (title, initialTrack) => {
        const newId = Math.random().toString(36).substring(2, 9);
        const newPlaylist: Playlist = {
          id: newId,
          title: title.trim() || "Playlist mới",
          description: "Playlist cá nhân mới tạo trên AURAIC Sound Space.",
          tracks: initialTrack ? [initialTrack] : [],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          playlists: [newPlaylist, ...state.playlists],
        }));

        if (initialTrack) {
          useToastStore.getState().addToast(
            `Đã tạo playlist "${newPlaylist.title}" và thêm "${initialTrack.title}"`,
            "success"
          );
        } else {
          useToastStore.getState().addToast(`Đã tạo playlist "${newPlaylist.title}"`, "success");
        }

        return newPlaylist;
      },

      addTrackToPlaylist: (playlistId, track) => {
        const { playlists } = get();
        const targetPlaylist = playlists.find((p) => p.id === playlistId);

        if (!targetPlaylist) return;

        const exists = targetPlaylist.tracks.some((t) => String(t.id) === String(track.id));
        if (exists) {
          useToastStore.getState().addToast(
            `Bài hát đã có trong playlist "${targetPlaylist.title}"`,
            "info"
          );
          return;
        }

        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p
          ),
        }));

        useToastStore.getState().addToast(
          `Đã thêm "${track.title}" vào playlist "${targetPlaylist.title}"`,
          "success"
        );
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((t) => String(t.id) !== String(trackId)) }
              : p
          ),
        }));
        useToastStore.getState().addToast("Đã xóa bài hát khỏi playlist", "info");
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
        useToastStore.getState().addToast("Đã xóa playlist", "info");
      },
    }),
    {
      name: "auraic-playlist-storage",
    }
  )
);
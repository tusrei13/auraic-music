import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Track } from "./usePlayerStore";
import { useToastStore } from "./useToastStore";
import { useAuthStore } from "./useAuthStore";
import {
  addSongToPlaylist as addSongToPlaylistApi,
  createPlaylist as createPlaylistApi,
  deletePlaylist as deletePlaylistApi,
  getCurrentUser,
  removeSongFromPlaylist as removeSongFromPlaylistApi,
  isJamendoTrackId,
} from "../lib/api";

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
  createPlaylist: (title: string, initialTrack?: Track) => Playlist | null;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string | number) => void;
  deletePlaylist: (playlistId: string) => void;
  hydrate: () => Promise<void>;
}

const hasToken = () => typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

const toLocalPlaylist = (playlist: any): Playlist => ({
  id: playlist.id,
  title: playlist.title || playlist.name,
  description: playlist.description,
  coverImage: playlist.coverImage,
  createdAt: playlist.createdAt,
  tracks: playlist.tracks || playlist.songs?.map((item: any) => item.song).filter(Boolean) || [],
});

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
        if (!hasToken()) {
          useAuthStore.getState().openAuthModal();
          return null;
        }
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

        if (hasToken()) {
          void createPlaylistApi({ name: newPlaylist.title, coverImage: newPlaylist.coverImage }).then(async (remote) => {
            set((state) => ({
              playlists: state.playlists.map((playlist) =>
                playlist.id === newId ? { ...playlist, id: remote.id } : playlist
              ),
            }));
            if (initialTrack && !isJamendoTrackId(initialTrack.id)) await addSongToPlaylistApi(remote.id, initialTrack.id);
          }).catch(() => {
            useToastStore.getState().addToast("Không thể đồng bộ playlist với máy chủ", "error");
          });
        }

        return newPlaylist;
      },

      addTrackToPlaylist: (playlistId, track) => {
        if (!hasToken()) {
          useAuthStore.getState().openAuthModal();
          return;
        }
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

        if (hasToken() && !isJamendoTrackId(track.id)) {
          void addSongToPlaylistApi(playlistId, track.id).catch(() => {
            useToastStore.getState().addToast("Không thể đồng bộ bài hát với playlist", "error");
          });
        }
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        if (!hasToken()) {
          useAuthStore.getState().openAuthModal();
          return;
        }
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((t) => String(t.id) !== String(trackId)) }
              : p
          ),
        }));
        useToastStore.getState().addToast("Đã xóa bài hát khỏi playlist", "info");
        if (hasToken() && !isJamendoTrackId(trackId)) {
          void removeSongFromPlaylistApi(playlistId, trackId).catch(() => {
            useToastStore.getState().addToast("Không thể đồng bộ thay đổi với máy chủ", "error");
          });
        }
      },

      deletePlaylist: (playlistId) => {
        if (!hasToken()) {
          useAuthStore.getState().openAuthModal();
          return;
        }
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
        useToastStore.getState().addToast("Đã xóa playlist", "info");
        if (hasToken()) {
          void deletePlaylistApi(playlistId).catch(() => {
            useToastStore.getState().addToast("Không thể xóa playlist trên máy chủ", "error");
          });
        }
      },

      hydrate: async () => {
        if (!hasToken()) return;
        try {
          const user = await getCurrentUser();
          set({ playlists: user.playlists.map(toLocalPlaylist) });
        } catch {
          useToastStore.getState().addToast("Không thể tải playlist từ máy chủ", "error");
        }
      },
    }),
    {
      name: "auraic-playlist-storage",
    }
  )
);
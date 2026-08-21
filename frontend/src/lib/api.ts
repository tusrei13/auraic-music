const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Artist { id: string; name: string; avatar: string; listeners?: number; songs?: Song[] }
export interface Genre { id: string; name: string; image: string; color?: string | null }
export interface Song { id: number; title: string; audioUrl: string; image: string; lyrics?: Array<{ time: number; text: string }>; playCount?: number; artist: Artist | string; genre?: Genre | string | null }
export interface Playlist { id: string; name: string; coverImage?: string | null; color?: string | null; userId?: string; songs?: Array<{ song: Song }> }
export interface SearchResult { songs: Song[]; artists: Artist[]; playlists: Playlist[] }
export interface CurrentUser { id: string; email: string; name?: string | null; playlists: Playlist[] }

// Hàm helper để gọi fetch ngắn gọn và tự động gắn Auth Token
async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }

  return res.json();
}

// 1. BÀI HÁT (SONGS)
export const getSongs = () => fetcher<Song[]>("/songs");
export const getSongById = (id: string | number) => fetcher<Song>(`/songs/${id}`);

// 2. PLAYLISTS
export const getPlaylists = () => fetcher<Playlist[]>("/playlists");
export const getPlaylistById = (id: string) => fetcher<Playlist>(`/playlists/${id}`);
export const createPlaylist = (data: { name: string; coverImage?: string; color?: string }) =>
  fetcher<Playlist>('/playlists', { method: 'POST', body: JSON.stringify(data) });
export const addSongToPlaylist = (playlistId: string, songId: string | number) =>
  fetcher(`/playlists/${encodeURIComponent(playlistId)}/songs`, {
    method: 'POST',
    body: JSON.stringify({ songId }),
  });
export const removeSongFromPlaylist = (playlistId: string, songId: string | number) =>
  fetcher(`/playlists/${encodeURIComponent(playlistId)}/songs/${songId}`, { method: 'DELETE' });
export const deletePlaylist = (playlistId: string) =>
  fetcher(`/playlists/${encodeURIComponent(playlistId)}`, { method: 'DELETE' });
export const getCurrentUser = () => fetcher<CurrentUser>('/auth/me');

// 3. NGHỆ SĨ (ARTISTS)
export const getArtists = () => fetcher<Artist[]>("/artists");
export const getArtistById = (id: string) => fetcher<Artist>(`/artists/${encodeURIComponent(id)}`);

// 4. TÌM KIẾM (SEARCH)
export const searchAll = (query: string) => fetcher<SearchResult>(`/search?q=${encodeURIComponent(query)}`);

// 5. YÊU THÍCH (LIKES)
export const getLikedSongs = () => fetcher<Array<{ song: Song }>>("/likes/my-likes");
export const toggleLikeSong = (songId: string | number) =>
  fetcher<{ liked: boolean }>("/likes/toggle", { method: "POST", body: JSON.stringify({ songId }) });

// 6. THỂ LOẠI (GENRES)
export const getGenres = () => fetcher<Genre[]>("/genres");

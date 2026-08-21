const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Artist { id: string; name: string; avatar: string; listeners?: number; songs?: Song[] }
export interface Genre { id: string; name: string; image: string; color?: string | null }
export interface Mood { id: string; title: string; color: string; icon: string }
export interface Album { id: string; title: string; coverImage: string; releaseYear?: number | null; artistId: string }
export interface Song { id: number; title: string; audioUrl: string; image: string; lyrics?: Array<{ time: number; text: string }>; playCount?: number; artist: Artist | string; genre?: Genre | string | null; album?: Album | null; mood?: Mood | null }
export interface Playlist { id: string; name: string; coverImage?: string | null; color?: string | null; userId?: string; songs?: Array<{ song: Song }> }
export interface SearchResult { songs: Song[]; artists: Artist[]; playlists: Playlist[] }
export interface CurrentUser { id: string; email: string; name?: string | null; playlists: Playlist[] }
export interface AuthResponse { message: string; token?: string; user?: { id: string; email?: string | null; user_metadata?: { full_name?: string } } }
export interface ApiErrorPayload { code: string; message: string; details?: unknown }

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

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

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const error = payload?.error;
    if (error && typeof error === "object" && typeof error.message === "string") {
      throw new ApiError(res.status, error as ApiErrorPayload);
    }
    throw new ApiError(res.status, {
      code: "API_ERROR",
      message: payload?.error || res.statusText || "API request failed",
    });
  }

  return payload as T;
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
export const login = (email: string, password: string) =>
  fetcher<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const register = (email: string, password: string, name?: string) =>
  fetcher<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(name ? { name } : {}) }),
  });

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
export const recordListening = (songId: string | number) =>
  fetcher(`/songs/${songId}/listen`, { method: "POST" });
export const getListeningHistory = () =>
  fetcher<Array<{ id: string; listenedAt: string; song: Song }>>("/songs/history");

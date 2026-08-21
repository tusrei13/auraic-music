const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
export const getSongs = () => fetcher<any[]>("/songs");
export const getSongById = (id: string | number) => fetcher<any>(`/songs/${id}`);

// 2. PLAYLISTS
export const getPlaylists = () => fetcher<any[]>("/playlists");
export const getPlaylistById = (id: string) => fetcher<any>(`/playlists/${id}`);

// 3. NGHỆ SĨ (ARTISTS)
export const getArtists = () => fetcher<any[]>("/artists");
export const getArtistById = (id: string) => fetcher<any>(`/artists/${id}`);

// 4. TÌM KIẾM (SEARCH)
export const searchAll = (query: string) => fetcher<any>(`/search?q=${encodeURIComponent(query)}`);

// 5. YÊU THÍCH (LIKES)
export const getLikedSongs = () => fetcher<any[]>("/likes");
export const toggleLikeSong = (songId: string | number) =>
  fetcher<any>(`/likes/${songId}`, { method: "POST" });

// 6. THỂ LOẠI (GENRES)
export const getGenres = () => fetcher<any[]>("/genres");
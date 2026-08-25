import { catalogResponseContract, searchResponseContract } from './contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const resolveMediaUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  const apiUrl = new URL(API_BASE_URL, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  return new URL(url, `${apiUrl.origin}/`).toString();
};

export const isJamendoTrackId = (id: string | number) => String(id).startsWith("jamendo:");

export const formatDuration = (duration?: number | string | null) => {
  if (typeof duration === "string") return duration;
  if (duration === undefined || duration === null || duration < 0) return "--:--";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export interface Artist { id: string; name: string; avatar: string; listeners?: number; songs?: Song[] }
export interface Genre { id: string; name: string; image: string; color?: string | null }
export interface Mood { id: string; title: string; color: string; icon: string }
export interface MoodMix { id: string; title: string; description: string; tags: string; color: string; gradient: string; icon: string }
export interface Album { id: string; title: string; coverImage: string; releaseYear?: number | null; artistId: string }
export interface Song { id: string | number; title: string; audioUrl: string; image: string; duration?: number | null; hlsUrl?: string | null; lyrics?: string | Array<{ time: number; text: string }>; playCount?: number; artist: Artist | string; genre?: Genre | string | null; genres?: string[]; album?: Album | null; mood?: Mood | null; source?: string; licenseUrl?: string }
export interface Playlist { id: string; name: string; coverImage?: string | null; color?: string | null; userId?: string; songs?: Array<{ song: Song }> }
export interface SearchResult { songs: Song[]; artists: Artist[]; albums: Album[]; pagination?: { nextCursor: string | null } }
export interface JamendoSong {
  id: string;
  title: string;
  audioUrl: string;
  image: string;
  duration: number;
  artist: { id: string; name: string; avatar: string };
  album: { id: string; title: string; coverImage: string; artistId: string } | null;
  source: "jamendo";
  licenseUrl?: string;
  genres: string[];
}
export interface CurrentUser { id: string; email: string; name?: string | null; avatar?: string | null; createdAt?: string; role: "USER" | "ADMIN"; playlists: Playlist[] }
export interface AuthResponse { message: string; token?: string; user?: { id: string; email?: string | null; user_metadata?: { full_name?: string } } }
export interface ApiErrorPayload { code: string; message: string; requestId?: string; details?: unknown }
export interface LyricsResponse { syncedLyrics: string | null; plainLyrics: string | null }
export interface AdminOverview { role: "ADMIN"; metrics: { users: number; playlists: number; songs: number; likes: number } }
export interface AdminUser { id: string; email: string; name?: string | null; role: "USER" | "ADMIN"; createdAt: string; _count: { playlists: number; likes: number; histories: number } }
export interface AdminUsersResponse { users: AdminUser[] }
export interface AdminUserRoleResponse { user: Pick<AdminUser, "id" | "email" | "name" | "role"> }
export interface AdminSong { id: string; title: string; image: string; duration?: number | null; playCount: number; lyrics?: unknown; createdAt?: string | null; artist: { name: string }; genre?: { name: string } | null }
export interface AdminSongsResponse { songs: AdminSong[] }
export interface AdminPlaylist { id: string; name: string; createdAt: string; updatedAt: string; user: { name?: string | null; email: string }; _count: { songs: number } }
export interface AdminPlaylistsResponse { playlists: AdminPlaylist[] }
export interface AdminTopSong { trackId: string; title: string; artistName: string; image: string; plays: number }
export interface AdminTopSongsResponse { songs: AdminTopSong[] }
export interface AdminAnalytics { periodDays: number; totals: { started: number; completed: number; skipped: number }; daily: Array<{ date: string; started: number; completed: number; skipped: number }>; topTracks: Array<{ trackId: string; title: string; plays: number }>; quality: { invalidTitle: number; invalidTiming: number; unknownSource: number; duplicateStarted: number; totalIssues: number } }
export interface AdminArtist { id: string; name: string; avatar: string; trackCount: number; albumCount: number }
export interface AdminArtistsResponse { artists: AdminArtist[] }
export interface IngestionJob { id: string; status: "RUNNING" | "SUCCEEDED" | "FAILED"; startedAt: string; finishedAt?: string | null; imported: number; updated: number; failed: number; errorMessage?: string | null }

// Phase 3 Intelligence Interfaces
export interface SemanticSearchResultItem extends JamendoSong {
  semanticScore: number;
  matchedReason?: string;
}
export interface SemanticSearchResponse {
  query: string;
  intentTags: string[];
  totalResults: number;
  results: SemanticSearchResultItem[];
  isFallback: boolean;
}
export interface RecommendationExplanation {
  reason: string;
  confidence: number;
  basis: 'likes' | 'history' | 'time_of_day' | 'trending' | 'genre_affinity';
}
export interface RecommendedTrackItem extends JamendoSong {
  explanation: RecommendationExplanation;
  score: number;
}
export interface PersonalizedRecommendationsResponse {
  recommendations: RecommendedTrackItem[];
  context: string;
  metrics: { diversityScore: number; count: number };
}
export interface UserListeningInsights {
  periodDays: number;
  metrics: {
    started: number;
    completed: number;
    skipped: number;
    completionRate: number;
  };
  topTracks: Array<{ trackId: string; title: string; plays: number }>;
}

export const getIngestionStatus = () => fetcher<{ configured: boolean; running: number; latest: IngestionJob | null }>("/admin/ingestion/status");
export const runIngestion = () => fetcher<{ job: IngestionJob }>("/admin/ingestion/run", { method: "POST" });
export const getSystemSettings = () => fetcher<{ settings: Record<string, string> }>("/admin/settings");
export const updateSystemSettings = (settings: Record<string, string>) => fetcher<{ settings: Record<string, string> }>("/admin/settings", { method: "PUT", body: JSON.stringify(settings) });

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
export const getSongs = () => getJamendoTracks({ limit: 48 });
export const getSongById = (id: string | number) => fetcher<Song>(`/songs/${id}`);

// 2. PLAYLISTS
export const getPlaylists = () => fetcher<Playlist[]>("/playlists");
export const getPlaylistById = (id: string) => fetcher<Playlist>(`/playlists/${id}`);
export const createPlaylist = (data: { name: string; coverImage?: string; color?: string }) =>
  fetcher<Playlist>('/playlists', { method: 'POST', body: JSON.stringify(data) });
export const addSongToPlaylist = (playlistId: string, songId: string | number, trackData?: any) =>
  fetcher(`/playlists/${encodeURIComponent(playlistId)}/songs`, {
    method: 'POST',
    body: JSON.stringify({
      songId,
      trackId: songId,
      title: trackData?.title,
      artistName: typeof trackData?.artist === 'string' ? trackData.artist : trackData?.artist?.name || trackData?.artistName,
      image: trackData?.image,
      audioUrl: trackData?.audioUrl,
      duration: trackData?.duration,
    }),
  });
export const removeSongFromPlaylist = (playlistId: string, songId: string | number) =>
  fetcher(`/playlists/${encodeURIComponent(playlistId)}/songs/${songId}`, { method: 'DELETE' });
export const reorderPlaylistSongs = (playlistId: string, trackIds: Array<string | number>) =>
  fetcher<{ message: string }>(`/playlists/${encodeURIComponent(playlistId)}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ trackIds }),
  });
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

// 4. TÌM KIẾM (SEARCH & SEMANTIC SEARCH)
export const searchAll = (query: string) => fetcher<unknown>(`/search?q=${encodeURIComponent(query)}`).then((payload) => searchResponseContract.parse(payload) as SearchResult);
export const searchSemantic = (query: string, options: { limit?: number; offset?: number } = {}) =>
  fetcher<SemanticSearchResponse>(`/search/semantic?q=${encodeURIComponent(query)}&limit=${options.limit || 24}&offset=${options.offset || 0}`);

export interface CatalogPage { tracks: JamendoSong[]; nextCursor: string | null }
export const getJamendoTracksPage = async (options: { limit?: number; cursor?: string; tags?: string; search?: string; artistId?: string; artistName?: string; albumId?: string; order?: string } = {}): Promise<CatalogPage> => {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.tags) params.set("tags", options.tags);
  if (options.search) params.set("search", options.search);
  if (options.artistId) params.set("artistId", options.artistId);
  if (options.artistName) params.set("artistName", options.artistName);
  if (options.albumId) params.set("albumId", options.albumId);
  if (options.order) params.set("order", options.order);
  const response = await fetch(`${API_BASE_URL}/catalog/jamendo${params.size ? `?${params}` : ""}`, { cache: "no-store", headers: { ...(typeof window !== "undefined" && localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}) } });
  const payload = await response.json().catch(() => []);
  if (!response.ok) throw new ApiError(response.status, payload?.error || { code: "API_ERROR", message: response.statusText });
  return { tracks: catalogResponseContract.parse(payload) as JamendoSong[], nextCursor: response.headers.get("x-next-cursor") };
};
export const getJamendoTracks = (options: { limit?: number; offset?: number; cursor?: string; tags?: string; search?: string; artistId?: string; artistName?: string; albumId?: string; order?: string } = {}) => getJamendoTracksPage({ ...options, cursor: options.cursor || (options.offset ? btoa(String(options.offset)) : undefined) }).then((page) => page.tracks);

export const getLyrics = (trackName: string, artistName: string) =>
  fetcher<LyricsResponse>(`/lyrics?trackName=${encodeURIComponent(trackName)}&artistName=${encodeURIComponent(artistName)}`);

// 5. MOOD MIXES & SMART PLAYLISTS
export const getMoods = () => fetcher<{ data: MoodMix[] }>('/moods');
export const getMoodTracks = (moodId: string, options: { limit?: number; offset?: number } = {}) =>
  fetcher<{ mood: MoodMix; tracks: JamendoSong[] }>(`/moods/${encodeURIComponent(moodId)}?limit=${options.limit || 24}&offset=${options.offset || 0}`);

// 6. PERSONALIZED RECOMMENDATIONS (EXPLAINABLE AI)
export const getPersonalizedRecommendations = (options: { limit?: number } = {}) =>
  fetcher<PersonalizedRecommendationsResponse>(`/recommendations/personalized?limit=${options.limit || 20}`);

// 7. YÊU THÍCH (LIKES)
export const getLikedSongs = () => fetcher<Array<{ song: Song }>>("/likes/my-likes");
export type LikeTrackMetadata = Pick<Song, "title" | "image" | "audioUrl" | "licenseUrl"> & { artist: string | { id?: string; name: string; avatar?: string }; duration?: number | string | null };
export const toggleLikeSong = (songId: string | number, track?: LikeTrackMetadata) =>
  fetcher<{ liked: boolean }>("/likes/toggle", { method: "POST", body: JSON.stringify({
    songId,
    ...(isJamendoTrackId(songId) && track ? {
      title: track.title,
      artistName: typeof track.artist === "string" ? track.artist : track.artist?.name,
      image: track.image,
      audioUrl: track.audioUrl,
      duration: track.duration,
      licenseUrl: track.licenseUrl,
    } : {}),
  }) });

// 8. THỂ LOẠI & LISTENING HISTORY
export const getGenres = () => fetcher<Genre[]>("/genres");
export const recordListening = (songId: string | number) =>
  fetcher<{ id: string; listenedAt: string }>(`/songs/${songId}/listen`, { method: "POST" });
export const getListeningHistory = () =>
  fetcher<Array<{ id: string; listenedAt: string; song: Song }>>("/songs/history");
export const recordJamendoListening = (data: { trackId: string; title: string; artistName: string; image: string; audioUrl: string; duration?: number | null }) =>
  fetcher("/songs/jamendo-listen", { method: "POST", body: JSON.stringify(data) });

// 9. ANALYTICS & EVENT PIPELINE
export const recordAnalyticsEvent = (data: { eventType: "TRACK_STARTED" | "TRACK_COMPLETED" | "TRACK_SKIPPED"; trackId: string | number; source?: string; title: string; position?: number; duration?: number }) =>
  fetcher<{ id: string; eventType: string; occurredAt: string }>("/analytics/events", { method: "POST", body: JSON.stringify({ ...data, trackId: String(data.trackId) }) });

export const sendAnalyticsEventsBatch = (events: Array<{ eventType: "TRACK_STARTED" | "TRACK_COMPLETED" | "TRACK_SKIPPED"; trackId: string | number; source?: string; title: string; position?: number; duration?: number }>) =>
  fetcher<{ status: string; accepted: number; duplicate: number }>("/analytics/events", { method: "POST", body: JSON.stringify({ events }) });

export const getMyListeningInsights = (days = 14) =>
  fetcher<UserListeningInsights>(`/analytics/insights?days=${days}`);

// 10. ADMIN & SYSTEM
export const getAdminOverview = () => fetcher<AdminOverview>("/admin/overview");
export const getAdminUsers = () => fetcher<AdminUsersResponse>("/admin/users");
export const updateAdminUserRole = (userId: string, role: "USER" | "ADMIN") => fetcher<AdminUserRoleResponse>(`/admin/users/${encodeURIComponent(userId)}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
export const getAdminSongs = () => fetcher<AdminSongsResponse>("/admin/songs");
export const getAdminPlaylists = () => fetcher<AdminPlaylistsResponse>("/admin/playlists");
export const deleteAdminPlaylist = (playlistId: string) => fetcher<{ message: string; playlistId: string }>(`/admin/playlists/${encodeURIComponent(playlistId)}`, { method: "DELETE" });
export const getAdminTopJamendo = () => fetcher<AdminTopSongsResponse>("/admin/top-jamendo");
export const getAdminAnalytics = () => fetcher<AdminAnalytics>("/admin/analytics");
export const getAdminArtists = () => fetcher<AdminArtistsResponse>("/admin/artists");
export const updateUserProfile = (name?: string, avatar?: string) => fetcher<{ message: string; user: CurrentUser }>("/auth/profile", { method: "PATCH", body: JSON.stringify({ ...(name ? { name } : {}), ...(avatar ? { avatar } : {}) }) });

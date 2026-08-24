"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Heart,
  Library,
  Loader2,
  Lock,
  Play,
  ShieldCheck,
  User as UserIcon,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlaylistStore, Playlist as StorePlaylist } from "@/store/usePlaylistStore";
import { usePlayerStore, Track as StoreTrack } from "@/store/usePlayerStore";
import { updateUserProfile, getLikedSongs, getListeningHistory, type Song } from "@/lib/api";

const getArtistName = (artist: any): string => {
  if (!artist) return "Ca sĩ chưa xác định";
  if (typeof artist === "object") {
    return artist.name || artist.title || "Ca sĩ chưa xác định";
  }
  return String(artist);
};

export default function ProfilePage() {
  const { user, status, initialize } = useAuthStore();
  const { playlists, hydrate } = usePlaylistStore();
  const { playTrack } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<"playlists" | "likes" | "history">("playlists");
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [historySongs, setHistorySongs] = useState<Array<{ id: string; listenedAt: string; song: Song }>>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    if (status === "idle") void initialize();
  }, [initialize, status]);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      void hydrate();
      setIsLoadingContent(true);
      Promise.all([
        getLikedSongs().catch(() => []),
        getListeningHistory().catch(() => []),
      ])
        .then(([likesRes, historyRes]) => {
          setLikedSongs(likesRes.map((item) => item.song).filter(Boolean));
          setHistorySongs(historyRes as Array<{ id: string; listenedAt: string; song: Song }>);
        })
        .finally(() => setIsLoadingContent(false));
    }
  }, [hydrate, user]);

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) return;
    setIsSaving(true);
    setUpdateMessage(null);
    try {
      const res = await updateUserProfile(nameInput.trim());
      useAuthStore.setState({ user: res.user });
      setUpdateMessage("Đã cập nhật tên hiển thị thành công!");
      setIsEditing(false);
    } catch {
      setUpdateMessage("Không thể cập nhật tên. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  const playSongList = (songs: any[], startIndex = 0) => {
    if (songs.length > 0 && songs[startIndex]) {
      playTrack(songs[startIndex] as StoreTrack, songs as StoreTrack[], "Trang cá nhân");
    }
  };

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-white/70">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-cyan-300">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-white">Yêu cầu đăng nhập</h1>
        <p className="max-w-md text-sm text-white/60">Bạn cần đăng nhập để xem thông tin trang cá nhân và lịch sử âm nhạc.</p>
        <Link href="/login" className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
    : "Chưa xác định";

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.1),transparent_35%)] px-5 py-8 text-white sm:px-8">
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Trang chủ
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20">
            <ShieldCheck className="h-4 w-4" /> Bảng quản trị (Admin)
          </Link>
        )}
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-purple-500/20 sm:h-28 sm:w-28">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || user.email} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-12 w-12 text-white/90 sm:h-14 sm:w-14" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${user.role === "ADMIN" ? "bg-amber-400/15 text-amber-300 border border-amber-300/30" : "bg-cyan-400/15 text-cyan-300 border border-cyan-300/30"}`}>
                {user.role === "ADMIN" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                {user.role}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/45">
                <Calendar className="h-3.5 w-3.5" /> Thành viên từ {memberSince}
              </span>
            </div>

            {/* Name Header or Edit Form */}
            {isEditing ? (
              <div className="mt-3 flex max-w-md items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nhập tên mới..."
                  className="min-h-11 flex-1 rounded-xl border border-cyan-400/50 bg-black/40 px-3.5 text-lg font-bold text-white outline-none focus:border-cyan-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  disabled={isSaving}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 disabled:opacity-50"
                  title="Lưu"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  title="Hủy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <h1 className="truncate text-2xl font-black sm:text-4xl">{user.name || "Chưa đặt tên"}</h1>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  title="Chỉnh sửa tên"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}

            <p className="mt-1 truncate text-sm text-white/55">{user.email}</p>

            {updateMessage && (
              <p className="mt-2 text-xs font-semibold text-emerald-300">{updateMessage}</p>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center">
            <Library className="mx-auto h-5 w-5 text-fuchsia-400" />
            <p className="mt-2 text-2xl font-black tabular-nums">{playlists.length}</p>
            <p className="text-xs text-white/45">Playlist đã tạo</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center">
            <Heart className="mx-auto h-5 w-5 text-rose-400" />
            <p className="mt-2 text-2xl font-black tabular-nums">{likedSongs.length}</p>
            <p className="text-xs text-white/45">Bài hát yêu thích</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-cyan-400" />
            <p className="mt-2 text-2xl font-black tabular-nums">{historySongs.length}</p>
            <p className="text-xs text-white/45">Bài đã nghe gần đây</p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="mt-8">
        <div className="flex border-b border-white/10 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("playlists")}
            className={`pb-3 text-sm font-bold transition ${activeTab === "playlists" ? "border-b-2 border-cyan-400 text-cyan-300" : "text-white/50 hover:text-white"}`}
          >
            Playlist của tôi ({playlists.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("likes")}
            className={`pb-3 text-sm font-bold transition ${activeTab === "likes" ? "border-b-2 border-rose-400 text-rose-300" : "text-white/50 hover:text-white"}`}
          >
            Yêu thích ({likedSongs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-sm font-bold transition ${activeTab === "history" ? "border-b-2 border-fuchsia-400 text-fuchsia-300" : "text-white/50 hover:text-white"}`}
          >
            Đã nghe ({historySongs.length})
          </button>
        </div>

        <div className="mt-6">
          {isLoadingContent ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-400" />
              <p className="mt-2 text-xs text-white/50">Đang tải danh sách...</p>
            </div>
          ) : activeTab === "playlists" ? (
            <div>
              {playlists.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                  <Library className="mx-auto h-8 w-8 text-white/30" />
                  <p className="mt-3 text-sm text-white/50">Bạn chưa tạo playlist nào.</p>
                  <Link href="/library" className="mt-4 inline-block rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20">
                    Đến Thư viện tạo Playlist
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {playlists.map((pl: StorePlaylist) => (
                    <Link
                      key={pl.id}
                      href="/library"
                      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-400/40 hover:bg-white/[0.08]"
                    >
                      <div className="flex h-36 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/40 shadow-inner">
                        {pl.coverImage ? (
                          <img src={pl.coverImage} alt={pl.title} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          <Library className="h-10 w-10 text-white/70 group-hover:scale-110 transition duration-300" />
                        )}
                      </div>
                      <h3 className="mt-3 truncate font-bold text-white">{pl.title}</h3>
                      <p className="mt-1 text-xs text-white/45">{pl.tracks?.length || 0} bài hát</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "likes" ? (
            <div>
              {likedSongs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                  <Heart className="mx-auto h-8 w-8 text-white/30" />
                  <p className="mt-3 text-sm text-white/50">Bạn chưa thả tim bài hát nào.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {likedSongs.map((song, index) => (
                    <div
                      key={song.id}
                      className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.07]"
                    >
                      <span className="w-6 text-center text-xs font-bold text-white/40">{index + 1}</span>
                      <img src={song.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{song.title}</p>
                        <p className="truncate text-xs text-white/45">{getArtistName(song.artist)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => playSongList(likedSongs, index)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400 text-slate-950 opacity-0 transition group-hover:opacity-100 hover:scale-105"
                        title="Phát bài này"
                      >
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {historySongs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                  <Clock className="mx-auto h-8 w-8 text-white/30" />
                  <p className="mt-3 text-sm text-white/50">Chưa có lịch sử nghe nhạc gần đây.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historySongs.map((item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.07]"
                    >
                      <span className="w-6 text-center text-xs font-bold text-white/40">{index + 1}</span>
                      <img src={item.song?.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{item.song?.title}</p>
                        <p className="truncate text-xs text-white/45">{getArtistName(item.song?.artist)}</p>
                      </div>
                      <span className="text-xs text-white/35">
                        {new Date(item.listenedAt).toLocaleDateString("vi-VN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => playSongList(historySongs.map((h) => h.song).filter(Boolean), index)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-400 text-slate-950 opacity-0 transition group-hover:opacity-100 hover:scale-105"
                        title="Phát lại"
                      >
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

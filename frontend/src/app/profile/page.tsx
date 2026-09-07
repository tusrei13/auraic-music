"use client";

import Artwork from "@/components/Artwork";

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
  Zap,
  Activity,
  Music2,
  Compass,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import TiltCard from "@/components/ui/TiltCard";
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
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "idle") void initialize();
  }, [initialize, status]);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      void hydrate();
      setIsLoadingContent(true);
      setContentError(null);
      Promise.allSettled([getLikedSongs(), getListeningHistory()])
        .then(([likesResult, historyResult]) => {
          if (likesResult.status === "fulfilled") {
            setLikedSongs(likesResult.value.map((item) => item.song).filter(Boolean));
          } else {
            setLikedSongs([]);
            setContentError("Không thể tải danh sách yêu thích. Vui lòng thử lại sau.");
          }
          if (historyResult.status === "fulfilled") {
            setHistorySongs(historyResult.value as Array<{ id: string; listenedAt: string; song: Song }>);
          }
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
    <div className="min-h-full px-4 pb-36 pt-6 text-white sm:px-7 lg:px-10 space-y-7">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white/60 transition hover:text-cyan-300">
          <ArrowLeft className="h-4 w-4" /> Trang chủ
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 backdrop-blur-xl transition hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <ShieldCheck className="h-4 w-4" /> Bảng quản trị (Admin Portal)
          </Link>
        )}
      </div>

      {/* 2-Column Spatial Hero Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Holographic 3D Audiophile Persona Card */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-[32px] border border-white/18 bg-gradient-to-br from-violet-950/40 via-purple-950/25 to-slate-950/70 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.22)] flex flex-col justify-between space-y-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[100px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with Concentric Audio Aura Rings */}
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-cyan-500 via-violet-500 to-fuchsia-500 opacity-60 blur-lg animate-pulse" />
              <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-tr from-cyan-600 to-purple-600 shadow-2xl">
                {user.avatar ? (
                  <Artwork src={user.avatar} alt={user.name || user.email} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-12 w-12 text-white/90 sm:h-14 sm:w-14" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${user.role === "ADMIN" ? "bg-amber-400/15 text-amber-300 border border-amber-300/30" : "bg-cyan-400/15 text-cyan-300 border border-cyan-300/30"}`}>
                  {user.role === "ADMIN" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {user.role} TIER
                </span>
                <span className="flex items-center gap-1 text-xs text-white/45 font-mono">
                  <Calendar className="h-3.5 w-3.5" /> Từ {memberSince}
                </span>
              </div>

              {/* Editable Name */}
              {isEditing ? (
                <div className="flex max-w-md items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nhập tên mới..."
                    className="min-h-11 flex-1 rounded-2xl border border-cyan-400/50 bg-black/60 px-4 text-base font-bold text-white outline-none focus:border-cyan-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    disabled={isSaving}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 disabled:opacity-50 transition"
                    title="Lưu"
                  >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition"
                    title="Hủy"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h1 className="truncate text-2xl sm:text-4xl font-black text-white tracking-tight">{user.name || "Chưa đặt tên"}</h1>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Chỉnh sửa tên"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <p className="truncate text-sm text-white/55 font-mono">{user.email}</p>

              {updateMessage && (
                <p className="text-xs font-semibold text-emerald-300 animate-pulse">{updateMessage}</p>
              )}
            </div>
          </div>

          {/* Quick Stats Grid with High-Contrast Frosted Glass */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center shadow-lg hover:border-fuchsia-400/40 transition">
              <Library className="mx-auto h-5 w-5 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
              <p className="mt-2 text-2xl font-black tabular-nums text-white">{playlists.length}</p>
              <p className="text-[11px] font-semibold text-white/50">Playlist đã tạo</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center shadow-lg hover:border-rose-400/40 transition">
              <Heart className="mx-auto h-5 w-5 text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
              <p className="mt-2 text-2xl font-black tabular-nums text-white">{likedSongs.length}</p>
              <p className="text-[11px] font-semibold text-white/50">Bài hát yêu thích</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center shadow-lg hover:border-cyan-400/40 transition">
              <Clock className="mx-auto h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <p className="mt-2 text-2xl font-black tabular-nums text-white">{historySongs.length}</p>
              <p className="text-[11px] font-semibold text-white/50">Bài đã nghe</p>
            </div>
          </div>
        </div>

        {/* Right: Audio DNA & Sonic Archetype */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-[32px] border border-white/18 bg-gradient-to-br from-slate-900/60 via-purple-950/30 to-black/80 p-6 sm:p-7 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.22)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-300">
              <Activity className="h-4 w-4" /> Sonic Persona & DNA
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
              Hi-Res Certified
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl sm:text-2xl font-black text-white">Cosmic Voyager</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Gu âm nhạc của bạn mang âm hưởng không gian mở, tập trung vào synth điện tử, âm trường sâu và dải tần chi tiết.
            </p>
          </div>

          {/* Vibe Tags & Mini Meters */}
          <div className="space-y-2.5 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/70">
                <span>Không gian âm trường (Spatial Reverb)</span>
                <span className="font-mono text-cyan-300 font-bold">88%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/70">
                <span>Thời gian nghe tập trung nhất</span>
                <span className="font-mono text-fuchsia-300 font-bold">Đêm muộn (22:00 - 02:00)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/8">
            {["#Synthwave", "#AmbientLoFi", "#Lossless24bit", "#DeepFocus"].map((tag) => (
              <span key={tag} className="text-[11px] font-mono font-semibold text-white/60 bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs & Content Section */}
      <section className="space-y-6">
        {/* Glass Pill Tab Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/12 backdrop-blur-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("playlists")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "playlists"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/30"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Library className="h-4 w-4" />
            Playlist của tôi ({playlists.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("likes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "likes"
                ? "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400/30"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Heart className="h-4 w-4" />
            Yêu thích ({likedSongs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-violet-400/30"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Clock className="h-4 w-4" />
            Đã nghe ({historySongs.length})
          </button>
        </div>

        {contentError && (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {contentError}
          </div>
        )}

        {isLoadingContent ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
            <p className="mt-3 text-xs font-mono text-white/50">Đang tải dữ liệu hồ sơ...</p>
          </div>
        ) : activeTab === "playlists" ? (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* "+ Tạo Playlist Mới" 3D Glass Action Card */}
              <Link
                href="/library"
                className="group flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition hover:border-cyan-400/60 hover:bg-cyan-500/[0.04] backdrop-blur-2xl shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 group-hover:scale-110 transition duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Plus className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-bold text-white text-base">Tạo Playlist mới</h3>
                <p className="mt-1 text-xs text-white/45">Tự do mix các bài hát không gian theo gu của bạn</p>
              </Link>

              {/* User Playlists */}
              {playlists.map((pl: StorePlaylist) => (
                <TiltCard key={pl.id} depthZ={12} className="h-full">
                  <Link
                    href="/library"
                    className="group block h-full rounded-[28px] border border-white/15 bg-white/[0.035] p-5 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/50 via-purple-900/40 to-black/60 shadow-inner">
                      {pl.coverImage ? (
                        <Artwork src={pl.coverImage} alt={pl.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Library className="h-12 w-12 text-white/50 group-hover:scale-110 transition duration-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h3 className="mt-4 truncate font-bold text-base text-white group-hover:text-cyan-300 transition">{pl.title}</h3>
                    <p className="mt-1 text-xs text-white/50 font-mono">{pl.tracks?.length || 0} bài hát</p>
                  </Link>
                </TiltCard>
              ))}
            </div>

            {/* Curated Recommendations to fill the screen gracefully */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" /> Tuyển Tập Gợi Ý Cho Bạn
                  </h3>
                  <p className="text-xs text-white/50">Dành riêng cho phong cách nghe của {user.name || "bạn"}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Cosmic Neon Odyssey", desc: "Synthwave & Retrowave 80s", cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop", tracks: 24 },
                  { title: "Deep Midnight Echoes", desc: "Ambient Chillout & Rain", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop", tracks: 18 },
                  { title: "Acoustic Warmth Hall", desc: "Indie Folk & Warm Strings", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop", tracks: 32 },
                  { title: "Cybernetic Beats 3D", desc: "Binaural Electronic Pulse", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop", tracks: 20 },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href="/stations"
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl hover:border-violet-400/40 hover:bg-white/[0.06] transition flex items-center gap-4"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Artwork src={item.cover} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-white group-hover:text-cyan-300 transition">{item.title}</h4>
                      <p className="truncate text-xs text-white/50">{item.desc}</p>
                      <span className="text-[10px] font-mono text-cyan-400/80 mt-1 block">{item.tracks} bài hát</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "likes" ? (
          <div>
            {likedSongs.length === 0 ? (
              <div className="rounded-[28px] border border-white/12 bg-white/[0.02] p-12 text-center backdrop-blur-2xl">
                <Heart className="mx-auto h-12 w-12 text-white/30" />
                <p className="mt-4 text-base font-bold text-white">Bạn chưa thả tim bài hát nào.</p>
                <p className="mt-1 text-xs text-white/50">Khám phá các trạm âm thanh và nhấn icon trái tim để lưu bài hát yêu thích.</p>
                <Link href="/" className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:scale-105">
                  Khám phá bài hát ngay
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {likedSongs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => playSongList(likedSongs, index)}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl transition hover:border-rose-400/40 hover:bg-white/[0.07] cursor-pointer"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Artwork src={song.image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white group-hover:text-rose-300 transition">{song.title}</p>
                      <p className="truncate text-xs text-white/50">{getArtistName(song.artist)}</p>
                    </div>
                    <Heart className="h-4 w-4 fill-rose-500 text-rose-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {historySongs.length === 0 ? (
              <div className="rounded-[28px] border border-white/12 bg-white/[0.02] p-12 text-center backdrop-blur-2xl">
                <Clock className="mx-auto h-12 w-12 text-white/30" />
                <p className="mt-4 text-base font-bold text-white">Chưa có lịch sử nghe nhạc gần đây.</p>
                <Link href="/stations" className="mt-5 inline-block rounded-2xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-cyan-300">
                  Thưởng thức các Station âm thanh
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {historySongs.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => playSongList(historySongs.map((h) => h.song).filter(Boolean), index)}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl transition hover:border-cyan-400/40 hover:bg-white/[0.07] cursor-pointer"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Artwork src={item.song?.image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white group-hover:text-cyan-300 transition">{item.song?.title}</p>
                      <p className="truncate text-xs text-white/50">{getArtistName(item.song?.artist)}</p>
                    </div>
                    <span className="text-[11px] font-mono text-white/40">
                      {new Date(item.listenedAt).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

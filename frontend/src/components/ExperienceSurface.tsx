"use client";

import Artwork from "@/components/Artwork";
import { useEffect, useState } from "react";
import {
  Check,
  Clipboard,
  Heart,
  Music2,
  Play,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Shield,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getPrivacySettings, savePrivacySettings, type PrivacySettings } from "@/lib/api";

const fallbackTrack = {
  id: "",
  title: "Chưa có bài hát đang phát",
  artist: "Chọn một bài từ Auraic",
  image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1000&auto=format&fit=crop",
  audioUrl: "",
  duration: 0,
};

type ExperienceKind = "now-playing" | "track-info" | "download" | "credits" | "settings";

function GlossyToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full p-0.5 transition-all duration-300 shadow-inner cursor-pointer ${
        checked
          ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 shadow-[0_0_18px_rgba(168,85,247,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-fuchsia-300/40"
          : "bg-black/50 border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-gradient-to-b from-white via-neutral-100 to-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-300 ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function ExperienceSurface({ kind }: { kind: ExperienceKind }) {
  const { currentTrack, isPlaying, togglePlay, likedIds, toggleLike } = usePlayerStore();
  const { user } = useAuthStore();
  const [quality, setQualityState] = useState("Lossless (24-bit / 96kHz)");
  const [copied, setCopied] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    privateHistory: true,
    hideFromCharts: false,
    allowAnalytics: true,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(`auraic-settings-${user?.id || "guest"}`);
    if (stored) setQualityState(stored);
  }, [user?.id]);

  const setQuality = (value: string) => {
    setQualityState(value);
    window.localStorage.setItem(`auraic-settings-${user?.id || "guest"}`, value);
  };

  useEffect(() => {
    setPrivacy(getPrivacySettings(user?.id || "guest"));
  }, [user?.id]);

  const updatePrivacy = (patch: Partial<PrivacySettings>) => {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    savePrivacySettings(user?.id || "guest", next);
  };

  const track = currentTrack || fallbackTrack;
  const artist = typeof track.artist === "string" ? track.artist : track.artist.name;
  const liked = likedIds.some((id) => String(id) === String(track.id));
  const attribution = `"${track.title}" by ${artist}. Source and usage terms are available from the original track page.`;

  const copyCredit = async () => {
    await navigator.clipboard.writeText(attribution);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (kind === "settings") {
    return (
      <div className="min-h-full px-4 pb-36 pt-6 text-white sm:px-7 lg:px-10 space-y-7">
        {/* Top Hero Spatial Bento: 2-Column Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Hero Left: System Preferences & Audio Engine Status */}
          <header className="lg:col-span-7 relative overflow-hidden rounded-[32px] border border-white/18 bg-gradient-to-br from-violet-950/40 via-slate-900/40 to-slate-950/70 p-6 sm:p-8  shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-violet-500/25 blur-[90px]" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-mono font-bold tracking-wider text-cyan-300">
                <Settings2 className="h-3.5 w-3.5" /> AURAIC SPATIAL STUDIO V2.4
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_15px_rgba(255,255,255,0.1)]">
                Cài Đặt & Không Gian Âm Thanh
              </h1>
              <p className="max-w-xl text-sm text-white/65 leading-relaxed">
                Tùy biến môi trường âm thanh 3D, độ phân giải giải mã Hi-Res DAC và hệ thống bảo mật không gian thưởng thức cá nhân.
              </p>
            </div>

            {/* Engine Quick Metrics Pill Row */}
            <div className="relative z-10 grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Audio Engine</p>
                <p className="mt-1 text-base font-black text-white">Web Audio 3D</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-400">Stream DAC</p>
                <p className="mt-1 text-base font-black text-white">24-bit / 96kHz</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Buffer Latency</p>
                <p className="mt-1 text-base font-black text-emerald-300">&lt; 12ms (Ultra)</p>
              </div>
            </div>
          </header>

          {/* Hero Right: Live Interactive Audio Acoustics Monitor */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-[32px] border border-white/18 bg-gradient-to-br from-slate-900/60 via-purple-950/30 to-black/80 p-6 sm:p-7  shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">Spatial Visualizer Live</span>
              </div>
              <span className="text-[10px] font-mono text-white/50">HRTF Binaural Engine</span>
            </div>

            {/* Live Visualizer Bars Simulation */}
            <div className="my-6 flex items-end justify-between gap-1.5 h-24 px-2 py-3 rounded-2xl bg-black/40 border border-white/8 shadow-inner">
              {[65, 42, 88, 70, 95, 52, 78, 60, 85, 45, 92, 68, 80, 55, 90, 75].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-gradient-to-t from-cyan-500 via-violet-500 to-fuchsia-400 transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    opacity: 0.7 + (i % 3) * 0.1,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Đang thử nghiệm âm trường 3D</span>
              <span className="font-mono text-cyan-300">48kHz / 32-bit float</span>
            </div>
          </div>
        </div>

        {/* Floating Bento Grid 3-Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Card 1: Giao diện & Không gian (Spatial Appearance) */}
          <div className="rounded-[28px] border border-white/15 bg-white/[0.035] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col justify-between space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 shadow-[0_0_15px_rgba(217,140,255,0.25)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Chế độ hiển thị Không gian</h2>
                <p className="text-xs text-white/50">Hệ thống kính mờ 3D Glassmorphism</p>
              </div>
            </div>

            {/* Theme Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-2xl border border-cyan-400/40 bg-cyan-950/20 p-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span className="text-xs text-white font-bold">Cosmic Glass (Mặc định)</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-bold bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  <Check className="h-3 w-3" /> Đang dùng
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-3 text-white/50 hover:text-white transition">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" />
                  <span className="text-xs font-semibold">Cyberpunk Neon Glass</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">Sắp ra mắt</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/8 flex items-center justify-between text-xs text-white/60">
              <span>Hiệu ứng hạt bụi 3D Canvas:</span>
              <span className="text-emerald-400 font-bold font-mono">BẬT (60 FPS)</span>
            </div>
          </div>

          {/* Card 2: Chất lượng & Độ phân giải DAC (Audio Quality) */}
          <div className="rounded-[28px] border border-white/15 bg-white/[0.035] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col justify-between space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Chất lượng phát âm thanh</h2>
                <p className="text-xs text-white/50">Độ phân giải dải âm thanh DAC / Stream</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-white/70 block">Dải tần giải mã Stream:</label>
              <select
                value={quality}
                onChange={(event) => setQuality(event.target.value)}
                className="w-full rounded-2xl border border-cyan-400/30 bg-slate-900/90 px-4 py-3 text-xs font-semibold text-white shadow-inner outline-none focus:border-cyan-400 cursor-pointer"
                aria-label="Chất lượng phát nhạc"
              >
                <option>Standard (128 kbps AAC)</option>
                <option>High Definition (320 kbps MP3/OGG)</option>
                <option>Lossless (24-bit / 96kHz FLAC)</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/25 p-3.5 space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>Giải thuật tăng cường Spatial:</span>
                <span className="font-mono font-bold text-cyan-300">Convolver Reverb</span>
              </div>
              <div className="flex justify-between text-xs text-white/70">
                <span>Hỗ trợ phần cứng WebGL/Audio:</span>
                <span className="font-mono font-bold text-emerald-400">Đã kích hoạt</span>
              </div>
            </div>
          </div>

          {/* Card 3: Bộ nhớ tạm & Cache (Storage & Engine) */}
          <div className="rounded-[28px] border border-white/15 bg-white/[0.035] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col justify-between space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Bộ nhớ đệm & Lưu trữ</h2>
                <p className="text-xs text-white/50">Quản lý dung lượng đĩa & dữ liệu bài hát</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Dung lượng bộ đệm nhạc:</span>
                <span className="font-mono font-bold text-cyan-300">420 MB / 2.0 GB</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[21%] rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Bộ nhớ đệm âm thanh đã được tối ưu hóa thành công!")}
              className="w-full rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 py-3 text-xs font-bold text-white transition cursor-pointer"
            >
              Tối ưu hóa bộ nhớ tạm (Clear Cache)
            </button>
          </div>

          {/* Card 4: Bảo mật & Dữ liệu Nghe (Privacy - Spanning Full 3 Columns) */}
          <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-white/15 bg-white/[0.035] p-6 sm:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-400/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Bảo Mật & Quyền Riêng Tư (Privacy Vault)</h2>
                <p className="text-xs text-white/50">Kiểm soát cách lưu trữ và chia sẻ lịch sử nghe nhạc không gian</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col justify-between gap-4 p-4 rounded-2xl border border-white/8 bg-black/25">
                <div>
                  <h3 className="text-sm font-bold text-white">Chế độ nghe riêng tư</h3>
                  <p className="text-xs text-white/50 mt-1">Không lưu các lượt nghe gần đây vào danh sách công khai</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] font-mono text-cyan-300">{privacy.privateHistory ? "KÍCH HOẠT" : "TẮT"}</span>
                  <GlossyToggle
                    checked={privacy.privateHistory}
                    onChange={(value) => updatePrivacy({ privateHistory: value })}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 p-4 rounded-2xl border border-white/8 bg-black/25">
                <div>
                  <h3 className="text-sm font-bold text-white">Ẩn khỏi Leaderboard</h3>
                  <p className="text-xs text-white/50 mt-1">Không hiển thị lượt nghe của bạn trên Charts cộng đồng</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] font-mono text-cyan-300">{privacy.hideFromCharts ? "ẨN DANH" : "CÔNG KHAI"}</span>
                  <GlossyToggle
                    checked={privacy.hideFromCharts}
                    onChange={(value) => updatePrivacy({ hideFromCharts: value })}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 p-4 rounded-2xl border border-white/8 bg-black/25">
                <div>
                  <h3 className="text-sm font-bold text-white">AI Gợi ý cá nhân hóa</h3>
                  <p className="text-xs text-white/50 mt-1">Hỗ trợ máy học tạo danh sách phát Daily Mix thông minh</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] font-mono text-cyan-300">{privacy.allowAnalytics ? "CHO PHÉP" : "TỪ CHỐI"}</span>
                  <GlossyToggle
                    checked={privacy.allowAnalytics}
                    onChange={(value) => updatePrivacy({ allowAnalytics: value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Footer Badge */}
        <div className="flex items-center justify-between px-2 text-xs text-white/40 font-mono">
          <span>{user ? `Đã đồng bộ hồ sơ qua tài khoản: ${user.email}` : "Đang sử dụng cấu hình cục bộ (Khách). Đăng nhập để đồng bộ qua Cloud."}</span>
          <span>Auraic Spatial Audio 2026</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-5 pb-36 pt-8 text-white sm:px-8 lg:px-12">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-300">
            <Music2 className="h-4 w-4" /> {kind === "credits" ? "Artist credits" : "Track details"}
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            {kind === "track-info"
              ? "Track & license"
              : kind === "download"
              ? "Use this track"
              : kind === "credits"
              ? "Give credit well"
              : "Track details"}
          </h1>
        </div>
        {currentTrack ? (
          <button
            type="button"
            onClick={() => void toggleLike(track as any)}
            aria-label={liked ? "Bỏ thích" : "Yêu thích"}
            className={`flex h-11 w-11 items-center justify-center rounded-full border cursor-pointer transition ${
              liked ? "border-pink-300/60 text-pink-300 bg-pink-500/10" : "border-white/10 text-white/50 hover:bg-white/5"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          </button>
        ) : null}
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_1.2fr] lg:items-center">
        <div className="relative aspect-square max-w-[440px] overflow-hidden rounded-[32px] border border-white/15 shadow-2xl shadow-fuchsia-950/30">
          <Artwork src={track.image} alt={track.title} className="h-full w-full object-cover" />
          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-white/15 bg-black/60 p-3.5 ">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{track.title}</p>
              <p className="truncate text-xs text-white/50">{artist}</p>
            </div>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg cursor-pointer hover:scale-105 transition"
            >
              {isPlaying ? "||" : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>
          </div>
        </div>

        <div className="max-w-xl space-y-6">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-6 sm:p-7 ">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Usage information</p>
            <h2 className="mt-2 text-xl font-bold">Original source terms</h2>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Review the license before publishing, remixing or using this track commercially. Attribution may be required.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => void copyCredit()}
                className="flex min-h-11 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-neutral-100 cursor-pointer"
              >
                <Clipboard className="h-4 w-4" />
                {copied ? "Copied" : "Copy attribution"}
              </button>
            </div>
          </div>
          <p className="text-sm leading-6 text-white/45">
            {currentTrack ? attribution : "Chọn một bài hát từ Auraic để xem thông tin chi tiết."}
          </p>
        </div>
      </div>
    </div>
  );
}


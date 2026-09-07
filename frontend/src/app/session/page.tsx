"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Radio,
  Sparkles,
  Plus,
  Headphones,
  Flame,
  Music2,
  ArrowRight,
  Disc3,
} from "lucide-react";
import TiltCard from "@/components/ui/TiltCard";

interface PublicSession {
  id: string;
  title: string;
  hostName: string;
  hostAvatar: string;
  listenersCount: number;
  currentTrackTitle: string;
  currentTrackArtist: string;
  coverImage: string;
  tags: string[];
}

const FEATURED_SESSIONS: PublicSession[] = [
  {
    id: "audiophile-lounge",
    title: "Audiophile Lounge • 24bit Hi-Res",
    hostName: "Minh Quân (Host)",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    listenersCount: 42,
    currentTrackTitle: "Ethereal Echoes",
    currentTrackArtist: "Auraic Symphony",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
    tags: ["Audiophile", "FLAC", "Chill"],
  },
  {
    id: "midnight-vibes",
    title: "Midnight Lofi Station",
    hostName: "Hà Linh",
    hostAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
    listenersCount: 28,
    currentTrackTitle: "Tokyo Rainy Night",
    currentTrackArtist: "Lofi Beats Collective",
    coverImage: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop",
    tags: ["Lofi", "Rain", "Study"],
  },
  {
    id: "cyber-synth-pulse",
    title: "Synthwave & Retro Cyberpulse",
    hostName: "Tuấn Anh",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    listenersCount: 65,
    currentTrackTitle: "Neon Highway 1984",
    currentTrackArtist: "Cyber Runner",
    coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop",
    tags: ["Synthwave", "Cyberpunk", "Bass"],
  },
];

export default function SessionLobbyPage() {
  const router = useRouter();
  const [customRoomId, setCustomRoomId] = useState("");

  const handleJoinOrCreate = (roomId: string) => {
    const target = roomId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "main-stage";
    router.push(`/session/${target}`);
  };

  return (
    <div className="min-h-full px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-10">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[36px] border border-white/15 bg-gradient-to-br from-violet-950/40 via-purple-950/20 to-black/60 p-6 sm:p-10 backdrop-blur-3xl shadow-2xl"
      >
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-violet-600/25 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Users className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
            <span>Supabase Realtime Audio Sync</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Phòng Nghe Chung Realtime
          </h1>

          <p className="text-sm text-white/65 leading-relaxed">
            Thưởng thức âm nhạc đồng bộ từng mili-giây cùng bạn bè. Đĩa than quay 3D
            trung tâm hiển thị Avatar người Request, cùng hiệu ứng thả reaction nảy
            theo nhịp điệu.
          </p>

          {/* Quick Create / Join Input */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md">
            <input
              type="text"
              value={customRoomId}
              onChange={(e) => setCustomRoomId(e.target.value)}
              placeholder="Nhập mã phòng hoặc tên phòng..."
              onKeyDown={(e) => e.key === "Enter" && handleJoinOrCreate(customRoomId)}
              className="flex-1 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-xs text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              onClick={() => handleJoinOrCreate(customRoomId)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Tạo / Tham gia
            </button>
          </div>
        </div>
      </motion.div>

      {/* Featured Public Sessions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Phòng Nghe Đang Hoạt Động</h2>
            <p className="text-xs text-white/50">Tham gia ngay với một chạm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_SESSIONS.map((session) => (
            <TiltCard
              key={session.id}
              onClick={() => handleJoinOrCreate(session.id)}
              glowColor="rgba(139, 92, 246, 0.45)"
              className="group p-5"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={session.hostAvatar}
                      alt={session.hostName}
                      className="h-9 w-9 rounded-full object-cover border border-cyan-400/40"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white/90">{session.hostName}</p>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        Host
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                    <Headphones className="h-3 w-3 text-cyan-300" />
                    <span>{session.listenersCount}</span>
                  </div>
                </div>

                {/* Cover & Track Title */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-md">
                  <img
                    src={session.coverImage}
                    alt={session.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                      <Disc3 className="h-3 w-3 animate-spin" /> Đang phát
                    </p>
                    <p className="truncate text-sm font-bold text-white">{session.currentTrackTitle}</p>
                    <p className="truncate text-xs text-white/60">{session.currentTrackArtist}</p>
                  </div>
                </div>

                {/* Title & Tags */}
                <div>
                  <h3 className="font-bold text-base group-hover:text-cyan-300 transition">
                    {session.title}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Join button */}
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-cyan-300 group-hover:translate-x-1 transition">
                  <span>Vào phòng ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>
    </div>
  );
}

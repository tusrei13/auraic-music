"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Headphones,
  ArrowRight,
  Disc3,
  Radio,
  Sparkles,
} from "lucide-react";
import Artwork from "@/components/Artwork";

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
    hostName: "Minh Quân",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    listenersCount: 42,
    currentTrackTitle: "The Suffering",
    currentTrackArtist: "Coheed and Cambria",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
    tags: ["Audiophile", "FLAC", "Classic"],
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
    tags: ["Lofi", "Rain", "Chill"],
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
    tags: ["Synthwave", "Cyberpunk", "8-Bit"],
  },
];

export default function SessionLobbyPage() {
  const router = useRouter();
  const [customRoomId, setCustomRoomId] = useState("");

  const handleJoinOrCreate = (roomId: string) => {
    const target = roomId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "audiophile-lounge";
    router.push(`/session/${target}`);
  };

  return (
    <div className="min-h-full px-4 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-12">
      {/* 2D HARDWARE CONSOLE HEADER */}
      <section className="relative overflow-hidden rounded-[36px] border-2 border-white/15 bg-[#0d0f1b]/95 p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.2)]">
        <div className="retro-screw absolute top-4 left-4" />
        <div className="retro-screw absolute top-4 right-4" />
        <div className="retro-screw absolute bottom-4 left-4" />
        <div className="retro-screw absolute bottom-4 right-4" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-violet-600/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[90px]" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-3.5 py-1 text-xs font-arcade font-bold text-cyan-300">
            <Users className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
            <span>REALTIME SOUND SYNC CONSOLE</span>
          </div>

          <h1 className="font-pixel text-3xl sm:text-5xl font-black tracking-tight text-white">
            Phòng Nghe Chung Realtime
          </h1>

          <p className="font-arcade text-xs sm:text-sm text-white/60 tracking-wider leading-relaxed">
            Thưởng thức âm nhạc đồng bộ từng mili-giây cùng bạn bè qua giao diện 2D Hardware Deck. Đĩa than quay hiển thị Avatar người Request và reaction nảy theo nhịp điệu.
          </p>

          {/* Quick Create / Join Capsule Input */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-lg">
            <input
              type="text"
              value={customRoomId}
              onChange={(e) => setCustomRoomId(e.target.value)}
              placeholder="Nhập mã phòng hoặc tên phòng..."
              onKeyDown={(e) => e.key === "Enter" && handleJoinOrCreate(customRoomId)}
              className="flex-1 rounded-full border-2 border-white/20 bg-white/[0.06] px-5 py-3 font-pixel text-xs text-white placeholder:text-white/40 focus:border-white focus:bg-white/[0.1] focus:shadow-[0_0_20px_rgba(255,255,255,0.25)] focus:outline-none transition-all tracking-wide"
            />
            <button
              onClick={() => handleJoinOrCreate(customRoomId)}
              className="flex items-center justify-center gap-2 rounded-full bg-white text-black px-6 py-3 font-pixel text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> VÀO PHÒNG
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED ACTIVE ROOMS (2D CARTOON HARDWARE CONSOLE CARDS) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-xl sm:text-2xl font-bold tracking-tight text-white">
              Active Listening Rooms
            </h2>
            <p className="font-arcade text-xs text-white/50 tracking-wider">
              Chọn phòng phát sóng trực tiếp hoặc tạo phòng riêng
            </p>
          </div>
          <span className="font-arcade text-xs text-cyan-300">
            2D Hardware Consoles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_SESSIONS.map((session) => (
            <div
              key={session.id}
              className="relative overflow-hidden rounded-[32px] border-2 border-white/15 bg-[#0e101c]/95 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-purple-500/50 hover:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(168,85,247,0.25)] transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              {/* Corner Screws on each Hardware Console */}
              <div className="retro-screw absolute top-3.5 left-3.5 pointer-events-none" />
              <div className="retro-screw absolute top-3.5 right-3.5 pointer-events-none" />
              <div className="retro-screw absolute bottom-3.5 left-3.5 pointer-events-none" />
              <div className="retro-screw absolute bottom-3.5 right-3.5 pointer-events-none" />

              {/* Console Top Header: Host avatar with retro outline frame & Listeners Badge */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 rounded-2xl border-2 border-cyan-400/50 overflow-hidden bg-black/60 shadow-md">
                    <Artwork
                      src={session.hostAvatar}
                      alt={session.hostName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-pixel text-xs font-bold text-white tracking-wide">
                      {session.hostName}
                    </p>
                    <span className="flex items-center gap-1 font-arcade text-[10px] text-cyan-300 uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                      ROOM HOST
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 font-arcade text-xs text-white/80">
                  <Headphones className="h-3.5 w-3.5 text-cyan-300" />
                  <span>{session.listenersCount} ONLINE</span>
                </div>
              </div>

              {/* 2D Artwork Frame with Rounded Corners & Current Track Overlay */}
              <div className="relative aspect-video w-full overflow-hidden rounded-[24px] border-2 border-white/15 shadow-xl group">
                <Artwork
                  src={session.coverImage}
                  alt={session.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="font-arcade text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1">
                    <Disc3 className="h-3 w-3 animate-spin" /> ĐANG PHÁT HI-FI
                  </p>
                  <p className="truncate font-pixel text-sm font-bold text-white mt-0.5">
                    {session.currentTrackTitle}
                  </p>
                  <p className="truncate font-arcade text-xs text-white/60">
                    by {session.currentTrackArtist}
                  </p>
                </div>
              </div>

              {/* Room Title & Capsule Tags */}
              <div className="space-y-2">
                <h3 className="font-pixel text-base font-bold text-white tracking-tight truncate">
                  {session.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {session.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 bg-white/[0.04] px-3 py-0.5 font-arcade text-[10px] text-white/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* PROMINENT "PRESS TO JOIN" CAPSULE BUTTON */}
              <button
                type="button"
                onClick={() => handleJoinOrCreate(session.id)}
                className="w-full rounded-full border-2 border-white bg-white text-black py-3 font-pixel text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PRESS TO JOIN</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

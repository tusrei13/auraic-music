"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Heart,
  ArrowLeft,
  Disc3,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { StreamEngineService, AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { EngineTrack } from "@/types/sound-engine";
import Artwork from "@/components/Artwork";
import PixelBadge from "@/components/ui/PixelBadge";
import BlockyWaveform from "@/components/ui/BlockyWaveform";

export default function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rawTrackId = resolvedParams.id;
  const cleanId = AuraicAudioAdapter.extractRawId(rawTrackId);

  const { playTrack, currentTrack, isPlaying, likedIds, toggleLike } = usePlayerStore();

  const [track, setTrack] = useState<EngineTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewTime, setPreviewTime] = useState(45);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const trackData = await StreamEngineService.fetchTrackDetails(cleanId);
        if (mounted) {
          setTrack(trackData);
        }
      } catch (err) {
        console.error("[TrackDetail] Error loading track details:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, [cleanId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-white/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <span className="font-arcade text-xs text-cyan-300">Đang đọc dữ liệu Sound Engine...</span>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white/70 space-y-4">
        <p className="font-pixel text-lg font-bold">Không tìm thấy bài hát trên Sound Engine</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-white bg-white text-black font-pixel text-xs font-bold shadow-md hover:scale-105 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Về Trang Chủ
        </Link>
      </div>
    );
  }

  const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
  const isCurrent = String(currentTrack?.id) === String(playerTrack.id);
  const isLiked = likedIds.some((id) => String(id) === String(playerTrack.id));
  const hdArtwork =
    track.artwork?.["1000x1000"] ||
    track.artwork?.["480x480"] ||
    track.artwork?.["150x150"] ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop";

  return (
    <div className="min-h-full px-5 pb-36 pt-6 text-white sm:px-8 lg:px-12 space-y-10">
      {/* Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-arcade text-xs text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sound Hub</span>
        </Link>
      </div>

      {/* Main Track Presentation Hardware Deck Frame */}
      <div className="relative overflow-hidden rounded-[36px] border-2 border-white/20 bg-[#0d0f1b]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="retro-screw absolute top-4 left-4" />
        <div className="retro-screw absolute top-4 right-4" />
        <div className="retro-screw absolute bottom-4 left-4" />
        <div className="retro-screw absolute bottom-4 right-4" />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Track artwork */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0 rounded-[30px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-2 border-white/20">
            <Artwork
              src={hdArtwork}
              alt={track.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/70 border border-cyan-400/40 font-arcade text-[10px] font-bold text-cyan-300 backdrop-blur-md">
              SOUND ENGINE
            </div>
          </div>

          {/* Metadata info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-400/40 font-arcade text-[11px] text-cyan-300">
              <Disc3 className="w-3.5 h-3.5 animate-spin" />
              <span>ARCADE TRACK PROFILE</span>
            </div>

            <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {track.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Link
                href={`/artist/${track.user?.id}`}
                className="inline-flex items-center gap-2 hover:underline group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 shadow-md">
                  <Artwork
                    src={track.user?.profile_picture?.["150x150"] || hdArtwork}
                    alt={track.user?.name || "Artist"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-pixel text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {track.user?.name}
                </span>
                {track.user?.is_verified && (
                  <span className="font-arcade text-xs text-cyan-400 font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/40 bg-cyan-950/40">✓ VERIFIED</span>
                )}
              </Link>

              <PixelBadge
                count={isLiked ? 393 : 392}
                variant="bubble"
                onClick={() => toggleLike(playerTrack)}
              />
            </div>

            {/* Blocky Waveform Visualizer Preview */}
            <div className="pt-2 max-w-md">
              <BlockyWaveform
                currentTime={previewTime}
                duration={track.duration || 180}
                isPlaying={isPlaying && isCurrent}
                onSeek={(time) => setPreviewTime(time)}
                barCount={32}
                glowColor="cyan"
              />
            </div>

            {/* Play Button & CTAs */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <button
                type="button"
                onClick={() => playTrack(playerTrack, [playerTrack], track.title)}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full border-2 border-white bg-white text-black font-pixel font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,255,255,0.7)] hover:scale-105 transition-all cursor-pointer"
              >
                {isCurrent && isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-black text-black" />
                    <span>Tạm Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                    <span>Phát Nhạc</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleLike(playerTrack)}
                className="p-3.5 rounded-full border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-rose-400 transition cursor-pointer"
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

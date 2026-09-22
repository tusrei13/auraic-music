"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Heart,
  Share2,
  GitFork,
  Layers,
  Sparkles,
  Music,
  Activity,
  Tag,
  ShieldCheck,
  Radio,
  ArrowLeft,
  ChevronRight,
  Headphones,
  Repeat2,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { StreamEngineService, AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { EngineTrack, EngineRemixTreeNode } from "@/types/sound-engine";
import Artwork from "@/components/Artwork";
import TiltCard from "@/components/ui/TiltCard";

export default function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rawTrackId = resolvedParams.id;
  const cleanId = AuraicAudioAdapter.extractRawId(rawTrackId);

  const { playTrack, currentTrack, isPlaying, likedIds, toggleLike } = usePlayerStore();

  const [track, setTrack] = useState<EngineTrack | null>(null);
  const [remixTree, setRemixTree] = useState<{
    root: EngineRemixTreeNode | null;
    remixes: EngineTrack[];
  }>({ root: null, remixes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [trackData, treeData] = await Promise.all([
          StreamEngineService.fetchTrackDetails(cleanId),
          StreamEngineService.fetchRemixTree(cleanId),
        ]);
        if (mounted) {
          setTrack(trackData);
          setRemixTree(treeData);
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
          <span className="text-xs font-mono text-cyan-300">Đang phân tích Track Lineage...</span>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white/70 space-y-4">
        <p className="text-lg font-bold">Không tìm thấy bài hát trên Sound Engine</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
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

  const hasRemixHierarchy = Boolean(track.remix_of?.tracks?.length || remixTree.remixes?.length);

  return (
    <div className="min-h-full px-5 pb-36 pt-6 text-white sm:px-8 lg:px-12 space-y-10">
      {/* Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sound Hub</span>
        </Link>
      </div>

      {/* Main Track Presentation */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black/80 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* HD 1000x1000 Artwork with 3D Float */}
          <TiltCard
            glowColor="rgba(6, 182, 212, 0.4)"
            depthZ={28}
            className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20"
          >
            <Artwork
              src={hdArtwork}
              alt={track.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 backdrop-blur-md">
              320kbps Hi-Res
            </div>
          </TiltCard>

          {/* Metadata info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
              <Sparkles className="w-3 h-3" />
              <span>TRACK LINEAGE • REVERSE TREE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              {track.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href={`/artist/${track.user?.id}`}
                className="inline-flex items-center gap-2 hover:underline group"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20">
                  <Artwork
                    src={track.user?.profile_picture?.["150x150"] || hdArtwork}
                    alt={track.user?.name || "Artist"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-sm text-white/90 group-hover:text-cyan-300 transition-colors">
                  {track.user?.name}
                </span>
                {track.user?.is_verified && (
                  <span className="text-cyan-400 text-xs font-bold">✓</span>
                )}
              </Link>
            </div>

            {/* Play Button & CTAs */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <button
                type="button"
                onClick={() => playTrack(playerTrack, [playerTrack], track.title)}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 text-black font-black text-sm uppercase tracking-wider hover:opacity-95 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 transition-all cursor-pointer"
              >
                {isCurrent && isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-black" />
                    <span>Tạm Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-black" />
                    <span>Phát 320kbps</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleLike(playerTrack)}
                className="p-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 hover:text-rose-400 transition cursor-pointer"
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
                />
              </button>
            </div>

            {/* Rich Metadata Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 text-left">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Mood Tag</span>
                <p className="text-xs font-bold text-cyan-300">{track.mood || "Atmospheric"}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Tempo / BPM</span>
                <p className="text-xs font-mono font-bold text-amber-300">
                  {track.bpm ? `${track.bpm} BPM` : "120 BPM"}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Thể Loại</span>
                <p className="text-xs font-bold text-purple-300">{track.genre || "Electronic"}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-white/40">License</span>
                <p className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Open Stream</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* REMIX & STEM HIERARCHY TREE VISUALIZER                    */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 border border-indigo-500/30">
            <GitFork className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400">
              Stem & Derivative Graph
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white/95">
              Cây Phái Sinh Remix / Stems
            </h2>
          </div>
        </div>

        {hasRemixHierarchy && remixTree.root ? (
          <div className="relative rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8 backdrop-blur-xl overflow-x-auto">
            {/* Visualizer Nodes */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 min-w-[500px]">
              {/* Root / Original Track Node */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 uppercase">
                  Bài Hát Gốc (Original Master)
                </div>
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  <Artwork
                    src={remixTree.root.artworkUrl || hdArtwork}
                    alt={remixTree.root.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-xs max-w-[140px] truncate text-white">
                  {remixTree.root.title}
                </span>
                <span className="text-[10px] text-white/50">{remixTree.root.artistName}</span>
              </div>

              {/* Connecting Branch Visualizer */}
              <div className="flex flex-col items-center justify-center text-cyan-400">
                <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-400 to-indigo-500 hidden md:block" />
                <span className="text-xs font-mono text-indigo-300 py-1">Phái Sinh</span>
                <ChevronRight className="w-6 h-6 animate-pulse hidden md:block" />
              </div>

              {/* Children Remixes & Stems */}
              <div className="flex flex-wrap gap-4 justify-center">
                {remixTree.root.children.map((childNode) => (
                  <div
                    key={childNode.id}
                    className="flex flex-col items-center text-center space-y-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-indigo-500/40 transition-all"
                  >
                    <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-mono text-indigo-300 uppercase">
                      {childNode.relationType === "stem" ? `Stem: ${childNode.stemCategory || "Audio"}` : "Remix"}
                    </div>
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/20 shadow-md">
                      <Artwork
                        src={childNode.artworkUrl || hdArtwork}
                        alt={childNode.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold text-xs max-w-[120px] truncate text-white">
                      {childNode.title}
                    </span>
                    <Link
                      href={`/track/${childNode.id}`}
                      className="text-[10px] text-cyan-300 hover:underline"
                    >
                      Khám phá →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-white/70">
              Đây là bản Master độc lập (Original Master).
            </p>
            <p className="text-xs text-white/40">
              Chưa có phiên bản Remix hoặc Stems phái sinh nào được phát hành trên mạng lưới.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

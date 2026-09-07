"use client";

import React, { useState, useEffect, use } from "react";
import { motion, Reorder } from "framer-motion";
import {
  Play,
  Pause,
  Shuffle,
  GripVertical,
  Heart,
  FileText,
  Clock,
  Music2,
  Trash2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { extractDominantColor, ExtractedColor } from "@/lib/colorExtractor";
import Artwork from "@/components/Artwork";
import CustomLyricsModal from "@/components/player/CustomLyricsModal";
import { getPlaylistById, formatDuration } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const playlistId = resolvedParams.id;

  const {
    playTrack,
    playMix,
    currentTrack,
    isPlaying,
    toggleLike,
    likedIds,
  } = usePlayerStore();

  const [playlistTitle, setPlaylistTitle] = useState("Auraic Playlist");
  const [playlistCover, setPlaylistCover] = useState(
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop"
  );
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerColor, setHeaderColor] = useState<ExtractedColor | null>(null);

  // Custom Lyrics Modal State
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<Track | null>(null);

  // Load Playlist Data
  useEffect(() => {
    let active = true;
    setLoading(true);

    getPlaylistById(playlistId)
      .then((data) => {
        if (!active) return;
        if (data) {
          setPlaylistTitle(data.name || "Auraic Playlist");
          if (data.coverImage) setPlaylistCover(data.coverImage);
          if (data.songs && data.songs.length > 0) {
            const formatted: Track[] = data.songs.map((item) => ({
              id: item.song.id,
              title: item.song.title,
              artist: item.song.artist,
              image: item.song.image,
              audioUrl: item.song.audioUrl,
              duration: item.song.duration,
              genre: item.song.genre,
            }));
            setTracks(formatted);
          }
        }
      })
      .catch(() => {
        // Fallback demo tracks if offline or not found
        if (!active) return;
        const fallback: Track[] = [
          {
            id: "pl-1",
            title: "Midnight Resonance",
            artist: "Auraic Studio",
            image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop",
            audioUrl: "https://prod-1.storage.jamendo.com/download/track/1885408/mp32/",
            duration: 215,
          },
          {
            id: "pl-2",
            title: "Celestial Drift",
            artist: "Cosmic Audio",
            image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
            audioUrl: "https://prod-1.storage.jamendo.com/download/track/1885408/mp32/",
            duration: 184,
          },
          {
            id: "pl-3",
            title: "Velvet Horizons",
            artist: "Lofi Dreamer",
            image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
            audioUrl: "https://prod-1.storage.jamendo.com/download/track/1885408/mp32/",
            duration: 242,
          },
        ];
        setTracks(fallback);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [playlistId]);

  // Dynamic Color Extraction from Playlist Cover Art
  useEffect(() => {
    const targetImage = tracks[0]?.image || playlistCover;
    if (!targetImage) return;

    extractDominantColor(targetImage).then((color) => {
      setHeaderColor(color);
    });
  }, [tracks, playlistCover]);

  // Handle Drag & Drop Reorder
  const handleReorder = (newOrder: Track[]) => {
    setTracks(newOrder);
    // Sync with playback store if this playlist is currently queued
    const currentQueue = usePlayerStore.getState().userQueue;
    if (currentQueue.length > 0) {
      usePlayerStore.getState().setQueue(newOrder);
    }
  };

  return (
    <div className="relative min-h-full px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-8">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại thư viện
      </Link>

      {/* ========================================================= */}
      {/* 1. DYNAMIC COLOR EXTRACTION HEADER AURA GLOW              */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-3xl">
        {/* Dynamic Glow Banner Canvas Reflection */}
        {headerColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${headerColor.glow} 0%, ${headerColor.subtleGlow} 45%, transparent 75%)`,
            }}
            className="pointer-events-none absolute inset-0 -z-10"
          />
        )}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          {/* Cover Art */}
          <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-3xl shadow-2xl border border-white/20">
            <Artwork
              src={tracks[0]?.image || playlistCover}
              alt={playlistTitle}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Playlist • Dynamic Aura Color</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              {playlistTitle}
            </h1>

            <p className="text-xs text-white/60">
              {tracks.length} bài hát • Sắp xếp tự do kéo-thả • Hỗ trợ đính kèm lời
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => tracks.length > 0 && playMix(tracks, playlistTitle)}
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-black shadow-lg transition hover:bg-neutral-100"
              >
                <Play className="h-4 w-4 fill-current" /> Phát toàn bộ
              </button>
              <button
                onClick={() => {
                  if (tracks.length === 0) return;
                  const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                  playMix(shuffled, `${playlistTitle} (Trộn)`);
                }}
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.06] px-5 py-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.12]"
              >
                <Shuffle className="h-4 w-4" /> Trộn bài
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DRAG & DROP REORDER TRACK LIST (FRAMER MOTION)         */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-white/50 px-3">
          <span className="flex items-center gap-1 font-semibold">
            <GripVertical className="h-3.5 w-3.5" /> Kéo thả biểu tượng để sắp xếp bài
          </span>
          <span>{tracks.length} bài hát</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={tracks}
            onReorder={handleReorder}
            className="space-y-2.5"
          >
            {tracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedIds.includes(track.id);

              return (
                <Reorder.Item
                  key={track.id}
                  value={track}
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing p-1 text-white/30 group-hover:text-white/70 transition">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Index or Equalizer */}
                  <div className="w-6 text-center text-xs font-mono text-white/40">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end justify-center gap-0.5 h-3">
                        <span className="w-0.5 bg-cyan-400 animate-pulse h-3 rounded-full" />
                        <span className="w-0.5 bg-violet-400 animate-pulse h-2 rounded-full" />
                        <span className="w-0.5 bg-pink-400 animate-pulse h-2.5 rounded-full" />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Cover */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <Artwork
                      src={track.image}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => playTrack(track, tracks)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Play className="h-4 w-4 fill-white text-white" />
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`truncate text-sm font-bold ${
                        isCurrent ? "text-cyan-300" : "text-white"
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="truncate text-xs text-white/50">
                      {typeof track.artist === "object"
                        ? track.artist.name
                        : track.artist}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="hidden sm:block text-xs font-mono text-white/40">
                    {formatDuration(track.duration)}
                  </div>

                  {/* Attach Lyrics Button */}
                  <button
                    onClick={() => setSelectedTrackForLyrics(track)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/60 transition hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-violet-200"
                    title="Đính kèm lời bài hát (.lrc hoặc dán text)"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Attach Lyrics</span>
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(track)}
                    className="p-2 text-white/40 transition hover:text-rose-400"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isLiked ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                  </button>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. CUSTOM LYRICS MODAL                                    */}
      {/* ========================================================= */}
      <CustomLyricsModal
        isOpen={Boolean(selectedTrackForLyrics)}
        onClose={() => setSelectedTrackForLyrics(null)}
        track={selectedTrackForLyrics}
      />
    </div>
  );
}

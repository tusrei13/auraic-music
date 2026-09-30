"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { proxyImageUrl } from "@/lib/api";
import Artwork from "@/components/Artwork";
import TrackActionMenu from "@/components/TrackActionMenu";
import {
  Disc3,
  Heart,
  Loader2,
  Music2,
  Play,
  ArrowLeft,
  Clock,
  Headphones,
} from "lucide-react";

interface AlbumTrack {
  id: string;
  title: string;
  duration: number;
  play_count?: number;
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } | null;
  user: {
    id: string;
    name: string;
    handle: string;
    profile_picture?: any;
    is_verified: boolean;
  };
}

interface AlbumData {
  id: string;
  title: string;
  artist: string;
  year: number;
  trackCount: number;
  totalDuration?: number;
  artwork: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } | null;
  tracks: AlbumTrack[];
}

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const albumId = decodeURIComponent(id);

  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const { currentTrack, isPlaying, playTrack, likedIds, toggleLike } = usePlayerStore();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);

    const loadAlbum = async () => {
      try {
        const res = await fetch(`/api/sound-engine/album/${encodeURIComponent(albumId)}`);
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as AlbumData;
        if (active) setAlbum(data);
      } catch {
        if (active) {
          setAlbum(null);
          setFailed(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAlbum();
    return () => { active = false; };
  }, [albumId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-white/55">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <span>Đang tải album...</span>
      </div>
    );
  }

  if (failed || !album) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/55">
        <Disc3 className="h-10 w-10 text-white/20" />
        <p>Không thể tải album này.</p>
        <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  const coverImage = proxyImageUrl(album.artwork?.["1000x1000"] || album.artwork?.["480x480"] || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop");
  const isLiked = (trackId: string) => likedIds.some((likedId) => String(likedId) === trackId);

  const totalDuration = album.tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePlayAlbum = () => {
    if (album.tracks.length === 0) return;
    const playerTracks = album.tracks.map((t) => {
      const artwork = t.artwork?.["1000x1000"] || t.artwork?.["480x480"] || t.artwork?.["150x150"] || coverImage;
      const avatar = t.user?.profile_picture?.["480x480"] || t.user?.profile_picture?.["150x150"] || coverImage;

      return {
        id: `youtube:${t.id}`,
        title: t.title,
        artist: { id: t.user?.id || "", name: t.user?.name || t.user?.handle || "Unknown Artist", avatar },
        image: artwork,
        audioUrl: `/api/sound-engine/stream?id=${encodeURIComponent(t.id)}`,
        duration: t.duration,
        genre: "Electronic",
        isEngineTrack: true,
        rawEngineTrack: t as any,
      } as any;
    });

    playTrack(playerTracks[0], playerTracks, album.title);
  };

  const handlePlayTrack = (track: AlbumTrack) => {
    const artwork = track.artwork?.["1000x1000"] || track.artwork?.["480x480"] || track.artwork?.["150x150"] || coverImage;
    const avatar = track.user?.profile_picture?.["480x480"] || track.user?.profile_picture?.["150x150"] || coverImage;

    const playerTrack = {
      id: `youtube:${track.id}`,
      title: track.title,
      artist: { id: track.user?.id || "", name: track.user?.name || track.user?.handle || "Unknown Artist", avatar },
      image: artwork,
      audioUrl: `/api/sound-engine/stream?id=${encodeURIComponent(track.id)}`,
      duration: track.duration,
      genre: "Electronic",
      isEngineTrack: true,
      rawEngineTrack: track as any,
    } as any;

    const pool = album.tracks.map((t) => {
      const a = t.artwork?.["1000x1000"] || t.artwork?.["480x480"] || t.artwork?.["150x150"] || coverImage;
      const av = t.user?.profile_picture?.["480x480"] || t.user?.profile_picture?.["150x150"] || coverImage;
      return {
        id: `youtube:${t.id}`,
        title: t.title,
        artist: { id: t.user?.id || "", name: t.user?.name || t.user?.handle || "Unknown Artist", avatar: av },
        image: a,
        audioUrl: `/api/sound-engine/stream?id=${encodeURIComponent(t.id)}`,
        duration: t.duration,
        genre: "Electronic",
        isEngineTrack: true,
        rawEngineTrack: t as any,
      } as any;
    });

    playTrack(playerTrack, pool, album.title);
  };

  return (
    <div className="min-h-full space-y-8 bg-[#09090b] p-6 pb-28 text-white sm:p-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sound Hub</span>
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/80 via-indigo-950/45 to-[#0b0b10] p-6 shadow-2xl sm:p-8">
        <div className="absolute inset-0 opacity-20 blur-3xl" style={{ backgroundImage: `url(${coverImage})`, backgroundPosition: "center", backgroundSize: "cover" }} />
        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-end">
          <div className="shrink-0">
            <Artwork
              src={coverImage}
              alt={`Bìa album ${album.title}`}
              className="aspect-square w-44 rounded-2xl object-cover shadow-2xl sm:w-56"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-300 md:justify-start">
              <Disc3 className="h-4 w-4" aria-hidden="true" /> Album
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{album.title}</h1>
            <Link href={`/artist/${encodeURIComponent(album.artist)}?name=${encodeURIComponent(album.artist)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
              {album.artist}
            </Link>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/50">
              <span>{album.year} • {album.trackCount} bài hát</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(totalDuration)}
              </span>
            </div>
            <button
              type="button"
              disabled={!album.tracks.length}
              onClick={handlePlayAlbum}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-500 px-6 font-bold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" /> Phát album
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Music2 className="h-5 w-5 text-indigo-400" aria-hidden="true" /> Danh sách bài hát
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          {album.tracks.length ? album.tracks.map((track, index) => {
            const playerTrack = AuraicAudioAdapter.toPlayerTrack(track as any);
            const current = String(currentTrack?.id) === String(playerTrack.id);
            const artworkUrl = track.artwork?.["150x150"] || track.artwork?.["480x480"] || coverImage;

            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`group grid cursor-pointer grid-cols-12 items-center border-b border-white/5 px-4 py-3 last:border-0 ${current ? "bg-indigo-500/15" : "hover:bg-white/5"}`}
              >
                <div className="col-span-1 text-xs font-mono text-white/40">
                  {current && isPlaying ? "▶" : String(index + 1).padStart(2, "0")}
                </div>
                <div className="col-span-7 flex min-w-0 items-center gap-3 sm:col-span-6">
                  <Artwork src={artworkUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h3 className={`truncate text-sm font-semibold ${current ? "text-indigo-300" : "text-white"}`}>
                      {track.title}
                    </h3>
                    <p className="truncate text-xs text-white/45">{track.user?.name || track.user?.handle || album.artist}</p>
                  </div>
                </div>
                <div className="col-span-4 hidden items-center justify-end gap-4 text-xs text-white/45 sm:flex">
                  <span className="flex items-center gap-1">
                    <Headphones className="h-3.5 w-3.5" />
                    {(track.play_count || 0).toLocaleString()}
                  </span>
                  <span className="font-mono">{formatDuration(track.duration)}</span>
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2 sm:hidden">
                  <span className="text-xs font-mono text-white/45">{formatDuration(track.duration)}</span>
                </div>
                <div className="col-span-3 hidden items-center justify-end gap-2 sm:flex">
                  <button
                    type="button"
                    aria-label={isLiked(track.id) ? `Bỏ yêu thích ${track.title}` : `Yêu thích ${track.title}`}
                    onClick={(event) => { event.stopPropagation(); toggleLike(playerTrack); }}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.08] hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                  >
                    <Heart className={`h-4 w-4 ${isLiked(track.id) ? "fill-pink-500 text-pink-500" : ""}`} />
                  </button>
                  <TrackActionMenu track={playerTrack} />
                </div>
              </div>
            );
          }) : (
            <div className="p-10 text-center text-sm text-white/50">Album này chưa có bài hát khả dụng.</div>
          )}
        </div>
      </section>
    </div>
  );
}

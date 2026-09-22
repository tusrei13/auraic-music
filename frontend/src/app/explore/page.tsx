"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AuraicAudioAdapter, StreamEngineService } from "@/lib/sound-engine/client";
import type { EngineTrack, EnginePlaylist } from "@/types/sound-engine";
import Artwork from "@/components/Artwork";
import TiltCard from "@/components/ui/TiltCard";
import {
  Compass,
  Play,
  Pause,
  Heart,
  Search,
  Disc3,
  User,
  Music2,
  ListMusic,
  Loader2,
} from "lucide-react";

type TabFilter = "all" | "songs" | "artists" | "albums" | "playlists";

const TABS: { id: TabFilter; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Tất Cả", icon: <Compass className="w-3.5 h-3.5" /> },
  { id: "songs", label: "Bài Hát", icon: <Music2 className="w-3.5 h-3.5" /> },
  { id: "artists", label: "Nghệ Sĩ", icon: <User className="w-3.5 h-3.5" /> },
  { id: "albums", label: "Album", icon: <Disc3 className="w-3.5 h-3.5" /> },
  { id: "playlists", label: "Playlist", icon: <ListMusic className="w-3.5 h-3.5" /> },
];

export default function ExplorePage() {
  const { playTrack, currentTrack, isPlaying, likedIds, toggleLike } = usePlayerStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [results, setResults] = useState<{
    songs: any[];
    artists: any[];
    albums: any[];
    playlists: any[];
  }>({ songs: [], artists: [], albums: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (q: string, tab: TabFilter) => {
    if (!q.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let type = tab === "all" ? undefined : tab === "songs" ? "song" : tab === "artists" ? "artist" : tab === "albums" ? "album" : "playlist";
      const res = await fetch(`/api/sound-engine/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ""}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults({
        songs: Array.isArray(data.songs) ? data.songs : [],
        artists: Array.isArray(data.artists) ? data.artists : [],
        albums: Array.isArray(data.albums) ? data.albums : [],
        playlists: Array.isArray(data.playlists) ? data.playlists : [],
      });
    } catch (err) {
      console.error("[Explore] Search failed:", err);
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      doSearch(query, activeTab);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, activeTab, doSearch]);

  const handlePlaySong = (song: any, pool: any[]) => {
    const artwork = song.artwork?.["480x480"] || song.artwork?.["150x150"] || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";
    const playerTrack = {
      id: `engine:${song.id}`,
      title: song.title,
      artist: { id: song.id, name: song.artist || "Unknown Artist", avatar: artwork },
      image: artwork,
      audioUrl: `/api/sound-engine/stream?id=${encodeURIComponent(song.id)}`,
      duration: song.duration || 0,
      genre: "Electronic",
      isEngineTrack: true,
    };
    const playerPool = pool.map((s: any) => {
      const a = s.artwork?.["480x480"] || s.artwork?.["150x150"] || artwork;
      return {
        id: `engine:${s.id}`,
        title: s.title,
        artist: { id: s.id, name: s.artist || "Unknown Artist", avatar: a },
        image: a,
        audioUrl: `/api/sound-engine/stream?id=${encodeURIComponent(s.id)}`,
        duration: s.duration || 0,
        genre: "Electronic",
        isEngineTrack: true,
      };
    });
    playTrack(playerTrack, playerPool, `Search: ${query}`);
  };

  const showSection = (section: keyof typeof results) => {
    if (activeTab !== "all" && activeTab !== (section === "songs" ? "songs" : section === "artists" ? "artists" : section === "albums" ? "albums" : "playlists")) return false;
    return results[section].length > 0;
  };

  return (
    <div className="min-h-full px-5 pb-36 pt-6 text-white sm:px-8 lg:px-12 space-y-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-300">
            <Compass className="w-3.5 h-3.5" />
            <span>GLOBAL MEDIA EXPLORER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Khám Phá & Tìm Kiếm
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Tìm kiếm bài hát, nghệ sĩ, album và playlist từ toàn cầu.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400">
          <Search className="w-3.5 h-3.5" />
          <span>Tìm Kiếm</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên bài hát, nghệ sĩ, album..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)] font-bold scale-105"
                    : "bg-white/5 hover:bg-white/10 text-white/75 hover:text-white border border-white/10"
                }`}
              >
                {tab.icon}
                <span>#{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {hasSearched && !loading && results.songs.length === 0 && results.artists.length === 0 && results.albums.length === 0 && results.playlists.length === 0 && (
        <div className="text-center text-sm text-white/50 py-10">
          Không tìm thấy kết quả cho &ldquo;{query}&rdquo;.
        </div>
      )}

      {showSection("songs") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Music2 className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white/95">Bài Hát</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.songs.map((song) => {
              const artwork = song.artwork?.["480x480"] || song.artwork?.["150x150"] || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";
              const isCurrent = String(currentTrack?.id) === `engine:${song.id}`;
              const isLiked = likedIds.some((id) => String(id) === `engine:${song.id}`);

              return (
                <TiltCard
                  key={song.id}
                  glowColor="rgba(6, 182, 212, 0.35)"
                  depthZ={14}
                  className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3">
                    <Artwork src={artwork} alt={song.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <button
                      type="button"
                      onClick={() => handlePlaySong(song, results.songs)}
                      className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">{song.title}</h3>
                    <p className="text-xs text-white/50 truncate">{song.artist}</p>
                  </div>
                  <button type="button" onClick={() => {}} className="mt-2 self-end text-white/40 hover:text-pink-400 transition-colors">
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-pink-500 text-pink-500" : ""}`} />
                  </button>
                </TiltCard>
              );
            })}
          </div>
        </section>
      )}

      {showSection("artists") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30">
              <User className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white/95">Nghệ Sĩ</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {results.artists.map((artist) => {
              const avatar = artist.avatar?.["480x480"] || artist.avatar?.["150x150"] || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";
              return (
                <Link
                  key={artist.id}
                  href={`/artist/${encodeURIComponent(artist.id)}?name=${encodeURIComponent(artist.name)}`}
                  className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-fuchsia-500/30 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-white/10">
                    <Artwork src={avatar} alt={artist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-fuchsia-300 transition-colors">{artist.name}</h3>
                    <p className="text-xs text-white/50">Nghệ sĩ</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {showSection("albums") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Disc3 className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white/95">Album</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {results.albums.map((album) => {
              const artwork = album.artwork?.["480x480"] || album.artwork?.["150x150"] || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop";
              return (
                <Link
                  key={album.id}
                  href={`/album/${encodeURIComponent(album.id)}?name=${encodeURIComponent(album.title)}`}
                  className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-purple-500/30 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3">
                    <Artwork src={artwork} alt={album.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 border border-white/20 text-[10px] font-mono text-white backdrop-blur-md">
                      {album.trackCount || ""} tracks
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-purple-300 transition-colors">{album.title}</h3>
                    <p className="text-xs text-white/50 truncate">{album.artist}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {showSection("playlists") && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <ListMusic className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white/95">Playlist</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {results.playlists.map((pl) => {
              const artwork = pl.artwork?.["480x480"] || pl.artwork?.["150x150"] || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop";
              return (
                <div
                  key={pl.id}
                  className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3">
                    <Artwork src={artwork} alt={pl.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{pl.title}</h3>
                    <p className="text-xs text-white/50 truncate">{pl.description || "Playlist"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

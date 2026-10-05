"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AuraicAudioAdapter, StreamEngineService } from "@/lib/sound-engine/client";
import type { EngineArtist, EngineTrack, EnginePlaylist } from "@/types/sound-engine";
import Artwork from "@/components/Artwork";
import TiltCard from "@/components/ui/TiltCard";
import {
  Play,
  Pause,
  Music,
  Disc,
  Heart,
  UserPlus,
  UserCheck,
  BadgeCheck,
  Loader2,
  MapPin,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ArtistPageData {
  artist: EngineArtist | null;
  topTracks: EngineTrack[];
  albums: EnginePlaylist[];
  relatedArtists: EngineArtist[];
}

type TabKey = "tracks" | "discography" | "bio" | "related";

export default function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const rawId = decodeURIComponent(id);
  const searchParams = useSearchParams();
  const artistNameHint = searchParams.get("name") || rawId;

  const [data, setData] = useState<ArtistPageData>({
    artist: null,
    topTracks: [],
    albums: [],
    relatedArtists: [],
  });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("tracks");

  const { currentTrack, isPlaying, playTrack, likedIds = [], toggleLike } = usePlayerStore();

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadArtist = async () => {
      try {
        const result = await StreamEngineService.fetchArtistProfile(rawId);
        if (active) {
          setData({
            artist: result.artist,
            topTracks: result.tracks,
            albums: result.albums,
            relatedArtists: result.relatedArtists,
          });
        }
      } catch (err) {
        console.error("[ArtistDetail] Error fetching artist:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadArtist();
    return () => { active = false; };
  }, [rawId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-white/50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-xs font-mono text-cyan-300">Đang kết nối Artist Sanctuary...</span>
      </div>
    );
  }

  const artist = data.artist;
  const artistName = artist?.name || artistNameHint;
  const avatarUrl =
    artist?.profile_picture?.["480x480"] ||
    artist?.profile_picture?.["150x150"] ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

  const coverUrl =
    artist?.cover_photo?.["2000x"] ||
    artist?.cover_photo?.["640x"] ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop";

  const handlePlayTrack = (t: EngineTrack, pool: EngineTrack[]) => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack(t);
    const playerPool = pool.map(AuraicAudioAdapter.toPlayerTrack);
    playTrack(playerTrack, playerPool, `Artist: ${artistName}`);
  };

  const displayBio = artist?.bio || null;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "tracks", label: "Bài Hát Phổ Biến", icon: <Music className="w-4 h-4" /> },
    { key: "discography", label: "Album & EPs", icon: <Disc className="w-4 h-4" /> },
    { key: "bio", label: "Tiểu Sử", icon: <Globe className="w-4 h-4" /> },
    { key: "related", label: "Tương Tự", icon: <UserPlus className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-full overflow-y-auto scrollbar-none pb-36 text-white p-5 sm:p-8 lg:p-12 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sound Hub</span>
        </Link>
      </div>

      <div className="relative rounded-[36px] overflow-hidden border border-white/15 bg-black/60 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={coverUrl}
            alt={artistName}
            className="w-full h-full object-cover filter brightness-[0.55] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 -mt-24 p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border-4 border-cyan-400/40 shrink-0 group">
            <Artwork
              src={avatarUrl}
              alt={artistName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 uppercase">
                Global Media Artist
              </span>
              {artist?.location && (
                <span className="flex items-center gap-1 text-xs text-white/60 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  {artist.location}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {artistName}
              </h1>
              {artist?.is_verified && (
                <div title="Xác thực danh tính nghệ sĩ" className="p-1 rounded-full bg-cyan-500/20 border border-cyan-400/50">
                  <BadgeCheck className="w-6 h-6 text-cyan-400 fill-cyan-400/20" />
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-white/60 font-mono">@{artist?.handle || rawId}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 text-xs font-mono text-white/60">
              <div>
                <span className="font-bold text-white text-sm">
                  {(artist?.follower_count || 0).toLocaleString()}
                </span>{" "}
                Người theo dõi
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {data.topTracks.length || artist?.track_count || 0}
                </span>{" "}
                Bản phát hành
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {data.albums.length || artist?.album_count || 0}
                </span>{" "}
                Albums
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {data.topTracks.length > 0 && (
              <button
                type="button"
                onClick={() => handlePlayTrack(data.topTracks[0], data.topTracks)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Phát Tất Cả</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                isFollowing
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                  : "border-white/20 bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isFollowing ? "Đang theo dõi" : "Theo dõi"}</span>
            </button>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-white/10 text-cyan-300 border border-b-0 border-white/15"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === "tracks" && (
          <motion.section
            key="tracks"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <Music className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                  Popular
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white/95">
                  Bài Hát Phổ Biến
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {data.topTracks.map((track, index) => {
                const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
                const isCurrent = String(currentTrack?.id) === String(playerTrack.id);
                const isLiked = likedIds.some((id) => String(id) === String(playerTrack.id));
                const artworkUrl =
                  track.artwork?.["480x480"] ||
                  track.artwork?.["150x150"] ||
                  avatarUrl;

                return (
                  <TiltCard
                    key={track.id}
                    glowColor="rgba(6, 182, 212, 0.35)"
                    depthZ={14}
                    className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3">
                      <Artwork
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => handlePlayTrack(track, data.topTracks)}
                        className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-black" />
                        ) : (
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        )}
                      </button>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 border border-white/20 text-[10px] font-mono text-white backdrop-blur-md">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs text-white/50 truncate">{artistName}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleLike(playerTrack)}
                      className="mt-2 self-end text-white/40 hover:text-pink-400 transition-colors"
                    >
                      <Heart
                        className={`h-4 w-4 ${isLiked ? "fill-pink-500 text-pink-500" : ""}`}
                      />
                    </button>
                  </TiltCard>
                );
              })}
              {data.topTracks.length === 0 && (
                <div className="col-span-full text-center text-sm text-white/50 py-10">
                  Chưa có bài hát phổ biến.
                </div>
              )}
            </div>
          </motion.section>
        )}

        {activeTab === "discography" && (
          <motion.section
            key="discography"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <Disc className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400">
                    Discography
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white/95">
                    Album & EPs
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {data.albums.map((album) => {
                const artworkUrl =
                  album.artwork?.["480x480"] ||
                  album.artwork?.["150x150"] ||
                  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop";

                return (
                  <Link
                    key={album.id}
                    href={`/album/${encodeURIComponent(album.id)}?name=${encodeURIComponent(album.playlist_name || album.title || "")}`}
                    className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-purple-500/30 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3">
                      <Artwork
                        src={artworkUrl}
                        alt={album.playlist_name || album.title || "Album"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 border border-white/20 text-[10px] font-mono text-white backdrop-blur-md">
                        {album.track_count} tracks
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-purple-300 transition-colors">
                        {album.playlist_name}
                      </h3>
                      <p className="text-xs text-white/50 truncate">{artistName}</p>
                    </div>
                  </Link>
                );
              })}
              {data.albums.length === 0 && (
                <div className="col-span-full text-center text-sm text-white/50 py-10">
                  Chưa có album nào.
                </div>
              )}
            </div>
          </motion.section>
        )}

        {activeTab === "bio" && (
          <motion.section
            key="bio"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                  Biography
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white/95">
                  Tiểu Sử
                </h2>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              {displayBio ? (
                <p className="text-sm sm:text-base text-white/75 leading-relaxed whitespace-pre-line">
                  {displayBio}
                </p>
              ) : (
                <p className="text-sm text-white/50">Chưa có tiểu sử cho nghệ sĩ này.</p>
              )}
            </div>
          </motion.section>
        )}

        {activeTab === "related" && (
          <motion.section
            key="related"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30">
                <UserPlus className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-fuchsia-400">
                  Fans Also Like
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white/95">
                  Nghệ Sĩ Tương Tự
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {data.relatedArtists.map((related) => {
                const relatedAvatar =
                  related.profile_picture?.["480x480"] ||
                  related.profile_picture?.["150x150"] ||
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

                return (
                  <Link
                    key={related.id}
                    href={`/artist/${encodeURIComponent(related.id)}?name=${encodeURIComponent(related.name)}`}
                    className="group rounded-3xl p-4 border border-white/10 bg-white/[0.04] hover:border-fuchsia-500/30 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                  >
                    <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-white/10">
                      <Artwork
                        src={relatedAvatar}
                        alt={related.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-fuchsia-300 transition-colors">
                        {related.name}
                      </h3>
                      <p className="text-xs text-white/50">Nghệ sĩ</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

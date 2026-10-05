"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AuraicAudioAdapter, StreamEngineService } from "@/lib/sound-engine/client";
import type { EngineArtist, EngineTrack, EnginePlaylist } from "@/types/sound-engine";
import Artwork from "@/components/Artwork";
import PillFilter from "@/components/ui/PillFilter";
import {
  Play,
  Pause,
  Music,
  Disc,
  Heart,
  UserPlus,
  UserCheck,
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
        <span className="font-arcade text-xs text-cyan-300">Đang đồng bộ hồ sơ Artist...</span>
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
    { key: "tracks", label: "Bài Hát Phổ Biến", icon: <Music className="w-3.5 h-3.5" /> },
    { key: "discography", label: "Album & EPs", icon: <Disc className="w-3.5 h-3.5" /> },
    { key: "bio", label: "Tiểu Sử", icon: <Globe className="w-3.5 h-3.5" /> },
    { key: "related", label: "Tương Tự", icon: <UserPlus className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-full overflow-y-auto scrollbar-none pb-36 text-white p-5 sm:p-8 lg:p-12 space-y-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-arcade text-xs text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sound Hub</span>
        </Link>
      </div>

      {/* Artist Hero Hardware Console */}
      <div className="relative rounded-[36px] overflow-hidden border-2 border-white/20 bg-[#0d0f1b]/95 shadow-2xl">
        <div className="retro-screw absolute top-4 left-4 z-20" />
        <div className="retro-screw absolute top-4 right-4 z-20" />
        <div className="retro-screw absolute bottom-4 left-4 z-20" />
        <div className="retro-screw absolute bottom-4 right-4 z-20" />

        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={coverUrl}
            alt={artistName}
            className="w-full h-full object-cover filter brightness-[0.5] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f1b] via-[#0d0f1b]/60 to-transparent" />
        </div>

        <div className="relative z-10 -mt-24 p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
          {/* Avatar with thick neon border */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.85)] border-4 border-cyan-400 shrink-0 group">
            <Artwork
              src={avatarUrl}
              alt={artistName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 font-arcade text-[10px] text-cyan-300 uppercase">
                ARCADE ARTIST
              </span>
              {artist?.location && (
                <span className="flex items-center gap-1 font-arcade text-xs text-white/60">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  {artist.location}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="font-pixel text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
                {artistName}
              </h1>
              {artist?.is_verified && (
                <span className="font-arcade text-xs text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/40 bg-cyan-950/60 font-bold">
                  ✓ VERIFIED
                </span>
              )}
            </div>

            <p className="font-arcade text-xs text-white/50">@{artist?.handle || rawId}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 font-arcade text-xs text-white/60">
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
                className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white bg-white text-black font-pixel font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:scale-105 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                <span>Phát Tất Cả</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-full border-2 font-pixel text-xs tracking-wider transition-all cursor-pointer ${
                isFollowing
                  ? "border-emerald-400/60 bg-emerald-950/40 text-emerald-300"
                  : "border-white/20 bg-white/10 hover:border-white/40 text-white"
              }`}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isFollowing ? "ĐANG THEO DÕI" : "THEO DÕI"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2.5 pt-2">
        {tabs.map((tab) => (
          <PillFilter
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

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
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30">
                <Music className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="font-arcade text-[10px] uppercase tracking-widest text-cyan-400">
                  Popular
                </span>
                <h2 className="font-pixel text-2xl font-bold tracking-tight text-white">
                  Bài Hát Phổ Biến
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.topTracks.map((track, index) => {
                const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
                const isCurrent = String(currentTrack?.id) === String(playerTrack.id);
                const isLiked = likedIds.some((id) => String(id) === String(playerTrack.id));
                const artworkUrl =
                  track.artwork?.["480x480"] ||
                  track.artwork?.["150x150"] ||
                  avatarUrl;

                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayTrack(track, data.topTracks)}
                    className="group rounded-3xl p-3.5 border-2 border-white/15 bg-[#10121e]/90 hover:border-cyan-400/50 transition-all cursor-pointer flex items-center gap-3 select-none"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-md">
                      <Artwork
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        )}
                      </div>
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded bg-black/70 font-arcade text-[9px] text-white">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-pixel text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {track.title}
                      </h3>
                      <p className="font-arcade text-xs text-white/50 truncate tracking-wider">{artistName}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(playerTrack);
                      }}
                      className="p-1 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>
                );
              })}
              {data.topTracks.length === 0 && (
                <div className="col-span-full text-center font-arcade text-sm text-white/50 py-10">
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
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30">
                <Disc className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="font-arcade text-[10px] uppercase tracking-widest text-purple-400">
                  Discography
                </span>
                <h2 className="font-pixel text-2xl font-bold tracking-tight text-white">
                  Album & EPs
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {data.albums.map((album) => {
                const cover = album.artwork?.["480x480"] || album.artwork?.["150x150"] || avatarUrl || "";
                return (
                  <div
                    key={album.id}
                    className="group rounded-3xl p-4 border-2 border-white/15 bg-[#10121e]/90 hover:border-purple-400/50 transition-all cursor-pointer select-none space-y-2.5"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/20 shadow-lg">
                      <Artwork src={cover} alt={album.title || "Album"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div>
                      <h3 className="font-pixel text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {album.title}
                      </h3>
                      <p className="font-arcade text-xs text-white/50 truncate tracking-wider">{album.track_count || 0} bài hát</p>
                    </div>
                  </div>
                );
              })}
              {data.albums.length === 0 && (
                <div className="col-span-full text-center font-arcade text-sm text-white/50 py-10">
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
            <div className="rounded-[32px] border-2 border-white/15 bg-[#10121e]/90 p-8 shadow-xl">
              <h2 className="font-pixel text-2xl font-bold mb-4">Tiểu Sử Nghệ Sĩ</h2>
              {displayBio ? (
                <p className="font-pixel text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {displayBio}
                </p>
              ) : (
                <p className="font-arcade text-xs text-white/40">
                  Chưa có thông tin tiểu sử chi tiết cho nghệ sĩ này.
                </p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {data.relatedArtists.map((rel) => {
                const relAvatar = rel.avatarUrl || rel.profile_picture?.["480x480"] || rel.profile_picture?.["150x150"] || avatarUrl || "";
                return (
                  <Link
                    key={rel.id}
                    href={`/artist/${encodeURIComponent(rel.id)}?name=${encodeURIComponent(rel.name)}`}
                    className="group rounded-3xl p-5 border-2 border-white/15 bg-[#10121e]/90 hover:border-cyan-400/50 transition-all cursor-pointer flex flex-col items-center text-center gap-3 select-none"
                  >
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20 shadow-xl group-hover:scale-105 transition-transform">
                      <Artwork src={relAvatar} alt={rel.name} className="h-full w-full object-cover" />
                    </div>
                    <h3 className="font-pixel text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {rel.name}
                    </h3>
                  </Link>
                );
              })}
              {data.relatedArtists.length === 0 && (
                <div className="col-span-full text-center font-arcade text-sm text-white/50 py-10">
                  Chưa có nghệ sĩ tương tự.
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

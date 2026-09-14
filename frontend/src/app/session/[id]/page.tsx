"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Play,
  Pause,
  Crown,
  Search,
  Plus,
  ArrowLeft,
  Disc3,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { useAuthStore } from "@/store/useAuthStore";
import SpinningVinyl from "@/components/player/SpinningVinyl";
import { getJamendoTracks, JamendoSong } from "@/lib/api";
import Artwork from "@/components/Artwork";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReactionItem {
  id: string;
  icon: string;
  x: number; // percentage across screen 10-90%
  jitter: number; // randomized drift (vw) applied on the way up
}

interface RequesterInfo {
  name: string;
  avatar: string;
}

function makeReaction(icon: string): ReactionItem {
  return {
    id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    icon,
    x: 20 + Math.random() * 60,
    jitter: (Math.random() - 0.5) * 8,
  };
}

const randomSeed = () => `seed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function RealtimeSessionPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const currentUser = useAuthStore((s) => s.user);

  const [isHost, setIsHost] = useState(false);
  const [listenersCount, setListenersCount] = useState(1);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [currentRequester, setCurrentRequester] = useState<RequesterInfo>({
    name: "Auraic DJ",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  });

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<JamendoSong[]>([]);
  const [searching, setSearching] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set initial host if first to join
  useEffect(() => {
    const isFirstHost = localStorage.getItem(`auraic-host-${sessionId}`) === "true";
    if (isFirstHost || !localStorage.getItem(`auraic-has-host-${sessionId}`)) {
      setIsHost(true);
      localStorage.setItem(`auraic-host-${sessionId}`, "true");
      localStorage.setItem(`auraic-has-host-${sessionId}`, "true");
    }
  }, [sessionId]);

  // Realtime Supabase Channel
  useEffect(() => {
    const myId = currentUser?.id || `guest-${Math.random().toString(36).slice(2, 8)}`;
    const myName = currentUser?.name || currentUser?.email?.split("@")[0] || "Khách ẩn danh";
    const myAvatar =
      currentUser?.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${myId}`;

    const channel = supabase.channel(`session:${sessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: myId },
      },
    });

    channelRef.current = channel;

    // 1. Listen for Broadcast Events
    channel
      .on("broadcast", { event: "SYNC_PLAYBACK" }, ({ payload }) => {
        // If not host, sync playback state
        if (!isHost && payload) {
          if (payload.track) {
            const current = usePlayerStore.getState().currentTrack;
            if (!current || String(current.id) !== String(payload.track.id)) {
              usePlayerStore.getState().playTrack(payload.track);
            }
          }
          if (typeof payload.isPlaying === "boolean") {
            const storeIsPlaying = usePlayerStore.getState().isPlaying;
            if (storeIsPlaying !== payload.isPlaying) {
              usePlayerStore.getState().togglePlay();
            }
          }
          if (payload.requester) {
            setCurrentRequester(payload.requester);
          }
        }
      })
      .on("broadcast", { event: "NEW_REACTION" }, ({ payload }) => {
        if (payload?.icon) {
          const newReaction = makeReaction(payload.icon);
          setReactions((prev) => [...prev.slice(-15), newReaction]);
        }
      })
      .on("broadcast", { event: "REQUEST_SONG" }, ({ payload }) => {
        if (payload?.track) {
          if (payload.requester) {
            setCurrentRequester(payload.requester);
          }
          playTrack(payload.track);
        }
      })
      // 2. Presence Tracking
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const total = Object.keys(state).length;
        setListenersCount(Math.max(1, total));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: myId,
            name: myName,
            avatar: myAvatar,
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, isHost, currentUser, playTrack]);

  // Host Broadcasts changes
  const broadcastPlayback = (nextTrack?: Track, nextPlaying?: boolean) => {
    if (!channelRef.current || !isHost) return;

    channelRef.current.send({
      type: "broadcast",
      event: "SYNC_PLAYBACK",
      payload: {
        track: nextTrack || currentTrack,
        isPlaying: nextPlaying !== undefined ? nextPlaying : isPlaying,
        requester: currentRequester,
        timestamp: Date.now(),
      },
    });
  };

  // Floating Reaction Trigger
  const triggerReaction = (icon: string) => {
    const newReaction = makeReaction(icon);
    setReactions((prev) => [...prev.slice(-15), newReaction]);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "NEW_REACTION",
        payload: { icon },
      });
    }
  };

  // Search Jamendo to Request Song
  const handleSearchJamendo = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) return;
    setSearching(true);
    try {
      const results = await getJamendoTracks({ limit: 6, search: q });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleRequestTrack = (song: JamendoSong) => {
    const formattedTrack: Track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      image: song.image,
      audioUrl: song.audioUrl,
      duration: song.duration,
    };

    const requester: RequesterInfo = {
      name: currentUser?.name || currentUser?.email?.split("@")[0] || "Bạn nghe nhạc",
      avatar:
        currentUser?.avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed()}`,
    };

    setCurrentRequester(requester);
    playTrack(formattedTrack);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "REQUEST_SONG",
        payload: {
          track: formattedTrack,
          requester,
        },
      });
    }

    setShowRequestModal(false);
  };

  return (
    <div className="relative min-h-full overflow-hidden px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 flex flex-col items-center">
      {/* ========================================================= */}
      {/* FLOATING REACTIONS CANVAS OVERLAY                         */}
      {/* ========================================================= */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        <AnimatePresence>
          {reactions.map((rx) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: "90vh", scale: 0.5, x: `${rx.x}vw` }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: "-10vh",
                scale: [0.8, 1.4, 1.1, 1.6],
                x: `${rx.x + rx.jitter}vw`,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4.5, ease: "easeOut" }}
              className="absolute text-4xl sm:text-5xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
            >
              {rx.icon}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Session Bar */}
      <div className="w-full flex items-center justify-between py-2 z-20">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Rời phòng
        </Link>

        {/* Room badge & presence */}
        <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 ">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
            {sessionId}
          </span>
          <span className="text-white/30">•</span>
          <div className="flex items-center gap-1 text-xs text-white/70">
            <Users className="h-3.5 w-3.5" />
            <span>{listenersCount} người</span>
          </div>
          {isHost && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              <Crown className="h-3 w-3" /> Host
            </span>
          )}
        </div>

        {/* Request Track trigger */}
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-2 text-xs font-bold shadow-lg shadow-violet-600/30 transition hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Request bài hát
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. REALISTIC 3D SPINNING VINYL IN CENTER                  */}
      {/* ========================================================= */}
      <div className="relative my-8 flex flex-col items-center justify-center">
        <SpinningVinyl
          isPlaying={isPlaying}
          coverImage={currentTrack?.image}
          requesterAvatar={currentRequester.avatar}
          requesterName={currentRequester.name}
          size={330}
        />

        {/* Current Song Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center space-y-1 max-w-md px-4"
        >
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
            <Disc3 className="h-3.5 w-3.5 animate-spin" />
            <span>Đang phát đồng bộ Realtime</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight truncate">
            {currentTrack?.title || "Chưa có bài hát nào phát"}
          </h2>
          <p className="text-sm text-white/60 truncate">
            {typeof currentTrack?.artist === "object"
              ? currentTrack.artist.name
              : currentTrack?.artist || "Auraic Stream"}
          </p>
          <p className="text-xs text-white/40 pt-1">
            Yêu cầu bởi: <span className="font-semibold text-violet-300">{currentRequester.name}</span>
          </p>
        </motion.div>

        {/* Host Playback Controls */}
        {isHost && (
          <div className="mt-5 flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                togglePlay();
                broadcastPlayback(undefined, !isPlaying);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-xl"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. FLOATING REACTIONS BAR                                 */}
      {/* ========================================================= */}
      <div className="fixed bottom-24 z-30 flex items-center gap-3 rounded-full border border-white/20 bg-black/60 px-5 py-2.5  shadow-2xl">
        <span className="text-xs font-semibold text-white/50 mr-1 hidden sm:inline">
          Thả cảm xúc:
        </span>
        {[
          { icon: "❤️", label: "Yêu thích" },
          { icon: "🔥", label: "Bùng cháy" },
          { icon: "🎧", label: "Phiêu dạt" },
          { icon: "✨", label: "Tuyệt vời" },
        ].map((item) => (
          <motion.button
            key={item.icon}
            whileHover={{ scale: 1.25, y: -4 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => triggerReaction(item.icon)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
            title={item.label}
          >
            {item.icon}
          </motion.button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 4. REQUEST SONG MODAL                                     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-white/15 bg-neutral-950/90 p-6 shadow-2xl  text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Request bài hát vào đĩa than</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchJamendo(e.target.value)}
                  placeholder="Tìm kiếm bài hát từ catalog Jamendo..."
                  className="w-full rounded-2xl border border-white/15 bg-black/40 py-3 pl-10 pr-4 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Search results */}
              <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-none pt-2">
                {searching ? (
                  <p className="py-6 text-center text-xs text-white/40">Đang tìm kiếm...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handleRequestTrack(song)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-violet-400 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Artwork
                          src={song.image}
                          alt={song.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="truncate">
                          <p className="truncate text-xs font-bold text-white group-hover:text-cyan-300">
                            {song.title}
                          </p>
                          <p className="truncate text-[11px] text-white/50">
                            {typeof song.artist === "object" ? song.artist.name : song.artist}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-violet-600/30 px-3 py-1 text-[11px] font-bold text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition">
                        Request
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-white/40">
                    Nhập từ khóa để tìm bài hát muốn phát lên phòng
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

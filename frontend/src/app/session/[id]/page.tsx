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
import RetroTurntableDeck from "@/components/ui/RetroTurntableDeck";
import BlockyWaveform from "@/components/ui/BlockyWaveform";
import { StreamEngineService, AuraicAudioAdapter } from "@/lib/sound-engine/client";
import Artwork from "@/components/Artwork";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReactionItem {
  id: string;
  icon: string;
  x: number;
  jitter: number;
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

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestArtist, setRequestArtist] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const isFirstHost = localStorage.getItem(`auraic-host-${sessionId}`) === "true";
    if (isFirstHost || !localStorage.getItem(`auraic-has-host-${sessionId}`)) {
      setIsHost(true);
      localStorage.setItem(`auraic-host-${sessionId}`, "true");
      localStorage.setItem(`auraic-has-host-${sessionId}`, "true");
    }
  }, [sessionId]);

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

    channel
      .on("broadcast", { event: "SYNC_PLAYBACK" }, ({ payload }) => {
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

  const handleSearchEngine = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await StreamEngineService.searchEngineCatalog(q, 6);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleRequestTrack = (engineTrack: any) => {
    const formattedTrack: Track = AuraicAudioAdapter.toPlayerTrack(engineTrack);

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
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="relative min-h-full overflow-hidden px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 flex flex-col items-center">
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

      {/* Top 2D Status Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 py-2 z-20">
        <Link
          href="/session"
          className="inline-flex items-center gap-2 font-pixel text-xs text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> ← Rời phòng
        </Link>

        <div className="flex items-center gap-2.5 rounded-full border-2 border-white/20 bg-white/[0.06] px-4 py-1.5 shadow-md">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-pixel text-xs font-bold uppercase tracking-wider text-cyan-300">
            ROOM: {sessionId}
          </span>
          <span className="text-white/30">•</span>
          <div className="flex items-center gap-1 font-arcade text-xs text-white/80">
            <Users className="h-3.5 w-3.5" />
            <span>{listenersCount} NGƯỜI</span>
          </div>
          {isHost && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 font-arcade text-[10px] font-bold text-amber-300">
              <Crown className="h-3 w-3" /> HOST
            </span>
          )}
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-1.5 rounded-full border-2 border-white bg-white text-black px-4 py-2 font-pixel text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> REQUEST BÀI HÁT
        </button>
      </div>

      {/* 2D HARDWARE VINYL DECK HERO SYNC (MUSIC2D REFERENCE) */}
      <div className="relative my-6 flex flex-col items-center justify-center w-full max-w-xl">
        <div className="relative w-full max-w-md sm:max-w-lg">
          <RetroTurntableDeck
            isPlaying={isPlaying}
            onTogglePlay={() => {
              if (isHost) {
                togglePlay();
                broadcastPlayback(undefined, !isPlaying);
              } else {
                togglePlay();
              }
            }}
            trackTitle={currentTrack?.title || "Realtime Sync Deck"}
            artistName={
              typeof currentTrack?.artist === "object"
                ? currentTrack.artist.name
                : currentTrack?.artist || "Auraic Sound Engine"
            }
            coverImage={currentTrack?.image}
          />
        </div>

        {/* Synced Metadata & Blocky Waveform */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center space-y-2 max-w-md px-4 w-full"
        >
          <div className="inline-flex items-center gap-1.5 font-arcade text-[11px] font-bold text-cyan-300 px-3 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-950/40">
            <Disc3 className="h-3.5 w-3.5 animate-spin" />
            <span>REALTIME 33⅓ RPM SYNC</span>
          </div>

          <h2 className="font-pixel text-2xl sm:text-3xl font-black text-white tracking-tight truncate drop-shadow-md">
            {currentTrack?.title || "Chưa có bài hát nào phát"}
          </h2>

          <p className="font-arcade text-xs text-white/60 truncate tracking-wider">
            {typeof currentTrack?.artist === "object"
              ? currentTrack.artist.name
              : currentTrack?.artist || "Auraic Stream"}
          </p>

          {/* Blocky Barcode Waveform */}
          <div className="pt-2 px-6">
            <BlockyWaveform
              currentTime={114}
              duration={215}
              isPlaying={isPlaying}
              barCount={28}
              glowColor="cyan"
            />
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 font-arcade text-xs text-white/50">
            <span>Yêu cầu bởi:</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-violet-400/30 bg-violet-950/40 text-violet-300 font-pixel text-xs">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              <span>{currentRequester.name}</span>
            </div>
          </div>
        </motion.div>
      </div>

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
                  onClick={() => {
                    setShowRequestModal(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchEngine(e.target.value)}
                  placeholder="Tìm kiếm bài hát từ catalog..."
                  className="w-full rounded-2xl border border-white/15 bg-black/40 py-3 pl-10 pr-4 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

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
                          src={song.artwork?.["480x480"] || song.artwork?.["150x150"] || ""}
                          alt={song.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="truncate">
                          <p className="truncate text-xs font-bold text-white group-hover:text-cyan-300">
                            {song.title}
                          </p>
                          <p className="truncate text-[11px] text-white/50">
                            {song.user?.name || song.user?.handle || "Nghệ sĩ"}
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

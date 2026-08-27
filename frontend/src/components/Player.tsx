"use client";

import Artwork from "@/components/Artwork";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  Music,
  X,
  Heart,
  ListMusic,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { isJamendoTrackId } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";
import QueuePanel from "@/components/QueuePanel";
import AudioVisualizer from "@/components/AudioVisualizer";
import { normalizeLyrics, type LyricLine } from "@/lib/lyrics";
import Hls from "hls.js";
import { recordAnalyticsEvent, recordJamendoListening, resolveMediaUrl } from "@/lib/api";
import { getLyrics } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 24, stiffness: 180, mass: 0.8 },
  },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.2 } },
};

const pulseGlow = {
  initial: { boxShadow: "0 0 20px rgba(168, 85, 247, 0.15)" },
  animate: {
    boxShadow: [
      "0 0 20px rgba(168, 85, 247, 0.15)",
      "0 0 40px rgba(168, 85, 247, 0.35)",
      "0 0 20px rgba(168, 85, 247, 0.15)",
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export default function Player() {
  const pathname = usePathname();

  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleLike,
    likedIds,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    playbackStatus,
    playbackError,
    setPlaybackStatus,
    recordListening,
  } = usePlayerStore();

  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const isSeekingRef = useRef(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [fetchedLyrics, setFetchedLyrics] = useState<string | LyricLine[] | null>(null);
  const [fetchedPlainLyrics, setFetchedPlainLyrics] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const recordedTrackIdRef = useRef<string | number | null>(null);
  const startedTrackIdRef = useRef<string | number | null>(null);
  const completedTrackIdRef = useRef<string | number | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hlsReadyRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  const mediaUrl = resolveMediaUrl(currentTrack?.audioUrl || "");
  const isHlsSource = /\.m3u8(?:\?|$)/i.test(mediaUrl);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    setShowQueue(false);
    setShowLyrics(false);
  }, [pathname]);

  const liked = currentTrack
    ? likedIds.some((id) => String(id) === String(currentTrack.id))
    : false;

  const artistName = typeof currentTrack?.artist === "object"
    ? (currentTrack?.artist as { name: string })?.name
    : (currentTrack?.artist || "Ca sĩ chưa xác định");

  const recordPlaybackEvent = useCallback((eventType: "TRACK_STARTED" | "TRACK_COMPLETED" | "TRACK_SKIPPED") => {
    const userId = useAuthStore.getState().user?.id;
    if (!currentTrack || !userId) return;
    const position = audioRef.current && Number.isFinite(audioRef.current.currentTime) ? Math.floor(audioRef.current.currentTime) : undefined;
    const duration = typeof currentTrack.duration === "number" && Number.isFinite(currentTrack.duration) ? Math.floor(currentTrack.duration) : undefined;
    void recordAnalyticsEvent({
      eventType,
      trackId: currentTrack.id,
      source: isJamendoTrackId(currentTrack.id) ? "jamendo" : "local",
      title: currentTrack.title,
      position,
      duration,
    }).catch(() => undefined);
  }, [currentTrack]);

  const handleSkip = useCallback((direction: "next" | "previous") => {
    if (currentTrack) recordPlaybackEvent("TRACK_SKIPPED");
    if (direction === "next") nextTrack();
    else prevTrack();
  }, [currentTrack, nextTrack, prevTrack, recordPlaybackEvent]);

  useEffect(() => {
    let active = true;
    setFetchedLyrics(null);
    setFetchedPlainLyrics(null);
    if (!currentTrack) return;

    const existingLyrics = normalizeLyrics(currentTrack.lyrics);
    if (existingLyrics.length > 0) {
      setFetchedLyrics(currentTrack.lyrics ?? null);
      return;
    }
    if (typeof currentTrack.lyrics === "string" && currentTrack.lyrics.trim()) {
      setFetchedPlainLyrics(currentTrack.lyrics.trim());
      return;
    }

    void getLyrics(currentTrack.title, artistName)
      .then((response) => {
        if (!active) return;
        setFetchedLyrics(response.syncedLyrics);
        setFetchedPlainLyrics(response.plainLyrics);
      })
      .catch(() => {
        if (active) setFetchedLyrics(null);
      });

    return () => {
      active = false;
    };
  }, [currentTrack, artistName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    hlsReadyRef.current = false;
    audio.pause();
    audio.autoplay = isPlayingRef.current;
    audio.removeAttribute("src");
    audio.load();
    setCurrentTime(0);
    setDuration(typeof currentTrack.duration === "number" ? currentTrack.duration : 0);

    if (!isHlsSource) {
      audio.src = mediaUrl;
      audio.load();
      hlsReadyRef.current = true;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(mediaUrl);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hlsReadyRef.current = true;
        if (isPlayingRef.current) {
          audio.autoplay = true;
          audio.play().catch(() => setPlaybackStatus("error", "Không thể phát HLS stream"));
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }
        setPlaybackStatus("error", "Không thể tải HLS stream");
      });
      hls.attachMedia(audio);
    } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = mediaUrl;
      audio.load();
      hlsReadyRef.current = true;
    } else {
      setPlaybackStatus("error", "Trình duyệt không hỗ trợ HLS");
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      hlsReadyRef.current = false;
    };
  }, [currentTrack, isHlsSource, mediaUrl, setPlaybackStatus]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      setPlaybackStatus("loading");
      if (isPlaying && (!isHlsSource || hlsReadyRef.current)) {
        audioRef.current.play().catch(() => {
          setPlaybackStatus("error", "Không thể phát bài hát này");
        });
      } else if (!isPlaying) {
        audioRef.current.autoplay = false;
        audioRef.current.pause();
      } else {
        audioRef.current.autoplay = true;
      }

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: artistName,
          artwork: [{ src: currentTrack.image, sizes: "512x512", type: "image/png" }],
        });

        navigator.mediaSession.setActionHandler("play", togglePlay);
        navigator.mediaSession.setActionHandler("pause", togglePlay);
        navigator.mediaSession.setActionHandler("previoustrack", () => handleSkip("previous"));
        navigator.mediaSession.setActionHandler("nexttrack", () => handleSkip("next"));
      }
    }
  }, [currentTrack, isPlaying, isHlsSource, artistName, togglePlay, handleSkip, setPlaybackStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        if (audioRef.current) audioRef.current.currentTime += 5;
      } else if (e.code === "ArrowLeft") {
        if (audioRef.current) audioRef.current.currentTime -= 5;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  const LYRIC_OFFSET = 0.5;
  const lyricsSource = fetchedLyrics || fetchedPlainLyrics;
  const lyrics = normalizeLyrics(lyricsSource, duration || 200);

  const adjustedTime = currentTime + LYRIC_OFFSET;
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (lyrics[i].time <= adjustedTime) {
      activeIndex = i;
      break;
    }
  }

  useEffect(() => {
    if (showLyrics && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex, showLyrics]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;

    const updateRealtime = () => {
      if (!audio.paused && !audio.ended) {
        if (!isSeekingRef.current) {
          setCurrentTime(audio.currentTime);
        }
        animationFrameId = requestAnimationFrame(updateRealtime);
      }
    };

    const handlePlayStart = () => {
      animationFrameId = requestAnimationFrame(updateRealtime);
    };

    const handlePlayStop = () => {
      cancelAnimationFrame(animationFrameId);
    };

    audio.addEventListener("play", handlePlayStart);
    audio.addEventListener("playing", handlePlayStart);
    audio.addEventListener("pause", handlePlayStop);
    audio.addEventListener("ended", handlePlayStop);

    if (!audio.paused) {
      animationFrameId = requestAnimationFrame(updateRealtime);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      audio.removeEventListener("play", handlePlayStart);
      audio.removeEventListener("playing", handlePlayStart);
      audio.removeEventListener("pause", handlePlayStop);
      audio.removeEventListener("ended", handlePlayStop);
    };
  }, [currentTrack]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      const listeningThreshold = Math.min(30, audioRef.current.duration * 0.5 || 30);
      if (
        currentTrack &&
        audioRef.current.currentTime >= listeningThreshold &&
        recordedTrackIdRef.current !== currentTrack.id
      ) {
        recordedTrackIdRef.current = currentTrack.id;
        if (isJamendoTrackId(currentTrack.id)) {
          const userId = useAuthStore.getState().user?.id;
          if (userId) {
            const storageKey = `auraic-history-${userId}`;
            let history: Array<{ id: string; listenedAt: string; song: typeof currentTrack }> = [];
            try {
              const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
              if (Array.isArray(stored)) history = stored;
            } catch {
              history = [];
            }
            history = [{ id: `${String(currentTrack.id)}-${Date.now()}`, listenedAt: new Date().toISOString(), song: currentTrack }, ...history.filter((item) => String(item.song?.id) !== String(currentTrack.id))].slice(0, 50);
            localStorage.setItem(storageKey, JSON.stringify(history));
            window.dispatchEvent(new CustomEvent("auraic:history-updated"));
            void recordJamendoListening({
              trackId: String(currentTrack.id),
              title: currentTrack.title,
              artistName,
              image: currentTrack.image,
              audioUrl: currentTrack.audioUrl,
              ...(typeof currentTrack.duration === "number" ? { duration: currentTrack.duration } : {}),
            }).catch(() => undefined);
          }
        } else {
          void recordListening(currentTrack.id);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
      setPlaybackStatus("paused");
    }
  };

  const handleCanPlay = () => {
    setPlaybackStatus(isPlaying ? "playing" : "paused");
    if (isPlaying && isHlsSource && audioRef.current?.paused) {
      audioRef.current.play().catch(() => setPlaybackStatus("error", "Không thể phát HLS stream"));
    }
  };
  const handlePlaying = () => {
    setPlaybackStatus("playing");
    if (currentTrack && startedTrackIdRef.current !== currentTrack.id) {
      startedTrackIdRef.current = currentTrack.id;
      recordPlaybackEvent("TRACK_STARTED");
    }
  };
  const handleWaiting = () => setPlaybackStatus("buffering");
  const handlePause = () => {
    if (audioRef.current && !audioRef.current.ended) setPlaybackStatus("paused");
  };
  const fallbackTriedRef = useRef<string | number | null>(null);

  const handleAudioError = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      setPlaybackStatus("error", "Không thể tải file âm thanh");
      return;
    }

    const trackIdStr = String(currentTrack.id);
    const rawId = trackIdStr.replace(/^jamendo:/, "");

    if (isJamendoTrackId(currentTrack.id) && fallbackTriedRef.current !== currentTrack.id) {
      fallbackTriedRef.current = currentTrack.id;
      const fallbackUrl = `https://mp3d.jamendo.com/download/track/${rawId}/mp32/`;
      audio.src = fallbackUrl;
      audio.load();
      audio.play().catch(() => {
        setPlaybackStatus("error", "Bài hát không khả dụng, đang chuyển tiếp...");
        setTimeout(() => nextTrack(), 1200);
      });
      return;
    }

    setPlaybackStatus("error", "Bài hát không khả dụng, đang chuyển bài...");
    setTimeout(() => {
      nextTrack();
    }, 1200);
  };

  const handleEnded = () => {
    if (currentTrack && completedTrackIdRef.current !== currentTrack.id) {
      completedTrackIdRef.current = currentTrack.id;
      recordPlaybackEvent("TRACK_COMPLETED");
    }
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      nextTrack();
    }
  };

  const handleSeekInput = (e: React.FormEvent<HTMLInputElement>) => {
    const val = Number((e.target as HTMLInputElement).value);
    isSeekingRef.current = true;
    setIsSeeking(true);
    setSeekValue(val);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current && Number.isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    isSeekingRef.current = false;
    setIsSeeking(false);
    setSeekValue(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const displayTime = isSeeking && seekValue !== null ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleLyricClick = (time: number) => {
    if (audioRef.current && Number.isFinite(time)) {
      audioRef.current.currentTime = Math.max(0, time);
      setCurrentTime(time);
      if (!isPlaying) togglePlay();
    }
  };

  if (!currentTrack) {
    return (
      <motion.div
        className="px-4 pb-4 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="glass-panel-strong flex h-20 items-center justify-center px-6 w-full rounded-[28px] border-dashed z-50 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-cyan-500/5 to-fuchsia-500/10"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-auraic-text-muted text-sm flex items-center gap-2 relative z-10">
            <Music className="w-4 h-4 animate-pulse text-fuchsia-400" /> Vui lòng chọn một bài hát để bắt đầu
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

      {showLyrics && (
        <motion.div
          className="fixed inset-0 bottom-28 z-40 flex flex-col items-center justify-center overflow-hidden rounded-t-[32px] border-t border-auraic-border bg-[#080810]/95 p-6 shadow-2xl backdrop-blur-3xl transition-all duration-500 sm:p-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 24, stiffness: 180 }}
        >
          <Artwork
            src={currentTrack.image}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-3xl transition-all duration-1000"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black" />

          <motion.button
            onClick={() => setShowLyrics(false)}
            className="absolute top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-auraic-border bg-white/10 px-4 py-2 text-xs font-bold text-white/70 shadow-lg backdrop-blur-md transition-all hover:border-auraic-border-strong hover:bg-white/20 hover:text-white cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" /> Đóng Karaoke
          </motion.button>

          {lyrics.length > 0 ? (
            <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 text-left lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
              <div className="hidden self-center lg:block">
                <div className="relative group">
                  <motion.div
                    className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-30 blur-2xl"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <Artwork
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    className="relative aspect-square w-full rounded-3xl object-cover shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-auraic-border"
                  />
                </div>
                <div className="mt-6">
                  <h2 className="truncate text-2xl font-black tracking-tight text-white">{currentTrack.title}</h2>
                  <p className="mt-1 truncate text-base font-medium text-white/60">{artistName}</p>
                </div>
              </div>

              <div className="relative max-h-[68vh] overflow-y-auto px-4 py-16 text-left scrollbar-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
                <div className="space-y-6 sm:space-y-7">
                  {lyrics.map((line, index) => {
                    const isCurrent = index === activeIndex;
                    const isPassed = index < activeIndex;

                    return (
                      <motion.div
                        key={index}
                        ref={isCurrent ? activeLyricRef : null}
                        onClick={() => handleLyricClick(line.time)}
                        className={`cursor-pointer select-none transition-all duration-300 py-1 ${
                          isCurrent
                            ? "opacity-100 text-white"
                            : isPassed
                            ? "opacity-35 text-white hover:opacity-75 hover:translate-x-1"
                            : "opacity-20 text-white hover:opacity-65 hover:translate-x-1"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <h2
                          className={`text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[34px] transition-colors duration-300 ${
                            isCurrent
                              ? "font-extrabold text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.45)]"
                              : ""
                          }`}
                        >
                          {line.text}
                        </h2>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex h-[min(78vh,720px)] w-full max-w-[1400px] items-center justify-center overflow-hidden rounded-[32px] border border-auraic-border bg-[#080810] p-7 shadow-[0_0_120px_rgba(168,85,247,0.3)] sm:p-12">
              <Artwork src={currentTrack.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.22),transparent_42%),linear-gradient(180deg,rgba(5,5,12,0.35),rgba(5,5,12,0.96))]" />
              <div className="relative grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 lg:grid-cols-[280px_minmax(320px,1fr)_300px] lg:gap-16">
                <div className="hidden self-start lg:block">
                  <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 opacity-30 blur-2xl"
                      animate={{ opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <Artwork src={currentTrack.image} alt={currentTrack.title} className="aspect-square w-full rounded-2xl object-cover shadow-[0_0_55px_rgba(217,140,255,0.28)]" />
                  </motion.div>
                  <h2 className="mt-5 truncate text-xl font-bold text-white">{currentTrack.title}</h2>
                  <p className="mt-1 truncate text-sm text-white/50">{artistName}</p>
                  <div className="mt-5 flex gap-2 text-white/50">
                    <motion.button type="button" onClick={() => toggleLike(currentTrack)} aria-label={liked ? "Bỏ thích" : "Yêu thích"} className="flex h-10 w-10 items-center justify-center rounded-xl border border-auraic-border bg-white/[0.04] transition hover:border-fuchsia-300/50 hover:text-fuchsia-200" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Heart className={`h-4 w-4 ${liked ? "fill-pink-400 text-pink-400" : ""}`} />
                    </motion.button>
                    <TrackActionMenu track={currentTrack} placement="up" />
                  </div>
                </div>
                <div className="relative flex flex-col items-center text-center">
                  <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-200/75">Instrumental atmosphere</p>
                  <div className="relative aspect-square w-[min(58vw,300px)]">
                    <motion.div
                      className="absolute inset-[-12%] rounded-full bg-fuchsia-500/25 blur-3xl"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_25%,#34304f_0,#11111d_42%,#030308_72%)] shadow-[0_0_60px_rgba(217,140,255,0.45)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-[8%] h-[84%] w-[84%] rounded-full object-cover"
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    >
                      <Artwork src={currentTrack.image} alt={currentTrack.title} className="h-full w-full rounded-full object-cover" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-[43%] rounded-full border-4 border-[#11111d] bg-gradient-to-br from-fuchsia-300 to-cyan-300 shadow-[0_0_18px_rgba(217,140,255,0.8)]"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="mt-9 flex h-20 items-center gap-1.5" aria-label="Audio visualizer">
                    {[24, 44, 68, 36, 58, 76, 46, 64, 32, 54, 72, 40, 60, 28].map((height, index) => (
                      <motion.span
                        key={index}
                        className="w-1.5 rounded-full bg-gradient-to-t from-cyan-300 to-fuchsia-400 shadow-[0_0_12px_rgba(217,140,255,0.7)]"
                        style={{ height: `${height}%` }}
                        animate={isPlaying ? { scaleY: [0.4, 1, 0.6, 1, 0.8] } : { scaleY: 0.3 }}
                        transition={
                          isPlaying
                            ? { duration: 0.7 + (index % 4) * 0.12, repeat: Infinity, ease: "easeInOut", delay: index * 0.05 }
                            : { duration: 0.3 }
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-200 shadow-[0_0_30px_rgba(217,140,255,0.25)] lg:mx-0">
                    <Music className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">This track is instrumental</h2>
                  <p className="mt-4 text-base leading-7 text-white/55">No lyrics available for this song.<br />Feel the vibe and let the music speak for itself.</p>
                </div>
                <div className="text-center lg:hidden">
                  <h2 className="truncate text-xl font-bold text-white">{currentTrack.title}</h2>
                  <p className="mt-1 text-sm text-white/50">{artistName}</p>
                </div>
                <span className="sr-only">No synced lyrics available</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        className="relative z-50 w-full px-3 pb-3 sm:px-4 sm:pb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="relative flex min-h-28 w-full flex-col items-center justify-between overflow-visible rounded-[28px] border border-auraic-border bg-auraic-surface/80 px-4 py-3 backdrop-blur-2xl md:min-h-24 md:flex-row md:px-6 md:py-2"
          {...pulseGlow}
          animate={isPlaying ? "animate" : "initial"}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/10 opacity-80 mix-blend-screen" />

          <audio
            ref={audioRef}
            src={isHlsSource ? undefined : mediaUrl}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onPlaying={handlePlaying}
            onWaiting={handleWaiting}
            onPause={handlePause}
            onError={handleAudioError}
            onEnded={handleEnded}
          />
          <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />

          {/* LEFT: Track Info */}
          <div className="relative z-10 mb-2 flex min-w-0 w-full items-center gap-3 md:mb-0 md:w-1/3">
            <motion.div
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border border-auraic-border-strong shadow-[0_0_24px_rgba(192,100,255,0.28)] transition-all duration-500 ${isPlaying ? 'scale-[1.03]' : ''}`}
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <Artwork src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
            </motion.div>
            <div className="min-w-0 max-w-[min(48vw,260px)] flex-none truncate pr-1 sm:max-w-[220px]">
              <h4 className="text-sm font-bold text-white tracking-wide drop-shadow-md truncate">{currentTrack.title}</h4>
              <p className="text-xs text-white/50 mt-0.5 truncate">{artistName}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <motion.button
                onClick={() => toggleLike(currentTrack)}
                className="text-white/40 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                title={liked ? "Bỏ thích" : "Yêu thích"}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className={`w-5 h-5 transition-transform ${liked ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : ""}`} />
              </motion.button>

              <TrackActionMenu track={currentTrack} placement="up" />
            </div>
          </div>

          {/* CENTER: Controls & Waveform */}
          <div className="relative z-10 flex w-full max-w-[430px] flex-col items-center">
            <div className="mb-1 flex items-center gap-7">
              <motion.button
                onClick={toggleShuffle}
                className={`transition-all p-1 cursor-pointer ${isShuffle ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-white/40 hover:text-white'}`}
                title={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Shuffle className="w-4 h-4" />
              </motion.button>

              <motion.button onClick={() => handleSkip("previous")} className="text-white/60 hover:text-white transition-all cursor-pointer" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <SkipBack className="w-5 h-5 fill-current" />
              </motion.button>

              <motion.button
                onClick={togglePlay}
                aria-label={isPlaying ? "Tạm dừng" : "Phát"}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-white to-fuchsia-100 shadow-[0_0_26px_rgba(217,140,255,0.55)] transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
              </motion.button>

              <motion.button onClick={() => handleSkip("next")} className="text-white/60 hover:text-white transition-all cursor-pointer" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <SkipForward className="w-5 h-5 fill-current" />
              </motion.button>

              <motion.button
                onClick={toggleRepeat}
                className={`transition-all p-1 cursor-pointer ${repeatMode !== 'off' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-white/40 hover:text-white'}`}
                title={repeatMode === "off" ? "Bật lặp lại tất cả" : repeatMode === "all" ? "Bật lặp lại 1 bài" : "Tắt lặp lại"}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </motion.button>
            </div>

            <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
              <span>{formatTime(displayTime)}</span>
              <div className="flex-1 relative flex items-center group py-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={displayTime}
                  onInput={handleSeekInput}
                  onChange={handleSeekChange}
                  className="absolute w-full h-2 opacity-0 z-20 cursor-pointer"
                />
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="relative h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <motion.div
                  className="w-3.5 h-3.5 bg-white rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.8)] ring-2 ring-white/30"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
            {playbackStatus === "error" ? (
              <span className="mt-1 text-[10px] text-rose-300">{playbackError || "Lỗi phát nhạc"}</span>
            ) : null}
          </div>

          {/* RIGHT: Shortcuts & Volume */}
          <div className="relative z-10 hidden w-1/3 items-center justify-end gap-3 text-white/50 md:flex">
            <motion.button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`transition-all p-2 rounded-full cursor-pointer ${showLyrics ? 'text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'hover:text-white'}`}
              title="Bật/Tắt Lời bài hát"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mic2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={() => setShowQueue(!showQueue)}
              className={`transition-all p-2 rounded-full cursor-pointer ${showQueue ? 'text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'hover:text-white'}`}
              title="Hàng chờ phát nhạc"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <ListMusic className="w-4 h-4" />
            </motion.button>

            <div className="flex items-center gap-2 group">
              <motion.button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="cursor-pointer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 hover:text-white transition-all" />}
              </motion.button>
              <div className="w-20 relative flex items-center py-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute w-full h-1 opacity-0 z-10 cursor-pointer"
                />
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-white/80 rounded-full transition-all"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </>
  );
}

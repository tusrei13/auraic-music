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
  Heart,
  ListMusic,
  Radio,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { isJamendoTrackId } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";
import QueueDrawer from "@/components/player/QueueDrawer";
import AudioVisualizer from "@/components/AudioVisualizer";
import Hls from "hls.js";
import { recordAnalyticsEvent, recordJamendoListening, resolveMediaUrl } from "@/lib/api";
import { useAdaptiveGraphics } from "@/hooks/useAdaptiveGraphics";
import LyricsViewModal from "@/components/player/LyricsViewModal";

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
  initial: { opacity: 0.4 },
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export default function Player() {
  const pathname = usePathname();
  const { quality } = useAdaptiveGraphics();
  const isLowPower = quality === "low";

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
    crossfadeEnabled,
    crossfadeDuration,
    toggleCrossfade,
  } = usePlayerStore();

  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const isSeekingRef = useRef(false);
  const [showQueue, setShowQueue] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;

    const updateRealtime = () => {
      if (!audio.paused && !audio.ended) {
        if (!isSeekingRef.current) {
          const now = audio.currentTime;
          // Functional update bails out unless time moved ~1/12s, avoiding a
          // full 60fps re-render of the player tree.
          setCurrentTime((prev) => (Math.abs(prev - now) >= 0.08 ? now : prev));
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
      audioRef.current.play().catch(() => { });
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

  if (!currentTrack) {
    return (
      <motion.div
        className="w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative flex h-20 items-center justify-center px-6 w-full rounded-[30px] border border-white/15 bg-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.18)] backdrop-blur-xl overflow-hidden">
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/15 via-cyan-400/10 to-violet-500/15 opacity-60 blur-xl pointer-events-none"
            animate={{ x: ["-40%", "40%", "-40%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 flex items-center gap-3 text-xs font-semibold text-white/70">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 shadow-[0_0_15px_rgba(192,100,255,0.4)]">
              <Music className="w-4 h-4 animate-pulse" />
            </div>
            <span>Khám phá và chọn bài hát từ thư viện để bắt đầu hành trình âm thanh Spatial 3D</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <QueueDrawer isOpen={showQueue} onClose={() => setShowQueue(false)} />
      <LyricsViewModal
        currentTime={currentTime}
        onSeek={(time) => {
          if (audioRef.current && Number.isFinite(time)) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
          }
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative z-50"
      >
        <motion.div
          className="relative flex min-h-24 w-full flex-col items-center justify-between overflow-visible rounded-[30px] border border-white/15 bg-[#0f111c]/92 px-4 py-3 shadow-[0_25px_65px_-8px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.22)] backdrop-blur-lg md:min-h-20 md:flex-row md:px-6 md:py-2.5 transform-gpu will-change-transform"
          {...pulseGlow}
          animate={isPlaying ? "animate" : "initial"}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Pulse aura — static box-shadow composited once; only opacity animates. */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[36px] will-change-transform"
            style={{ boxShadow: "0 0 20px rgba(168, 85, 247, 0.18), 0 0 42px rgba(168, 85, 247, 0.35)" }}
          />

          {/* Subtle Ambient Bleed Overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/10 opacity-70 mix-blend-screen" />

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

          {/* LEFT: Track Info with Rotating Vinyl & Equalizer Aura */}
          <div className="relative z-10 mb-2 flex min-w-0 w-full items-center gap-3.5 md:mb-0 md:w-1/3">
            {/* Vinyl Record & Concentric Equalizer Aura Rings */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              {isPlaying && !isLowPower && (
                <>
                  <span className="pointer-events-none absolute h-14 w-14 rounded-full border border-fuchsia-400/50 equalizer-aura-pulse" />
                  <span className="pointer-events-none absolute h-18 w-18 rounded-full border border-cyan-400/35 equalizer-aura-pulse [animation-delay:0.8s]" />
                  <span className="pointer-events-none absolute h-22 w-22 rounded-full border border-violet-400/25 equalizer-aura-pulse [animation-delay:1.6s]" />
                </>
              )}

              {/* Ambient Glow behind the Vinyl */}
              <div
                className="absolute -inset-1 rounded-full opacity-60 blur-md transition-opacity duration-500"
                style={{
                  background: isPlaying
                    ? "radial-gradient(circle, var(--auraic-accent, #a855f7) 0%, transparent 70%)"
                    : "none",
                }}
              />

              {/* Rotating Vinyl Record */}
              <motion.div
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-black shadow-[0_0_24px_rgba(168,85,247,0.45)] transition-transform duration-500 ${
                  isPlaying && !isLowPower ? "scale-105" : ""
                }`}
                animate={isPlaying && !isLowPower ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                {/* Vinyl Grooves Texture */}
                <div className="pointer-events-none absolute inset-0 z-10 rounded-full bg-[radial-gradient(circle,transparent_28%,rgba(255,255,255,0.1)_30%,transparent_32%,rgba(255,255,255,0.08)_48%,transparent_50%,rgba(255,255,255,0.08)_68%,transparent_70%)]" />
                {/* Vinyl Specular Gloss */}
                <div className="pointer-events-none absolute inset-0 z-10 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                {/* Center Spindle Hole */}
                <div className="absolute inset-[40%] z-20 rounded-full border border-neutral-900 bg-neutral-200 shadow-inner" />
                <Artwork
                  src={currentTrack.image}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>

            <div className="min-w-0 max-w-[min(48vw,260px)] flex-none truncate pr-1 sm:max-w-[220px]">
              <h4 className="text-sm font-bold text-white tracking-wide drop-shadow-md truncate">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-white/60 mt-0.5 truncate">{artistName}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <motion.button
                onClick={() => toggleLike(currentTrack)}
                className="text-white/40 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                title={liked ? "Bỏ thích" : "Yêu thích"}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart
                  className={`w-5 h-5 transition-transform ${
                    liked
                      ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                      : ""
                  }`}
                />
              </motion.button>

              <TrackActionMenu track={currentTrack} placement="up" />
            </div>
          </div>

          {/* CENTER: Controls & Neon Tube Seek-Bar */}
          <div className="relative z-10 flex w-full max-w-[450px] flex-col items-center">
            <div className="mb-1 flex items-center gap-7">
              <motion.button
                onClick={toggleShuffle}
                className={`transition-all p-1 cursor-pointer ${
                  isShuffle
                    ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                    : "text-white/40 hover:text-white"
                }`}
                title={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Shuffle className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={toggleCrossfade}
                className={`transition-all p-1 cursor-pointer ${
                  crossfadeEnabled
                    ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : "text-white/40 hover:text-white"
                }`}
                title={`Crossfade ${crossfadeEnabled ? "bật" : "tắt"} (${crossfadeDuration}s)`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Radio className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={() => handleSkip("previous")}
                className="text-white/60 hover:text-white transition-all cursor-pointer"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </motion.button>

              <motion.button
                onClick={togglePlay}
                aria-label={isPlaying ? "Tạm dừng" : "Phát"}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-white via-neutral-100 to-fuchsia-100 shadow-[0_0_28px_rgba(255,255,255,0.6),0_0_15px_rgba(168,85,247,0.4)] transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-black text-black" />
                ) : (
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                )}
              </motion.button>

              <motion.button
                onClick={() => handleSkip("next")}
                className="text-white/60 hover:text-white transition-all cursor-pointer"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </motion.button>

              <motion.button
                onClick={toggleRepeat}
                className={`transition-all p-1 cursor-pointer ${
                  repeatMode !== "off"
                    ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                    : "text-white/40 hover:text-white"
                }`}
                title={
                  repeatMode === "off"
                    ? "Bật lặp lại tất cả"
                    : repeatMode === "all"
                    ? "Bật lặp lại 1 bài"
                    : "Tắt lặp lại"
                }
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </motion.button>
            </div>

            {/* NEON TUBE TIMELINE SEEK-BAR */}
            <div className="flex items-center gap-3 w-full text-[10px] font-mono text-white/55">
              <span>{formatTime(displayTime)}</span>
              <div className="flex-1 relative flex items-center group py-2.5">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={displayTime}
                  onInput={handleSeekInput}
                  onChange={handleSeekChange}
                  className="absolute w-full h-3 opacity-0 z-20 cursor-pointer"
                />
                {/* Neon Tube Grooved Track */}
                <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-white/10">
                  {/* Neon Radiant Progress — scaleX on a full-width layer avoids reflow. */}
                  <div
                    className="relative h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 shadow-[0_0_14px_rgba(168,85,247,0.9),0_0_24px_rgba(6,182,212,0.6)] will-change-transform"
                    style={{ transform: `translate3d(0, 0, 0) scaleX(${progressPercent / 100})` }}
                  />
                </div>
                {/* Neon Tube Glowing Bead */}
                <div
                  className="w-4 h-4 bg-white rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_14px_rgba(255,255,255,1),0_0_22px_rgba(168,85,247,0.9)] ring-2 ring-violet-400 will-change-transform"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
            {playbackStatus === "error" ? (
              <span className="mt-1 text-[10px] text-rose-300">
                {playbackError || "Lỗi phát nhạc"}
              </span>
            ) : null}
          </div>

          {/* RIGHT: Shortcuts & Volume */}
          <div className="relative z-10 hidden w-1/3 items-center justify-end gap-3 text-white/50 md:flex">
            <motion.button
              onClick={() => usePlayerStore.getState().toggleLyrics()}
              className={`transition-all p-2 rounded-full cursor-pointer ${
                usePlayerStore.getState().isLyricsOpen
                  ? "text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/30"
                  : "hover:text-white hover:bg-white/5"
              }`}
              title="Bật/Tắt Lời bài hát"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mic2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={() => setShowQueue(!showQueue)}
              className={`transition-all p-2 rounded-full cursor-pointer ${
                showQueue
                  ? "text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/30"
                  : "hover:text-white hover:bg-white/5"
              }`}
              title="Hàng chờ phát nhạc"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <ListMusic className="w-4 h-4" />
            </motion.button>

            {/* Bitrate Badge as shown in reference */}
            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-white/70 bg-white/5 border border-white/10 select-none">
              {isJamendoTrackId(currentTrack.id) ? "320 kbps" : "128 kbps"}
            </span>

            <div className="flex items-center gap-2.5 group">
              <motion.button
                onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                className="cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 hover:text-white transition-all" />
                )}
              </motion.button>
              <div className="w-20 relative flex items-center py-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute w-full h-2 opacity-0 z-10 cursor-pointer"
                />
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div
                    className="h-full origin-left bg-gradient-to-r from-violet-400 to-cyan-300 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)] will-change-transform"
                    style={{ transform: `translate3d(0, 0, 0) scaleX(${volume})` }}
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

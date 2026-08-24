"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  ListMusic 
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
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [fetchedLyrics, setFetchedLyrics] = useState<string | LyricLine[] | null>(null);
  const [fetchedPlainLyrics, setFetchedPlainLyrics] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeLyricRef = useRef<HTMLHeadingElement>(null);
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

  // Tự động đóng Queue và Karaoke khi chuyển trang
  useEffect(() => {
    setShowQueue(false);
    setShowLyrics(false);
  }, [pathname]);

  // So sánh ID an toàn
  const liked = currentTrack 
    ? likedIds.some((id) => String(id) === String(currentTrack.id)) 
    : false;

  // Lấy tên ca sĩ an toàn
  const artistName = typeof currentTrack?.artist === "object" 
    ? (currentTrack?.artist as { name: string })?.name 
    : (currentTrack?.artist || "Ca sĩ chưa xác định");

  const recordPlaybackEvent = (eventType: "TRACK_STARTED" | "TRACK_COMPLETED" | "TRACK_SKIPPED") => {
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
  };

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
  }, [currentTrack?.id, currentTrack?.title, artistName]);

  // 1. Cập nhật âm lượng
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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

  // 2. Đồng bộ Phát/Tạm dừng & Media Session API
  useEffect(() => {
    recordedTrackIdRef.current = null;
    startedTrackIdRef.current = null;
    completedTrackIdRef.current = null;
  }, [currentTrack?.id]);

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
  }, [currentTrack, isPlaying, isHlsSource, artistName, togglePlay, prevTrack, nextTrack, setPlaybackStatus]);

  // 3. Phím tắt Bàn phím
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

  // 4. Auto-scroll cho Karaoke Lyrics
  useEffect(() => {
    if (showLyrics && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime, showLyrics]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  const handleAudioError = () => setPlaybackStatus("error", "Không thể tải file âm thanh");

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

  const handleSkip = (direction: "next" | "previous") => {
    if (currentTrack) recordPlaybackEvent("TRACK_SKIPPED");
    if (direction === "next") nextTrack();
    else prevTrack();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const lyrics = normalizeLyrics(fetchedLyrics);
  const plainLyrics = fetchedPlainLyrics?.trim() || null;

  if (!currentTrack) {
    return (
      <div className="px-4 pb-4 w-full">
        <div className="h-20 bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center px-6 w-full rounded-3xl border-dashed shadow-lg z-50 relative">
          <p className="text-white/40 text-sm flex items-center gap-2">
            <Music className="w-4 h-4 animate-pulse"/> Vui lòng chọn một bài hát để bắt đầu
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HÀNG CHỜ PHÁT NHẠC */}
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

      {/* KARAOKE OVERLAY */}
      {showLyrics && (
        <div className="fixed inset-0 bottom-28 z-40 flex flex-col items-center justify-center rounded-t-3xl border-t border-white/10 bg-black p-8 shadow-2xl transition-all duration-300">
          <button 
            onClick={() => setShowLyrics(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <X className="w-4 h-4" /> Đóng Karaoke
          </button>
          
          {lyrics.length > 0 ? (
            <div className="grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-4 text-left lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-20">
              <div className="hidden self-start lg:block">
                <img src={currentTrack.image} alt={currentTrack.title} className="aspect-square w-full rounded-3xl object-cover shadow-[0_0_90px_rgba(217,140,255,0.35)]" />
                <h2 className="mt-5 truncate text-xl font-bold text-white">{currentTrack.title}</h2>
                <p className="mt-1 truncate text-sm text-white/50">{artistName}</p>
              </div>
              <div className="max-h-[68vh] space-y-6 overflow-y-auto px-2 pb-8 text-center scrollbar-none sm:space-y-8 lg:text-left">
                {lyrics.map((line, index) => {
                  const isPassed = currentTime >= line.time;
                  const isCurrent = isPassed && (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time);

                  return (
                    <h2
                      key={index}
                      ref={isCurrent ? activeLyricRef : null}
                      className={`text-2xl font-extrabold transition-all duration-300 sm:text-4xl ${
                        isCurrent
                          ? "scale-[1.03] text-white drop-shadow-[0_0_25px_rgba(99,102,241,0.8)]"
                          : isPassed
                          ? "text-white/40"
                          : "text-white/15"
                      }`}
                    >
                      {line.text}
                    </h2>
                  );
                })}
              </div>
            </div>
          ) : plainLyrics ? (
            <div className="grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-4 text-left lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-20">
              <div className="hidden self-start lg:block">
                <img src={currentTrack.image} alt={currentTrack.title} className="aspect-square w-full rounded-3xl object-cover shadow-[0_0_90px_rgba(217,140,255,0.35)]" />
                <h2 className="mt-5 truncate text-xl font-bold text-white">{currentTrack.title}</h2>
                <p className="mt-1 truncate text-sm text-white/50">{artistName}</p>
              </div>
              <div className="max-h-[68vh] overflow-y-auto px-2 pb-8 text-center scrollbar-none lg:text-left">
                <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/70">Lyrics</p>
                <div className="whitespace-pre-line text-2xl font-bold leading-[1.8] text-white/85 sm:text-4xl sm:leading-[1.7]">{plainLyrics}</div>
                <p className="mt-10 text-xs text-white/35">Lyrics are not synced to playback</p>
              </div>
            </div>
          ) : (
            <div className="relative flex h-[min(78vh,720px)] w-full max-w-[1400px] items-center justify-center overflow-hidden rounded-[32px] border border-white/15 bg-[#080810] p-7 shadow-[0_0_120px_rgba(168,85,247,0.3)] sm:p-12">
              <img src={currentTrack.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.22),transparent_42%),linear-gradient(180deg,rgba(5,5,12,0.35),rgba(5,5,12,0.96))]" />
              <div className="relative grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 lg:grid-cols-[280px_minmax(320px,1fr)_300px] lg:gap-16">
                <div className="hidden self-start lg:block">
                  <img src={currentTrack.image} alt={currentTrack.title} className="aspect-square w-full rounded-2xl object-cover shadow-[0_0_55px_rgba(217,140,255,0.28)]" />
                  <h2 className="mt-5 truncate text-xl font-bold text-white">{currentTrack.title}</h2>
                  <p className="mt-1 truncate text-sm text-white/50">{artistName}</p>
                  <div className="mt-5 flex gap-2 text-white/50">
                    <button type="button" onClick={() => toggleLike(currentTrack)} aria-label={liked ? "Bỏ thích" : "Yêu thích"} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-fuchsia-300/50 hover:text-fuchsia-200"><Heart className={`h-4 w-4 ${liked ? "fill-pink-400 text-pink-400" : ""}`} /></button>
                    <TrackActionMenu track={currentTrack} placement="up" />
                  </div>
                </div>
                <div className="relative flex flex-col items-center text-center">
                  <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-200/75">Instrumental atmosphere</p>
                  <div className="relative aspect-square w-[min(58vw,300px)]">
                  <div className="absolute inset-[-12%] rounded-full bg-fuchsia-500/25 blur-3xl" />
                  <div className="absolute inset-0 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_25%,#34304f_0,#11111d_42%,#030308_72%)] shadow-[0_0_60px_rgba(217,140,255,0.45)]" />
                  <img src={currentTrack.image} alt={currentTrack.title} className={`absolute inset-[8%] h-[84%] w-[84%] rounded-full object-cover ${isPlaying ? "animate-[spin_12s_linear_infinite]" : ""}`} />
                  <div className="absolute inset-[43%] rounded-full border-4 border-[#11111d] bg-gradient-to-br from-fuchsia-300 to-cyan-300 shadow-[0_0_18px_rgba(217,140,255,0.8)]" />
                  </div>
                  <div className="mt-9 flex h-20 items-center gap-1.5" aria-label="Audio visualizer">
                  {[24, 44, 68, 36, 58, 76, 46, 64, 32, 54, 72, 40, 60, 28].map((height, index) => <span key={index} className="w-1.5 rounded-full bg-gradient-to-t from-cyan-300 to-fuchsia-400 shadow-[0_0_12px_rgba(217,140,255,0.7)]" style={{ height: `${height}%`, animation: isPlaying ? `pulse ${0.7 + (index % 4) * 0.12}s ease-in-out infinite alternate` : undefined }} />)}
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-200 shadow-[0_0_30px_rgba(217,140,255,0.25)] lg:mx-0"><Music className="h-7 w-7" /></div>
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
        </div>
      )}

      {/* PLAYER CONTAINER CHÍNH */}
      <div className="relative z-50 w-full px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="relative flex min-h-28 w-full flex-col items-center justify-between overflow-visible rounded-[24px] border border-white/20 bg-[#11101d]/80 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:min-h-24 md:flex-row md:px-6 md:py-2">
          
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/10 opacity-80 mix-blend-screen"></div>

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

          {/* BÊN TRÁI: THÔNG TIN BÀI HÁT */}
          <div className="relative z-10 mb-2 flex min-w-0 w-full items-center gap-3 md:mb-0 md:w-1/3">
            <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/25 shadow-[0_0_24px_rgba(192,100,255,0.28)] transition-all duration-500 ${isPlaying ? 'scale-[1.03]' : ''}`}>
              <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 max-w-[min(48vw,260px)] flex-none truncate pr-1 sm:max-w-[220px]">
              <h4 className="text-sm font-bold text-white tracking-wide drop-shadow-md truncate">{currentTrack.title}</h4>
              <p className="text-xs text-white/50 mt-0.5 truncate">{artistName}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => toggleLike(currentTrack)}
                className="text-white/40 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                title={liked ? "Bỏ thích" : "Yêu thích"}
              >
                <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${liked ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : ""}`} />
              </button>

              <TrackActionMenu track={currentTrack} placement="up" />
            </div>
          </div>

          {/* Ở GIỮA: NÚT ĐIỀU KHIỂN & THANH TIẾN TRÌNH */}
          <div className="relative z-10 flex w-full max-w-[430px] flex-col items-center">
            <div className="mb-1 flex items-center gap-7">
              <button 
                onClick={toggleShuffle} 
                className={`transition-all p-1 cursor-pointer ${isShuffle ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-white/40 hover:text-white'}`}
                title={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              <button onClick={() => handleSkip("previous")} className="text-white/60 hover:text-white transition-all cursor-pointer">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              
              <button onClick={togglePlay} aria-label={isPlaying ? "Tạm dừng" : "Phát"} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-white to-fuchsia-100 shadow-[0_0_26px_rgba(217,140,255,0.55)] transition-transform hover:scale-105">
                {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
              </button>
              
              <button onClick={() => handleSkip("next")} className="text-white/60 hover:text-white transition-all cursor-pointer">
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button 
                onClick={toggleRepeat} 
                className={`transition-all p-1 cursor-pointer ${repeatMode !== 'off' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-white/40 hover:text-white'}`}
                title={repeatMode === "off" ? "Bật lặp lại tất cả" : repeatMode === "all" ? "Bật lặp lại 1 bài" : "Tắt lặp lại"}
              >
                {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 relative flex items-center group py-1">
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={handleSeek}
                  className="absolute w-full h-1 opacity-0 z-10 cursor-pointer"
                />
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="relative h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 transition-all duration-75"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div 
                  className="w-3.5 h-3.5 bg-white rounded-full absolute -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md"
                  style={{ left: `${progressPercent}%` }}
                ></div>
              </div>
              <span>{formatTime(duration)}</span>
            </div>
            {playbackStatus === "error" ? (
              <span className="mt-1 text-[10px] text-rose-300">{playbackError || "Lỗi phát nhạc"}</span>
            ) : null}
          </div>

          {/* BÊN PHẢI: PHÍM TẮT & ÂM LƯỢNG */}
          <div className="relative z-10 hidden w-1/3 items-center justify-end gap-3 text-white/50 md:flex">
            <button 
              onClick={() => setShowLyrics(!showLyrics)} 
              className={`transition-all p-2 rounded-full cursor-pointer ${showLyrics ? 'text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'hover:text-white'}`}
              title="Bật/Tắt Lời bài hát"
            >
              <Mic2 className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowQueue(!showQueue)} 
              className={`transition-all p-2 rounded-full cursor-pointer ${showQueue ? 'text-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'hover:text-white'}`}
              title="Hàng chờ phát nhạc"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 group">
              <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="cursor-pointer">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 hover:text-white transition-all" />}
              </button>
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
                  <div 
                    className="h-full bg-white/80 rounded-full transition-all"
                    style={{ width: `${volume * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
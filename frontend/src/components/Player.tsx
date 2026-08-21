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
import TrackActionMenu from "@/components/TrackActionMenu";
import QueuePanel from "@/components/QueuePanel";

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
    toggleRepeat
  } = usePlayerStore();
  
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeLyricRef = useRef<HTMLHeadingElement>(null);

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

  // 1. Cập nhật âm lượng
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 2. Đồng bộ Phát/Tạm dừng & Media Session API
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: artistName,
          artwork: [{ src: currentTrack.image, sizes: "512x512", type: "image/png" }],
        });

        navigator.mediaSession.setActionHandler("play", togglePlay);
        navigator.mediaSession.setActionHandler("pause", togglePlay);
        navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
        navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
      }
    }
  }, [currentTrack, isPlaying, artistName, togglePlay, prevTrack, nextTrack]);

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
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      nextTrack();
    }
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
        <div className="fixed inset-0 bottom-28 bg-black/90 backdrop-blur-3xl z-40 flex flex-col items-center justify-center p-8 transition-all duration-300 rounded-t-3xl border-t border-white/10 shadow-2xl">
          <button 
            onClick={() => setShowLyrics(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <X className="w-4 h-4" /> Đóng Karaoke
          </button>
          
          <div className="w-full max-w-2xl space-y-6 text-center max-h-[60vh] overflow-y-auto scrollbar-none px-4">
            {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
              currentTrack.lyrics.map((line, index) => {
                const isPassed = currentTime >= line.time;
                const isCurrent = isPassed && (index === currentTrack.lyrics!.length - 1 || currentTime < currentTrack.lyrics![index + 1].time);

                return (
                  <h2 
                    key={index}
                    ref={isCurrent ? activeLyricRef : null}
                    className={`text-2xl md:text-4xl font-extrabold transition-all duration-300 ${
                      isCurrent 
                        ? "text-white scale-110 drop-shadow-[0_0_25px_rgba(99,102,241,0.8)]" 
                        : isPassed 
                        ? "text-white/40" 
                        : "text-white/15"
                    }`}
                  >
                    {line.text}
                  </h2>
                );
              })
            ) : (
              <div className="text-center space-y-2">
                <p className="text-white/40 text-lg font-medium">Chưa có lời bài hát đồng bộ cho bài hát này</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAYER CONTAINER CHÍNH */}
      <div className="px-4 pb-4 w-full z-50 relative">
        <div className="h-24 md:h-20 bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col md:flex-row items-center justify-between px-6 py-2 md:py-0 w-full rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-50 mix-blend-overlay pointer-events-none"></div>

          <audio 
            ref={audioRef} 
            src={currentTrack.audioUrl} 
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          {/* BÊN TRÁI: THÔNG TIN BÀI HÁT */}
          <div className="flex items-center gap-3 w-full md:w-1/3 mb-2 md:mb-0 relative z-10 min-w-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="truncate min-w-0 flex-1 pr-1">
              <h4 className="text-sm font-bold text-white tracking-wide drop-shadow-md truncate">{currentTrack.title}</h4>
              <p className="text-xs text-white/50 mt-0.5 truncate">{artistName}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className="text-white/40 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                title={liked ? "Bỏ thích" : "Yêu thích"}
              >
                <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${liked ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : ""}`} />
              </button>

              <TrackActionMenu track={currentTrack} />
            </div>
          </div>

          {/* Ở GIỮA: NÚT ĐIỀU KHIỂN & THANH TIẾN TRÌNH */}
          <div className="flex flex-col items-center max-w-[400px] w-full relative z-10">
            <div className="flex items-center gap-8 mb-1">
              <button 
                onClick={toggleShuffle} 
                className={`transition-all p-1 cursor-pointer ${isShuffle ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-white/40 hover:text-white'}`}
                title={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              <button onClick={prevTrack} className="text-white/60 hover:text-white transition-all cursor-pointer">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              
              <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer">
                {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
              </button>
              
              <button onClick={nextTrack} className="text-white/60 hover:text-white transition-all cursor-pointer">
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
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-75 relative"
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
          </div>

          {/* BÊN PHẢI: PHÍM TẮT & ÂM LƯỢNG */}
          <div className="hidden md:flex items-center justify-end gap-3 w-1/3 text-white/50 relative z-10">
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
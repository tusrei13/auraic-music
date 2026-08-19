"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Mic2, Music } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

export default function Player() {
  // Lấy thêm playNext và playPrevious từ Context
  const { currentTrack, playNext, playPrevious } = useMusic();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7); // Mặc định 70% âm lượng
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const togglePlay = () => {
    if (!currentTrack) return; 
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

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

  // TÍNH NĂNG TUA NHẠC (SEEK)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  // TÍNH NĂNG CHỈNH ÂM LƯỢNG
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
      <div className="h-20 bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center px-6 w-full rounded-2xl border-dashed">
         <p className="text-white/40 text-sm flex items-center gap-2"><Music className="w-4 h-4"/> Vui lòng chọn một bài hát để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="h-20 bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-between px-6 w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      
      <audio 
        ref={audioRef} 
        src={currentTrack.audioUrl} 
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext} /* Tự động chuyển bài tiếp theo khi phát hết */
      />

      {/* BÊN TRÁI: Đĩa than & thông tin */}
      <div className="flex items-center gap-4 w-1/3">
        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
          <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide drop-shadow-md">{currentTrack.title}</h4>
          <p className="text-xs text-white/50 mt-0.5">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Ở GIỮA: Điều khiển & Thanh tua nhạc */}
      <div className="flex flex-col items-center max-w-[400px] w-full">
        <div className="flex items-center gap-8 mb-1">
          <button className="text-white/40 hover:text-white transition-all"><Shuffle className="w-4 h-4" /></button>
          
          {/* Nút Lùi Bài */}
          <button onClick={playPrevious} className="text-white/60 hover:text-white transition-all">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-110 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
          </button>
          
          {/* Nút Tiến Bài */}
          <button onClick={playNext} className="text-white/60 hover:text-white transition-all">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button className="text-white/40 hover:text-white transition-all"><Repeat className="w-4 h-4" /></button>
        </div>
        
        {/* THANH TUA NHẠC INTERACTIVE */}
        <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 relative flex items-center group">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="absolute w-full h-1 opacity-0 z-10 cursor-pointer"
            />
            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-75 relative"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {/* Chấm tròn tua nhạc hiện lên khi hover */}
            <div 
              className="w-3 h-3 bg-white rounded-full absolute -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md"
              style={{ left: `${progressPercent}%` }}
            ></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* BÊN PHẢI: Thanh âm lượng (Volume) */}
      <div className="flex items-center justify-end gap-4 w-1/3 text-white/50">
        <button className="hover:text-white transition-all"><Mic2 className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 group">
          <button onClick={() => { setVolume(volume === 0 ? 0.7 : 0); if (audioRef.current) audioRef.current.volume = volume === 0 ? 0.7 : 0; }}>
            {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 hover:text-white transition-all" />}
          </button>
          <div className="w-20 relative flex items-center">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={handleVolumeChange}
              className="absolute w-full h-1 opacity-0 z-10 cursor-pointer"
            />
            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${volume * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
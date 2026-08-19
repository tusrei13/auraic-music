"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Mic2, Music } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

export default function Player() {
  const { currentTrack } = useMusic();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 1. Thêm 2 state mới để quản lý thời gian (tính bằng giây)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
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

  // 2. Hàm biến đổi số giây thành định dạng Phút:Giây (VD: 65s -> 1:05)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 3. Hàm cập nhật thời gian chạy liên tục
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // 4. Lấy tổng thời lượng ngay khi bài hát vừa tải xong
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // 5. Tính toán % chiều dài của thanh màu
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
      
      {/* 6. Gắn các hàm lắng nghe sự kiện vào thẻ audio */}
      <audio 
        ref={audioRef} 
        src={currentTrack.audioUrl} 
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)} // Tự động đổi nút Pause thành Play khi hết bài
      />

      <div className="flex items-center gap-4 w-1/3">
        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
          <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide drop-shadow-md">{currentTrack.title}</h4>
          <p className="text-xs text-white/50 mt-0.5">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center max-w-[400px] w-full">
        <div className="flex items-center gap-8 mb-1">
          <button className="text-white/40 hover:text-white transition-all"><Shuffle className="w-4 h-4" /></button>
          <button className="text-white/60 hover:text-white transition-all"><SkipBack className="w-5 h-5 fill-current" /></button>
          
          <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-110 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
          </button>
          
          <button className="text-white/60 hover:text-white transition-all"><SkipForward className="w-5 h-5 fill-current" /></button>
          <button className="text-white/40 hover:text-white transition-all"><Repeat className="w-4 h-4" /></button>
        </div>
        
        {/* 7. Nạp dữ liệu động vào UI thanh tiến trình */}
        <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
          <span>{formatTime(currentTime)}</span>
          <div className="h-1 flex-1 bg-black/40 rounded-full group relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-75 relative"
              style={{ width: `${progressPercent}%` }} // CSS Inline để cập nhật chiều dài theo thời gian thực
            ></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 w-1/3 text-white/50">
        <button className="hover:text-white transition-all"><Mic2 className="w-4 h-4" /></button>
        <button className="hover:text-white transition-all"><Volume2 className="w-4 h-4" /></button>
        <div className="w-20 h-1 bg-black/40 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-white rounded-full transition-colors"></div>
        </div>
      </div>
    </div>
  );
}
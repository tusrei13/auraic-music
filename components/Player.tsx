"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Mic2, Music } from "lucide-react";
import { useMusic } from "@/context/MusicContext"; // Import công cụ kết nối

export default function Player() {
  // Nhận dữ liệu bài hát hiện tại từ Trạm phát sóng
  const { currentTrack } = useMusic();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // TÊN LÍNH GÁC: Tự động chạy nhạc mỗi khi currentTrack thay đổi
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentTrack]); // Theo dõi sự thay đổi của currentTrack

  const togglePlay = () => {
    // Nếu không có bài hát nào được chọn thì không làm gì cả
    if (!currentTrack) return; 

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  // GIAO DIỆN CHỜ: Khi vừa vào web, chưa chọn bài nào thì hiển thị giao diện trống thanh lịch
  if (!currentTrack) {
    return (
      <div className="h-20 bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center px-6 w-full rounded-2xl border-dashed">
         <p className="text-white/40 text-sm flex items-center gap-2"><Music className="w-4 h-4"/> Vui lòng chọn một bài hát để bắt đầu</p>
      </div>
    );
  }

  // GIAO DIỆN CHÍNH (Khi đã có nhạc)
  return (
    <div className="h-20 bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-between px-6 w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      
      {/* THẺ AUDIO THỰC SỰ: Nguồn nhạc linh hoạt theo bài đang chọn */}
      <audio 
        ref={audioRef} 
        src={currentTrack.audioUrl} 
        preload="metadata"
      />

      <div className="flex items-center gap-4 w-1/3">
        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
          {/* Hiển thị ảnh bìa động */}
          <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>
        <div>
          {/* Hiển thị Tên bài hát và Ca sĩ động */}
          <h4 className="text-sm font-bold text-white tracking-wide hover:text-indigo-300 transition-colors cursor-pointer drop-shadow-md">{currentTrack.title}</h4>
          <p className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer mt-0.5">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center max-w-[400px] w-full">
        <div className="flex items-center gap-8 mb-1">
          <button className="text-white/40 hover:text-white transition-all"><Shuffle className="w-4 h-4" /></button>
          <button className="text-white/60 hover:text-white transition-all"><SkipBack className="w-5 h-5 fill-current" /></button>
          
          <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all">
            {isPlaying ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
          </button>
          
          <button className="text-white/60 hover:text-white transition-all"><SkipForward className="w-5 h-5 fill-current" /></button>
          <button className="text-white/40 hover:text-white transition-all"><Repeat className="w-4 h-4" /></button>
        </div>
        
        <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
          <span>0:00</span>
          <div className="h-1 flex-1 bg-black/40 rounded-full cursor-pointer group relative overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all relative shadow-[0_0_10px_rgba(167,139,250,0.5)]"></div>
          </div>
          <span>4:03</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 w-1/3 text-white/50">
        <button className="hover:text-white transition-all hover:scale-110"><Mic2 className="w-4 h-4" /></button>
        <button className="hover:text-white transition-all hover:scale-110"><Volume2 className="w-4 h-4" /></button>
        <div className="w-20 h-1 bg-black/40 rounded-full cursor-pointer group overflow-hidden">
          <div className="h-full w-2/3 bg-white rounded-full transition-colors"></div>
        </div>
      </div>
    </div>
  );
}
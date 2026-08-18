"use client"; // BẮT BUỘC CÓ: Báo cho Next.js biết file này có tương tác của người dùng (bấm nút)

import { useState } from "react"; // Import công tắc useState
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Mic2 } from "lucide-react"; // Đã thêm icon Pause

export default function Player() {
  // KHỞI TẠO CÔNG TẮC: Mặc định là false (chưa phát nhạc)
  const [isPlaying, setIsPlaying] = useState(false);

  // Hàm xử lý khi người dùng bấm nút
  const togglePlay = () => {
    setIsPlaying(!isPlaying); // Đảo ngược trạng thái: true thành false, false thành true
  };

  return (
    <div className="h-20 bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-between px-6 w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      
      {/* BÊN TRÁI: Đĩa than */}
      <div className="flex items-center gap-4 w-1/3">
        {/* NẾU isPlaying = true THÌ thêm class animate-[spin_4s_linear_infinite] để xoay */}
        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
          <img 
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" 
            alt="Now playing" 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide hover:text-indigo-300 transition-colors cursor-pointer drop-shadow-md">Midnight City</h4>
          <p className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer mt-0.5">M83</p>
        </div>
      </div>

      {/* Ở GIỮA: Nút điều khiển */}
      <div className="flex flex-col items-center max-w-[400px] w-full">
        <div className="flex items-center gap-8 mb-1">
          <button className="text-white/40 hover:text-white transition-all"><Shuffle className="w-4 h-4" /></button>
          <button className="text-white/60 hover:text-white transition-all"><SkipBack className="w-5 h-5 fill-current" /></button>
          
          {/* NÚT PLAY/PAUSE: Gắn sự kiện onClick */}
          <button 
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all"
          >
            {/* Nếu đang phát nhạc thì hiện Pause, ngược lại hiện Play */}
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black text-black" />
            ) : (
              <Play className="w-5 h-5 fill-black text-black ml-0.5" />
            )}
          </button>
          
          <button className="text-white/60 hover:text-white transition-all"><SkipForward className="w-5 h-5 fill-current" /></button>
          <button className="text-white/40 hover:text-white transition-all"><Repeat className="w-4 h-4" /></button>
        </div>
        
        {/* Thanh tiến trình */}
        <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
          <span>0:00</span>
          <div className="h-1 flex-1 bg-black/40 rounded-full cursor-pointer group relative overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all relative shadow-[0_0_10px_rgba(167,139,250,0.5)]"></div>
          </div>
          <span>4:03</span>
        </div>
      </div>

      {/* BÊN PHẢI: Volume */}
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
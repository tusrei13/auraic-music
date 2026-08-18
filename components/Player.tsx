import { Play, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Mic2 } from "lucide-react";

export default function Player() {
  return (
    // PLAYER BIẾN THÀNH ĐẢO NỔI: Bo tròn mạnh (rounded-full/rounded-2xl), cách lề, kính mờ
    <div className="h-20 bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-between px-6 w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      
      {/* BÊN TRÁI: Đĩa than (Vinyl) thay vì ảnh vuông */}
      <div className="flex items-center gap-4 w-1/3">
        {/* Lớp vỏ đĩa than xoay tròn (Thêm animate-spin chậm sau này) */}
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
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

      {/* Ở GIỮA: Nút điều khiển tinh xảo hơn */}
      <div className="flex flex-col items-center max-w-[400px] w-full">
        <div className="flex items-center gap-8 mb-1">
          <button className="text-white/40 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"><Shuffle className="w-4 h-4" /></button>
          <button className="text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"><SkipBack className="w-5 h-5 fill-current" /></button>
          
          {/* Nút Play phát sáng */}
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all">
            <Play className="w-5 h-5 fill-black text-black ml-0.5" />
          </button>
          
          <button className="text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"><SkipForward className="w-5 h-5 fill-current" /></button>
          <button className="text-white/40 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"><Repeat className="w-4 h-4" /></button>
        </div>
        
        {/* Thanh tiến trình tinh giản */}
        <div className="flex items-center gap-3 w-full text-[10px] font-medium text-white/50">
          <span>0:00</span>
          <div className="h-1 flex-1 bg-black/40 rounded-full cursor-pointer group relative overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full group-hover:from-indigo-400 group-hover:to-purple-300 transition-all relative shadow-[0_0_10px_rgba(167,139,250,0.5)]"></div>
          </div>
          <span>4:03</span>
        </div>
      </div>

      {/* BÊN PHẢI: Volume */}
      <div className="flex items-center justify-end gap-4 w-1/3 text-white/50">
        <button className="hover:text-white transition-all hover:scale-110"><Mic2 className="w-4 h-4" /></button>
        <button className="hover:text-white transition-all hover:scale-110"><Volume2 className="w-4 h-4" /></button>
        <div className="w-20 h-1 bg-black/40 rounded-full cursor-pointer group overflow-hidden">
          <div className="h-full w-2/3 bg-white rounded-full group-hover:bg-indigo-400 transition-colors"></div>
        </div>
      </div>

    </div>
  );
}
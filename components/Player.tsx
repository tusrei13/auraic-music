import { Play, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Mic2 } from "lucide-react";

export default function Player() {
  return (
    // Khung tổng của Player
    <div className="h-24 bg-black border-t border-white/10 flex items-center justify-between px-6 w-full">
      
      {/* PHẦN 1: BÊN TRÁI - Thông tin bài hát đang phát */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-14 h-14 bg-white/10 rounded-md overflow-hidden flex-shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" 
            alt="Now playing" 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white/90 hover:underline cursor-pointer">Midnight City</h4>
          <p className="text-xs text-white/50 hover:underline cursor-pointer mt-1">M83</p>
        </div>
      </div>

      {/* PHẦN 2: Ở GIỮA - Các nút điều khiển & Thanh tiến trình */}
      <div className="flex flex-col items-center max-w-[400px] w-full">
        {/* Hàng nút */}
        <div className="flex items-center gap-6 mb-2">
          <button className="text-white/50 hover:text-white transition"><Shuffle className="w-4 h-4" /></button>
          <button className="text-white/50 hover:text-white transition"><SkipBack className="w-5 h-5 fill-current" /></button>
          
          <button className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:scale-105 transition">
            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
          </button>
          
          <button className="text-white/50 hover:text-white transition"><SkipForward className="w-5 h-5 fill-current" /></button>
          <button className="text-white/50 hover:text-white transition"><Repeat className="w-4 h-4" /></button>
        </div>
        
        {/* Thanh tiến trình (Progress bar) */}
        <div className="flex items-center gap-2 w-full text-xs text-white/50">
          <span>0:00</span>
          {/* Thanh background mờ */}
          <div className="h-1 flex-1 bg-white/10 rounded-full cursor-pointer group">
            {/* Vạch trắng chạy qua */}
            <div className="h-full w-1/3 bg-white rounded-full group-hover:bg-green-500 transition-colors relative">
                {/* Nút tròn nhỏ xuất hiện khi hover */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md"></div>
            </div>
          </div>
          <span>4:03</span>
        </div>
      </div>

      {/* PHẦN 3: BÊN PHẢI - Âm lượng & Công cụ */}
      <div className="flex items-center justify-end gap-4 w-1/3 text-white/50">
        <button className="hover:text-white transition"><Mic2 className="w-4 h-4" /></button>
        <button className="hover:text-white transition"><Volume2 className="w-5 h-5" /></button>
        {/* Thanh âm lượng */}
        <div className="w-24 h-1 bg-white/10 rounded-full cursor-pointer group">
          <div className="h-full w-2/3 bg-white rounded-full group-hover:bg-green-500 transition-colors relative">
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
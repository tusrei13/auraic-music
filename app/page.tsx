import Image from "next/image";
import { Play } from "lucide-react";

// MOCK DATA: Dữ liệu giả lập để thiết kế giao diện
const mockAlbums = [
  { id: 1, title: "Midnight City", artist: "M83", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop" },
  { id: 2, title: "Starboy", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop" },
  { id: 3, title: "Random Access Memories", artist: "Daft Punk", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop" },
  { id: 4, title: "Currents", artist: "Tame Impala", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop" },
  { id: 5, title: "After Hours", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop" },
];

export default function HomePage() {
  return (
    <div className="p-8">
      
      {/* Lời chào */}
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">
        Chào buổi sáng
      </h1>

      {/* Section: Dành cho bạn */}
      <section>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Tuyển tập cho bạn</h2>
        
        {/* Lưới hiển thị danh sách Album (CSS Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          {/* Duyệt qua mảng dữ liệu giả để in ra giao diện */}
          {mockAlbums.map((album) => (
            // class 'group' dùng để bắt sự kiện hover cho các phần tử con bên trong
            <div 
              key={album.id} 
              className="group bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-white/10"
            >
              {/* Vùng chứa ảnh bìa */}
              <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-lg shadow-lg">
                <img 
                  src={album.image} 
                  alt={album.title} 
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Nút Play nổi lên khi hover */}
                <div className="absolute bottom-2 right-2 bg-white text-black p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl flex items-center justify-center">
                  <Play className="w-5 h-5 fill-black ml-1" />
                </div>
              </div>

              {/* Thông tin Album */}
              <h3 className="font-semibold text-white/90 truncate">{album.title}</h3>
              <p className="text-sm text-white/50 mt-1 truncate">{album.artist}</p>
            </div>
          ))}

        </div>
      </section>

    </div>
  );
}
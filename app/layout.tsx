import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Home, Compass, Library } from 'lucide-react';
import Player from '@/components/Player';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Auraic | Cảm nhận âm nhạc',
  description: 'Nền tảng âm nhạc tối giản và cao cấp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      {/* NỀN TỔNG: Đổi sang Gradient siêu sâu, tạo cảm giác không gian (Aura) */}
      <body className={`${inter.className} h-screen flex flex-col overflow-hidden bg-gradient-to-br from-indigo-950 via-[#050505] to-purple-950 text-white`}>
        
        {/* Phần thân trên được bọc thêm padding (p-4) để tách khỏi lề màn hình */}
        <div className="flex flex-1 overflow-hidden p-4 gap-4 pb-2">
          
          {/* SIDEBAR: Biến thành "Tấm kính nổi" (Glassmorphism) */}
          <aside className="w-64 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 drop-shadow-lg">
              AURAIC
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-2">
              <Link href="/" className="flex items-center gap-4 px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-all rounded-xl hover:bg-white/10 hover:shadow-lg hover:scale-[1.02]">
                <Home className="w-5 h-5" />
                Trang chủ
              </Link>
              <Link href="/discover" className="flex items-center gap-4 px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-all rounded-xl hover:bg-white/10 hover:shadow-lg hover:scale-[1.02]">
                <Compass className="w-5 h-5" />
                Khám phá
              </Link>
              <Link href="/library" className="flex items-center gap-4 px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-all rounded-xl hover:bg-white/10 hover:shadow-lg hover:scale-[1.02]">
                <Library className="w-5 h-5" />
                Thư viện
              </Link>
            </nav>
          </aside>

          {/* MAIN CONTENT: Cũng bo tròn và làm mờ */}
          <main className="flex-1 overflow-y-auto bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl relative">
            {children}
          </main>
          
        </div>

        {/* Khu vực chứa Player cũng được bọc padding để lơ lửng */}
        <div className="px-4 pb-4 w-full">
          <Player />
        </div>

      </body>
    </html>
  );
}
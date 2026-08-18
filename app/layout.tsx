import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Dùng font Inter cho cảm giác hiện đại, thanh lịch
const inter = Inter({ subsets: ['latin'] });

// Cấu hình SEO mặc định cho app
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
      {/* 
        h-screen: Ép toàn bộ web cao bằng đúng màn hình (không cuộn toàn trang)
        flex flex-col: Xếp các khối theo chiều dọc 
        overflow-hidden: Khóa cuộn trang web tổng thể
      */}
      <body className={`${inter.className} h-screen flex flex-col overflow-hidden`}>
        
        {/* KHỐI TRÊN: Gồm Sidebar và Nội dung chính */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* 1. SIDEBAR (Cố định bên trái) */}
          <aside className="w-64 bg-black/50 border-r border-white/5 flex flex-col">
            <div className="p-6 font-bold text-xl tracking-widest text-white/90">AURAIC</div>
            {/* Menu sẽ nằm ở đây */}
          </aside>

          {/* 2. MAIN CONTENT (Nơi duy nhất được phép cuộn) */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white/5 to-transparent">
            {children} {/* Phần này sẽ gọi vào file page.tsx */}
          </main>
          
        </div>

        {/* 3. AUDIO PLAYER (Cố định dưới cùng) */}
        <div className="h-24 bg-black border-t border-white/10 flex items-center px-6">
          <span className="text-sm text-gray-500">Trình phát nhạc sẽ nằm ở đây...</span>
        </div>

      </body>
    </html>
  );
}
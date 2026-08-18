import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link'; // Import công cụ chuyển trang không tải lại của Next.js
import { Home, Compass, Library } from 'lucide-react'; // Import các icon
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
      <body className={`${inter.className} h-screen flex flex-col overflow-hidden`}>
        
        <div className="flex flex-1 overflow-hidden">
          
          {/* 1. SIDEBAR */}
          <aside className="w-64 bg-black/50 border-r border-white/5 flex flex-col">
            {/* Logo */}
            <div className="p-6 font-bold text-2xl tracking-widest text-white/90">
              AURAIC
            </div>

            {/* Menu Điều hướng */}
            <nav className="flex-1 px-4 space-y-2 mt-2">
              <Link 
                href="/" 
                className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-white/50 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                <Home className="w-5 h-5" />
                Trang chủ
              </Link>

              <Link 
                href="/discover" 
                className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-white/50 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                <Compass className="w-5 h-5" />
                Khám phá
              </Link>

              <Link 
                href="/library" 
                className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-white/50 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                <Library className="w-5 h-5" />
                Thư viện
              </Link>
            </nav>
          </aside>

          {/* 2. MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white/5 to-transparent">
            {children}
          </main>
          
        </div>

        {/* 3. AUDIO PLAYER */}
        <div className="h-24 bg-black border-t border-white/10 flex items-center px-6">
          <span className="text-sm text-gray-500">Trình phát nhạc sẽ nằm ở đây...</span>
        </div>

      </body>
    </html>
  );
}
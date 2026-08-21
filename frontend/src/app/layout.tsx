import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import { AudioProvider } from '@/context/AudioContext';
import Player from '@/components/Player';
import ToastContainer from '@/components/ToastContainer';
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
      <body className={`${inter.className} h-screen flex flex-col overflow-hidden bg-gradient-to-br from-indigo-950 via-[#050505] to-purple-950 text-white`}>
        <AudioProvider>
          <div className="flex flex-1 overflow-hidden p-4 gap-4 pb-2">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl relative">
              {children}
            </main>
          </div>

          <div className="px-4 pb-4 w-full z-50">
            <Player />
          </div>

          <ToastContainer />
        </AudioProvider>
      </body>
    </html>
  );
}
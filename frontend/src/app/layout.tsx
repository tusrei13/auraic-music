import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Player from '@/components/Player';
import ToastContainer from '@/components/ToastContainer';
import AuthProvider from '@/context/AuthProvider';
import AuthModal from '@/components/AuthModal';
import DynamicTheme from '@/components/DynamicTheme';
import GlobalSearchBar from '@/components/GlobalSearchBar';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

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
      <body className={`${spaceGrotesk.className} h-screen flex flex-col overflow-hidden text-white`}>
        <AuthProvider>
        <DynamicTheme />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 gap-3 overflow-hidden p-3 pb-2 sm:gap-4 sm:p-4">
            <Sidebar />
          <main className="relative flex-1 overflow-y-auto rounded-[28px] border border-white/10 bg-black/25 shadow-2xl backdrop-blur-2xl">
              <GlobalSearchBar />
              {children}
            </main>
        </div>

          <div className="px-4 pb-4 w-full z-50">
            <Player />
          </div>

          <ToastContainer />
          <AuthModal />
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}

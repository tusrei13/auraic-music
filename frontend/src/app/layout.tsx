import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Player from '@/components/Player';
import ToastContainer from '@/components/ToastContainer';
import AuthProvider from '@/context/AuthProvider';
import AuthModal from '@/components/AuthModal';
import DynamicTheme from '@/components/DynamicTheme';
import GlobalSearchBar from '@/components/GlobalSearchBar';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

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
    <html lang="vi" className={`${plusJakarta.variable} dark`}>
      <body className={`${plusJakarta.className} h-screen flex flex-col overflow-hidden bg-auraic-bg text-auraic-text antialiased`}>
        <AuthProvider>
        <QueryProvider>
        <DynamicTheme />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 gap-3 overflow-hidden p-3 pb-2 sm:gap-4 sm:p-4">
            <Sidebar />
          <main className="relative flex-1 overflow-y-auto rounded-[28px] border border-auraic-border bg-auraic-glass shadow-2xl backdrop-blur-2xl">
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
        </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

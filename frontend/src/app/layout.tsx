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
import SpatialStarfieldCanvas from '@/components/visualizer/SpatialStarfieldCanvas';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  title: 'Auraic | Cảm nhận âm nhạc',
  description: 'Nền tảng âm nhạc không gian 3D tối giản và cao cấp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plusJakarta.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const removeBis = function() {
                    const elements = document.querySelectorAll('[bis_skin_checked]');
                    for (let i = 0; i < elements.length; i++) {
                      elements[i].removeAttribute('bis_skin_checked');
                    }
                  };
                  removeBis();
                  const observer = new MutationObserver(function(mutations) {
                    for (let i = 0; i < mutations.length; i++) {
                      const m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked' && m.target && m.target.removeAttribute) {
                        m.target.removeAttribute('bis_skin_checked');
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked'],
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${plusJakarta.className} h-screen flex flex-col overflow-hidden bg-[#060812] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/25 via-[#060812] to-[#04050a] text-auraic-text antialiased selection:bg-fuchsia-500/30 selection:text-white`} suppressHydrationWarning>
        <AuthProvider>
        <QueryProvider>
        <DynamicTheme />
        <SpatialStarfieldCanvas />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Spatial Floating Stage Shell */}
          <div className="flex flex-1 gap-3.5 overflow-hidden p-3 pb-2 sm:gap-4 sm:p-4 lg:p-5">
            <Sidebar />
            {/* Main vault: solid-ish surface (NO backdrop-blur — only the
                Sidebar, Header and Player Bar keep real glassmorphism so the
                GPU never composites dozens of live blur regions). */}
            <main className="relative flex-1 overflow-y-auto rounded-[32px] border border-white/15 bg-[#0a0c16]/90 shadow-[0_30px_70px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.22)] scroll-smooth">
              <GlobalSearchBar />
              {/* Content sits on its own compositor layer so scrolling stays GPU-composited. */}
              <div className="transform-gpu will-change-transform">
                {children}
              </div>
            </main>
          </div>

          {/* Floating Island Player Bar */}
          <div className="w-full px-3 pb-3 sm:px-5 sm:pb-4 z-50 pointer-events-auto">
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

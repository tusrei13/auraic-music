"use client";

import Artwork from "@/components/Artwork";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Library, Users, BarChart3 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "Stations & Ambient", href: "/stations", icon: Radio },
  { name: "Thư viện", href: "/library", icon: Library },
  { name: "Phòng nghe chung", href: "/session", icon: Users },
  { name: "Thống kê", href: "/stats", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, openAuthModal } = useAuthStore();

  return (
    <aside className="group/sidebar flex h-full w-[68px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] p-3 transition-[width] duration-300 hover:w-64 sm:w-[76px] sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-xl">
      <div className="space-y-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 px-1">
          <Artwork
            src="/favicon.ico"
            alt="Auraic"
            priority
            loading="eager"
            className="h-10 w-10 shrink-0 object-cover mix-blend-screen drop-shadow-[0_0_16px_rgba(192,100,255,0.6)] transition-transform duration-300 group-hover/sidebar:scale-105"
          />
          <span className="whitespace-nowrap bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-lg font-black tracking-[0.2em] text-transparent opacity-0 drop-shadow-[0_0_10px_rgba(192,100,255,0.35)] transition-opacity duration-300 group-hover/sidebar:opacity-100">
            AURAIC
          </span>
        </Link>

        {/* NAVIGATION LINKS (Chỉ bao gồm 5 mục theo yêu cầu) */}
        <nav className="space-y-2.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  if (item.href === "/library" && status !== "authenticated") {
                    event.preventDefault();
                    openAuthModal();
                  }
                }}
                className={`group/item flex min-h-12 items-center gap-4 rounded-2xl px-3 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_24px_rgba(124,58,237,0.55)] border border-violet-400/30"
                    : "text-white/50 hover:text-white hover:bg-white/[0.06] hover:border hover:border-white/10"
                }`}
                title={item.name}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover/item:scale-110 ${
                    isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-white/60"
                  }`}
                />
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Subtle audiophile footer indicator */}
      <div className="mt-auto px-2 opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[10px] text-white/40">
          <div className="flex items-center gap-1.5 font-mono text-cyan-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>24-bit • 96kHz</span>
          </div>
          <p className="mt-1 truncate">Audiophile Glass Engine</p>
        </div>
      </div>
    </aside>
  );
}
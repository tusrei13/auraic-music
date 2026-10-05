"use client";

import Artwork from "@/components/Artwork";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Library, Users, BarChart3, Compass } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { name: "Khám phá", href: "/", icon: Compass },
  { name: "Stations & Ambient", href: "/stations", icon: Radio },
  { name: "Thư viện", href: "/library", icon: Library },
  { name: "Phòng nghe chung", href: "/session", icon: Users },
  { name: "Thống kê", href: "/stats", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, openAuthModal } = useAuthStore();

  return (
    <aside className="group/sidebar flex h-full w-[68px] shrink-0 flex-col overflow-hidden rounded-[28px] border-2 border-white/15 bg-[#0d0f1a]/90 p-3 transition-[width] duration-300 hover:w-64 sm:w-[76px] sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="space-y-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 px-1">
          <Artwork
            src="/favicon.ico"
            alt="Auraic"
            priority
            loading="eager"
            className="h-10 w-10 shrink-0 object-cover mix-blend-screen drop-shadow-[0_0_16px_rgba(192,100,255,0.7)] transition-transform duration-300 group-hover/sidebar:scale-105"
          />
          <span className="whitespace-nowrap font-pixel text-xl font-bold tracking-widest text-white opacity-0 drop-shadow-[0_0_12px_rgba(192,100,255,0.6)] transition-opacity duration-300 group-hover/sidebar:opacity-100">
            AURAIC
          </span>
        </Link>

        {/* NAVIGATION LINKS */}
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
                className={`group/item flex min-h-12 items-center gap-4 rounded-2xl px-3 font-pixel text-sm tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_24px_rgba(124,58,237,0.55)] border-2 border-violet-400/40"
                    : "text-white/60 hover:text-white hover:bg-white/[0.08] hover:border hover:border-white/20"
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

      {/* Subtle audiophile arcade indicator */}
      <div className="mt-auto px-1 opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
        <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-2.5 text-[10px] text-white/50">
          <div className="flex items-center gap-1.5 font-arcade text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>24-BIT • 96KHZ</span>
          </div>
          <p className="mt-1 font-pixel text-xs text-white/40 truncate">ARCADE HI-FI DECK</p>
        </div>
      </div>
    </aside>
  );
}
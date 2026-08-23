"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Radio, LogIn, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "Khám phá", href: "/discover", icon: Compass },
  { name: "Thư viện", href: "/library", icon: Library },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, status, signOut, openAuthModal } = useAuthStore();

  return (
    <aside className="group/sidebar flex h-full w-[68px] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] p-3 transition-[width] duration-300 hover:w-56 sm:w-[76px] sm:p-4">
      <div className="space-y-10">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-cyan-400 shadow-[0_0_22px_rgba(192,100,255,0.5)]">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="whitespace-nowrap text-lg font-black tracking-[0.2em] text-white opacity-0 transition-opacity group-hover/sidebar:opacity-100">AURAIC</span>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
                className={`flex min-h-12 items-center gap-4 rounded-2xl px-3 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
                <span className="whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {status === "authenticated" && user ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="truncate px-2 text-xs text-white/60">{user.name || user.email}</div>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="flex min-h-12 items-center gap-3 rounded-2xl px-3 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <LogIn className="h-5 w-5 shrink-0" /><span className="whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100">Đăng nhập</span>
        </Link>
      )}
    </aside>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, LogIn, LogOut, ShieldCheck } from "lucide-react";
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
          <img src="/favicon.ico" alt="Auraic" className="h-10 w-10 shrink-0 object-cover mix-blend-screen drop-shadow-[0_0_16px_rgba(192,100,255,0.5)]" />
          <span className="whitespace-nowrap bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-lg font-black tracking-[0.2em] text-transparent opacity-0 drop-shadow-[0_0_10px_rgba(192,100,255,0.35)] transition-opacity group-hover/sidebar:opacity-100">AURAIC</span>
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
        {status === "authenticated" && user?.role === "ADMIN" ? (
          <nav>
            <Link href="/admin" className={`flex min-h-12 items-center gap-4 rounded-2xl px-3 text-xs font-semibold transition-all ${pathname.startsWith("/admin") ? "bg-fuchsia-500/20 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`} title="Admin">
              <ShieldCheck className="h-5 w-5 shrink-0" /><span className="whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100">Admin</span>
            </Link>
          </nav>
        ) : null}
      </div>

      {status === "authenticated" && user ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="truncate px-2 text-xs text-white/60 opacity-0 transition-opacity group-hover/sidebar:opacity-100">{user.name || user.email}</div>
          <button
            type="button"
            onClick={signOut}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="flex min-h-12 w-full items-center gap-4 rounded-2xl px-3 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" /><span className="whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100">Đăng xuất</span>
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
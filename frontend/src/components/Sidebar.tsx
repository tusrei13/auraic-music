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
    <aside className="w-64 bg-white/[0.02] border-r border-white/10 p-6 flex flex-col justify-between h-full">
      <div className="space-y-8">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-xl font-black text-white tracking-widest">AURAIC</span>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-2">
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
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/50"}`} />
                {item.name}
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
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <LogIn className="h-4 w-4" /> Đăng nhập
        </Link>
      )}
    </aside>
  );
}
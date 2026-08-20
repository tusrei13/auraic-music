"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Radio } from "lucide-react";

const navItems = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "Khám phá", href: "/discover", icon: Compass },
  { name: "Thư viện", href: "/library", icon: Library },
];

export default function Sidebar() {
  const pathname = usePathname();

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
    </aside>
  );
}
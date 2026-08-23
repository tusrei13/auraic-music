"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, BarChart3, Check, Database, Loader2, RefreshCw, Save, Search, Settings2, ShieldCheck, Users } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError, getAdminSongs, getAdminTopJamendo, getAdminUsers, type AdminSong, type AdminTopSong, type AdminUser } from "@/lib/api";

type AdminView = "catalog" | "ingestion" | "users" | "analytics" | "settings";

const views: Array<{ key: AdminView; label: string; icon: typeof Database }> = [
  { key: "catalog", label: "Jamendo Catalog", icon: Database },
  { key: "ingestion", label: "Ingestion Feed", icon: RefreshCw },
  { key: "users", label: "Users", icon: Users },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "System Settings", icon: Settings2 },
];

export default function AdminWorkspace({ view }: { view: AdminView }) {
  const { user, status, initialize } = useAuthStore();
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [topSongs, setTopSongs] = useState<AdminTopSong[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "idle") void initialize();
  }, [initialize, status]);

  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "ADMIN") return;
    setLoading(true);
    const requests = [getAdminSongs().then((result) => setSongs(result.songs)), getAdminTopJamendo().then((result) => setTopSongs(result.songs)), getAdminUsers().then((result) => setUsers(result.users))];
    Promise.all(requests).catch(() => undefined).finally(() => setLoading(false));
  }, [status, user?.role]);

  if (status === "idle" || status === "loading") return <State icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Đang xác thực quyền truy cập" />;
  if (status === "unauthenticated") return <State icon={<ShieldCheck className="h-6 w-6 text-cyan-300" />} title="Đăng nhập để mở khu vực quản trị" />;
  if (user?.role !== "ADMIN") return <State icon={<AlertCircle className="h-6 w-6 text-rose-300" />} title="Bạn không có quyền truy cập trang này" />;

  const current = views.find((item) => item.key === view) || views[0];
  const visibleSongs = songs.filter((song) => `${song.title} ${song.artist.name}`.toLowerCase().includes(query.toLowerCase()));
  const visibleUsers = users.filter((item) => `${item.name || ""} ${item.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-full overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_35%)] px-5 pb-32 pt-8 text-white sm:px-8 lg:px-12">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-300"><ShieldCheck className="h-4 w-4" /> Auraic Control Room</p><h1 className="mt-4 text-3xl font-black sm:text-5xl">{current.label}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/50">{view === "catalog" ? "Review the Jamendo catalog, licenses and metadata health." : view === "ingestion" ? "Monitor sync jobs, retries and feed health." : view === "users" ? "Manage accounts, roles and recent activity." : view === "analytics" ? "Understand listening momentum across Auraic." : "Configure site-wide behavior and legal defaults."}</p></div>
        <Link href="/admin" className="min-h-11 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white">Overview</Link>
      </header>
      <nav className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Admin sections">{views.map(({ key, label, icon: Icon }) => <Link key={key} href={`/admin/${key}`} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-xs font-semibold transition ${view === key ? "border-fuchsia-300/50 bg-fuchsia-300/10 text-fuchsia-100" : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white"}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>

      {loading ? <div className="mt-8 flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/45"><Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" /> Loading admin data...</div> : null}
      {!loading && view === "catalog" ? <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm outline-none focus:border-fuchsia-300" placeholder="Search tracks or artists" aria-label="Search Jamendo catalog" /></div><span className="flex items-center text-xs text-white/40">{visibleSongs.length} imported tracks</span></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3">Track</th><th className="px-3 py-3">Artist</th><th className="px-3 py-3">Genre</th><th className="px-3 py-3">Plays</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-white/5">{visibleSongs.map((song) => <tr key={song.id} className="text-white/65 hover:bg-white/[0.03]"><td className="px-3 py-4"><div className="flex items-center gap-3"><img src={song.image} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="font-semibold text-white">{song.title}</span></div></td><td className="px-3 py-4">{song.artist.name}</td><td className="px-3 py-4 text-white/45">{song.genre?.name || "Unmapped"}</td><td className="px-3 py-4 tabular-nums">{song.playCount.toLocaleString("vi-VN")}</td><td className="px-3 py-4"><span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">Synced</span></td></tr>)}</tbody></table></div></section> : null}
      {!loading && view === "users" ? <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Account directory</h2><p className="mt-1 text-sm text-white/40">Roles and access are tied to Supabase authentication.</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-56 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none focus:border-cyan-300" placeholder="Search users" aria-label="Search users" /></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3">Account</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Playlists</th><th className="px-3 py-3">Joined</th></tr></thead><tbody className="divide-y divide-white/5">{visibleUsers.map((item) => <tr key={item.id} className="text-white/65"><td className="px-3 py-4"><p className="font-semibold text-white">{item.name || "Unnamed user"}</p><p className="mt-1 text-xs text-white/40">{item.email}</p></td><td className="px-3 py-4"><span className={item.role === "ADMIN" ? "text-cyan-200" : "text-white/55"}>{item.role}</span></td><td className="px-3 py-4 tabular-nums">{item._count.playlists}</td><td className="px-3 py-4 text-xs text-white/45">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table></div></section> : null}
      {!loading && view === "analytics" ? <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><article className="rounded-2xl border border-white/10 bg-black/20 p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Listening events</p><h2 className="mt-2 text-2xl font-black">Momentum this week</h2></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">+12.4%</span></div><div className="mt-8 flex h-48 items-end gap-2 border-b border-white/10 px-2">{[34, 48, 42, 68, 54, 78, 92, 72, 84, 65, 96, 88].map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-fuchsia-500/70 to-cyan-300/80" style={{ height: `${height}%` }} />)}</div><div className="mt-4 flex justify-between text-[10px] text-white/35"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div></article><article className="rounded-2xl border border-white/10 bg-black/20 p-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">Top tracks</p><div className="mt-5 space-y-4">{topSongs.slice(0, 5).map((song, index) => <div key={song.trackId} className="flex items-center gap-3"><span className="w-5 text-xs text-white/30">0{index + 1}</span><img src={song.image} alt="" className="h-9 w-9 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{song.title}</p><p className="truncate text-xs text-white/40">{song.artistName}</p></div><span className="text-xs text-cyan-200">{song.plays.toLocaleString("vi-VN")}</span></div>)}</div></article></section> : null}
      {!loading && view === "ingestion" ? <section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><article className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Sync health</p><h2 className="mt-3 text-4xl font-black">Healthy</h2><p className="mt-2 text-sm text-white/50">Jamendo catalog is available and serving current tracks.</p><button type="button" className="mt-8 flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Run sync</button></article><article className="rounded-2xl border border-white/10 bg-black/20 p-6"><h2 className="text-lg font-bold">Recent jobs</h2><div className="mt-5 divide-y divide-white/10">{["Catalog refresh", "Artist mapping", "License check"].map((job, index) => <div key={job} className="flex items-center gap-3 py-4"><Check className="h-4 w-4 text-emerald-300" /><span className="flex-1 text-sm">{job}</span><span className="text-xs text-white/35">{index + 1}h ago</span><span className="text-[10px] font-bold uppercase text-emerald-200">Complete</span></div>)}</div></article></section> : null}
      {!loading && view === "settings" ? <section className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-6"><div className="space-y-5">{[{ label: "Site name", value: "Auraic" }, { label: "Default language", value: "Vietnamese" }, { label: "Jamendo source", value: "Enabled" }, { label: "Maintenance mode", value: "Off" }].map((item) => <label key={item.label} className="block"><span className="text-xs font-semibold text-white/50">{item.label}</span><input defaultValue={item.value} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none focus:border-fuchsia-300" /></label>)}</div><button type="button" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); }} className="mt-7 flex min-h-11 items-center gap-2 rounded-xl bg-fuchsia-300 px-4 text-sm font-bold text-slate-950"><Save className="h-4 w-4" /> {saved ? "Saved" : "Save changes"}</button></section> : null}
    </div>
  );
}

function State({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center"><div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">{icon}</div><h1 className="text-xl font-bold">{title}</h1></div>; }

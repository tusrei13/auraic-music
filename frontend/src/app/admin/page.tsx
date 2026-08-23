"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Heart,
  Library,
  Loader2,
  Music2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ApiError, getAdminArtists, getAdminOverview, getAdminPlaylists, getAdminSongs, getAdminTopJamendo, getAdminUsers, updateAdminUserRole, type AdminArtist, type AdminOverview, type AdminPlaylist, type AdminSong, type AdminTopSong, type AdminUser } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const metrics = [
  { key: "users", label: "Người dùng", icon: Users, tone: "text-cyan-300" },
  { key: "songs", label: "Bài hát", icon: Music2, tone: "text-amber-300" },
  { key: "playlists", label: "Playlist", icon: Library, tone: "text-fuchsia-300" },
  { key: "likes", label: "Lượt yêu thích", icon: Heart, tone: "text-rose-300" },
] as const;

export default function AdminPage() {
  const { user, status, initialize, signOut } = useAuthStore();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [playlists, setPlaylists] = useState<AdminPlaylist[]>([]);
  const [topJamendo, setTopJamendo] = useState<AdminTopSong[]>([]);
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");

  const loadOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextOverview, nextUsers, nextSongs, nextPlaylists, nextTopJamendo, nextArtists] = await Promise.all([getAdminOverview(), getAdminUsers(), getAdminSongs(), getAdminPlaylists(), getAdminTopJamendo(), getAdminArtists()]);
      setOverview(nextOverview);
      setUsers(nextUsers.users);
      setSongs(nextSongs.songs);
      setPlaylists(nextPlaylists.playlists);
      setTopJamendo(nextTopJamendo.songs);
      setArtists(nextArtists.artists);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 403) {
        setError("Tài khoản này không có quyền quản trị.");
      } else if (requestError instanceof ApiError && requestError.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.");
      } else {
        setError("Không thể tải dữ liệu quản trị. Hãy thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: "USER" | "ADMIN") => {
    setUpdatingUserId(userId);
    try {
      const response = await updateAdminUserRole(userId, role);
      setUsers((currentUsers) => currentUsers.map((currentUser) => currentUser.id === userId ? { ...currentUser, role: response.user.role } : currentUser));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Không thể cập nhật quyền người dùng.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((adminUser) => {
    const query = userSearch.trim().toLowerCase();
    const matchesSearch = !query || `${adminUser.name || ""} ${adminUser.email}`.toLowerCase().includes(query);
    return matchesSearch && (userRoleFilter === "ALL" || adminUser.role === userRoleFilter);
  });

  useEffect(() => {
    if (status === "idle") void initialize();
  }, [initialize, status]);

  useEffect(() => {
    if (status === "authenticated" && user?.role === "ADMIN") void loadOverview();
    if (status === "unauthenticated") setIsLoading(false);
  }, [status, user?.role]);

  if (status === "idle" || status === "loading") {
    return <AdminState icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Đang xác thực quyền truy cập" />;
  }

  if (status === "unauthenticated") {
    return (
      <AdminState
        icon={<ShieldCheck className="h-6 w-6 text-cyan-300" />}
        title="Đăng nhập để mở khu vực quản trị"
        action={<Link href="/login" className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Đăng nhập</Link>}
      />
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <AdminState
        icon={<AlertCircle className="h-6 w-6 text-rose-300" />}
        title="Bạn không có quyền truy cập trang này"
        action={<Link href="/" className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Về trang chủ</Link>}
      />
    );
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_20%_40%,rgba(217,70,239,0.1),transparent_30%)] px-5 py-8 text-white sm:px-8">
      <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300"><ShieldCheck className="h-4 w-4" /> Auraic Control Room</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Tổng quan hệ thống</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">Theo dõi sức khỏe cộng đồng, thư viện âm nhạc và những tín hiệu tương tác quan trọng.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void loadOverview()} disabled={isLoading} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50" aria-label="Làm mới số liệu"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Làm mới</button>
          <button type="button" onClick={signOut} className="min-h-11 rounded-xl border border-rose-300/20 px-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-300/10">Đăng xuất</button>
        </div>
      </header>

      {error ? (
        <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 text-sm text-rose-100"><AlertCircle className="h-5 w-5 shrink-0" /> {error}</p>
          <button type="button" onClick={() => void loadOverview()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-200 px-4 text-sm font-bold text-rose-950 hover:bg-rose-100"><RefreshCw className="h-4 w-4" /> Thử lại</button>
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số hệ thống">
        {metrics.map(({ key, label, icon: Icon, tone }) => (
          <article key={key} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between"><span className="text-sm text-white/55">{label}</span><Icon className={`h-5 w-5 ${tone}`} /></div>
            <p className="mt-5 text-4xl font-black tabular-nums">{overview?.metrics[key] ?? "--"}</p>
            <p className="mt-2 text-xs text-white/35">Dữ liệu hiện tại</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-cyan-300" /><h2 className="text-lg font-bold">Lộ trình quản trị</h2></div>
          <div className="mt-6 space-y-4">
            {["Quản lý người dùng và phân quyền", "Kiểm duyệt thư viện bài hát và nghệ sĩ", "Theo dõi lượt nghe, yêu thích và playlist", "Thiết lập báo cáo và cảnh báo hệ thống"].map((item, index) => (
              <div key={item} className="flex items-center gap-4 border-b border-white/8 pb-4 last:border-0 last:pb-0"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-bold text-cyan-200">{index + 1}</span><span className="text-sm text-white/70">{item}</span><span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-white/30">Tiếp theo</span></div>
            ))}
          </div>
        </article>
        <div className="space-y-5"><article className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Phiên hiện tại</p><h2 className="mt-4 text-xl font-bold">{user.name || user.email}</h2><p className="mt-2 break-all text-sm text-white/50">{user.email}</p><div className="mt-6 flex items-center gap-2 text-xs text-cyan-100"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Quyền ADMIN đang hoạt động</div></article><article className="rounded-2xl border border-white/10 bg-black/20 p-6"><div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-amber-300" /><h2 className="text-lg font-bold">Top bài hát Jamendo</h2></div><div className="mt-5 space-y-4">{topJamendo.map((song, index) => <div key={song.trackId} className="flex items-center gap-3"><span className="w-5 text-xs font-bold text-white/35">{index + 1}</span><img src={song.image} alt="" className="h-9 w-9 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{song.title}</p><p className="truncate text-xs text-white/40">{song.artistName}</p></div><span className="text-xs tabular-nums text-amber-200">{song.plays.toLocaleString("vi-VN")}</span></div>)}{topJamendo.length === 0 && !isLoading ? <p className="text-sm text-white/40">Chưa có dữ liệu lượt nghe.</p> : null}</div></article></div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Người dùng gần đây</h2><p className="mt-1 text-sm text-white/45">50 tài khoản mới nhất trong hệ thống.</p></div><span className="text-xs font-semibold text-white/40">{filteredUsers.length} / {users.length} tài khoản</span></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300" aria-label="Tìm người dùng" /><select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value as "ALL" | "USER" | "ADMIN")} className="min-h-11 rounded-xl border border-white/10 bg-[#121522] px-3 text-sm text-white/70 outline-none focus:border-cyan-300" aria-label="Lọc theo vai trò"><option value="ALL">Tất cả vai trò</option><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3 font-semibold">Tài khoản</th><th className="px-3 py-3 font-semibold">Vai trò</th><th className="px-3 py-3 font-semibold">Playlist</th><th className="px-3 py-3 font-semibold">Yêu thích</th><th className="px-3 py-3 font-semibold">Tham gia</th></tr></thead><tbody className="divide-y divide-white/5">{filteredUsers.map((adminUser) => (<tr key={adminUser.id} className="text-white/70"><td className="px-3 py-4"><p className="font-semibold text-white">{adminUser.name || "Chưa đặt tên"}</p><p className="mt-1 text-xs text-white/40">{adminUser.email}</p></td><td className="px-3 py-4"><select value={adminUser.role} disabled={updatingUserId === adminUser.id || adminUser.id === user.id} onChange={(event) => void handleRoleChange(adminUser.id, event.target.value as "USER" | "ADMIN")} className={`min-h-9 rounded-lg border border-white/10 bg-[#121522] px-2 text-[11px] font-bold outline-none focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 ${adminUser.role === "ADMIN" ? "text-cyan-200" : "text-white/55"}`} aria-label={`Vai trò của ${adminUser.email}`}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></td><td className="px-3 py-4 tabular-nums">{adminUser._count.playlists}</td><td className="px-3 py-4 tabular-nums">{adminUser._count.likes}</td><td className="px-3 py-4 text-xs text-white/45">{new Date(adminUser.createdAt).toLocaleDateString("vi-VN")}</td></tr>))}</tbody></table>
          {filteredUsers.length === 0 && !isLoading ? <p className="py-8 text-center text-sm text-white/40">Không tìm thấy người dùng phù hợp.</p> : null}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Nghệ sĩ nổi bật</h2><p className="mt-1 text-sm text-white/45">Xếp theo số người nghe trong thư viện.</p></div><span className="text-xs font-semibold text-white/40">{artists.length} nghệ sĩ</span></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3 font-semibold">Nghệ sĩ Jamendo</th><th className="px-3 py-3 font-semibold">Bài trong catalog</th><th className="px-3 py-3 font-semibold">Album</th></tr></thead><tbody className="divide-y divide-white/5">{artists.map((artist) => (<tr key={artist.id} className="text-white/70"><td className="px-3 py-4"><div className="flex items-center gap-3"><img src={artist.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /><span className="font-semibold text-white">{artist.name}</span></div></td><td className="px-3 py-4 tabular-nums">{artist.trackCount}</td><td className="px-3 py-4 tabular-nums">{artist.albumCount}</td></tr>))}</tbody></table>{artists.length === 0 && !isLoading ? <p className="py-8 text-center text-sm text-white/40">Jamendo chưa trả về nghệ sĩ nào.</p> : null}</div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Playlist hoạt động gần đây</h2><p className="mt-1 text-sm text-white/45">Theo dõi các playlist được cập nhật mới nhất.</p></div><span className="text-xs font-semibold text-white/40">{playlists.length} playlist</span></div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3 font-semibold">Playlist</th><th className="px-3 py-3 font-semibold">Chủ sở hữu</th><th className="px-3 py-3 font-semibold">Bài hát</th><th className="px-3 py-3 font-semibold">Cập nhật</th></tr></thead><tbody className="divide-y divide-white/5">{playlists.map((playlist) => (<tr key={playlist.id} className="text-white/70"><td className="px-3 py-4 font-semibold text-white">{playlist.name}</td><td className="px-3 py-4"><p>{playlist.user.name || "Chưa đặt tên"}</p><p className="mt-1 text-xs text-white/40">{playlist.user.email}</p></td><td className="px-3 py-4 tabular-nums">{playlist._count.songs}</td><td className="px-3 py-4 text-xs text-white/45">{new Date(playlist.updatedAt).toLocaleDateString("vi-VN")}</td></tr>))}</tbody></table>
          {playlists.length === 0 && !isLoading ? <p className="py-8 text-center text-sm text-white/40">Chưa có dữ liệu playlist.</p> : null}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Thư viện bài hát gần đây</h2><p className="mt-1 text-sm text-white/45">Rà soát nội dung đã được đồng bộ vào database.</p></div><span className="text-xs font-semibold text-white/40">{songs.length} bài hát</span></div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3 font-semibold">Bài hát</th><th className="px-3 py-3 font-semibold">Thể loại</th><th className="px-3 py-3 font-semibold">Lượt nghe</th><th className="px-3 py-3 font-semibold">Lyrics</th><th className="px-3 py-3 font-semibold">Ngày thêm</th></tr></thead><tbody className="divide-y divide-white/5">{songs.map((song) => (<tr key={song.id} className="text-white/70"><td className="px-3 py-4"><div className="flex items-center gap-3"><img src={song.image} alt="" className="h-10 w-10 rounded-lg object-cover" /><div><p className="font-semibold text-white">{song.title}</p><p className="mt-1 text-xs text-white/40">{song.artist.name}</p></div></div></td><td className="px-3 py-4 text-white/55">{song.genre?.name || "Chưa phân loại"}</td><td className="px-3 py-4 tabular-nums">{song.playCount.toLocaleString("vi-VN")}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${song.lyrics ? "bg-emerald-300/15 text-emerald-200" : "bg-white/8 text-white/40"}`}>{song.lyrics ? "Có" : "Thiếu"}</span></td><td className="px-3 py-4 text-xs text-white/45">{new Date(song.createdAt).toLocaleDateString("vi-VN")}</td></tr>))}</tbody></table>
          {songs.length === 0 && !isLoading ? <p className="py-8 text-center text-sm text-white/40">Chưa có dữ liệu bài hát.</p> : null}
        </div>
      </section>
    </div>
  );
}

function AdminState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"><div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">{icon}</div><h1 className="text-xl font-bold text-white">{title}</h1>{action}</div>;
}

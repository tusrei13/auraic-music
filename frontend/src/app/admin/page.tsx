"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileAudio, Loader2, Shield, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { getArtists, getGenres, uploadSong, type Artist, type Genre } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [genreId, setGenreId] = useState("");
  const [image, setImage] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [router, status]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    Promise.all([getArtists(), getGenres()]).then(([artistData, genreData]) => {
      setArtists(artistData);
      setGenres(genreData);
      if (artistData[0]) setArtistId(artistData[0].id);
    }).catch(() => setMessage("Không thể tải dữ liệu catalog"));
  }, [user?.role]);

  if (status === "loading" || status === "idle") {
    return <div className="flex h-full items-center justify-center text-white/50"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xác thực...</div>;
  }

  if (user?.role !== "ADMIN") {
    return <div className="flex h-full items-center justify-center p-6 text-center text-white/60">Tài khoản của em không có quyền quản trị.</div>;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audio || !title.trim() || !artistId) {
      setState("error");
      setMessage("Cần chọn file audio, nhập tên bài hát và chọn nghệ sĩ.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("title", title.trim());
    formData.append("artistId", artistId);
    if (genreId) formData.append("genreId", genreId);
    if (image.trim()) formData.append("image", image.trim());

    setState("loading");
    setMessage("Đang chuyển mã audio thành HLS...");
    try {
      await uploadSong(formData);
      setState("success");
      setMessage("Đã thêm bài hát vào catalog.");
      setTitle("");
      setImage("");
      setAudio(null);
      const input = document.getElementById("audio-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload bài hát thất bại");
    }
  };

  return (
    <div className="min-h-full p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start gap-4 border-b border-white/10 pb-6">
          <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/15 p-3 text-indigo-300"><Shield className="h-6 w-6" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">Catalog studio</p><h1 className="mt-1 text-3xl font-black">Thêm bài hát mới</h1><p className="mt-2 text-sm text-white/50">Upload file audio và đưa nội dung mới vào Auraic.</p></div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <label className="block text-sm font-semibold">Tên bài hát<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-400" placeholder="Ví dụ: Chúng Ta Của Tương Lai" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Nghệ sĩ<select required value={artistId} onChange={(event) => setArtistId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-400"><option value="">Chọn nghệ sĩ</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
              <label className="block text-sm font-semibold">Thể loại<select value={genreId} onChange={(event) => setGenreId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-400"><option value="">Không chọn</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select></label>
            </div>
            <label className="block text-sm font-semibold">URL ảnh cover<input value={image} onChange={(event) => setImage(event.target.value)} type="url" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-indigo-400" placeholder="https://..." /></label>
            <button disabled={state === "loading"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><Upload className="h-4 w-4" />{state === "loading" ? "Đang xử lý..." : "Upload bài hát"}</button>
            {message && <p className={`flex items-center gap-2 text-sm ${state === "error" ? "text-rose-300" : state === "success" ? "text-emerald-300" : "text-white/60"}`}>{state === "error" ? <AlertCircle className="h-4 w-4" /> : state === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}{message}</p>}
          </div>

          <label htmlFor="audio-file" className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-400/40 bg-indigo-500/[0.06] p-6 text-center transition hover:bg-indigo-500/10"><FileAudio className="mb-3 h-9 w-9 text-indigo-300" /><span className="text-sm font-semibold">{audio ? audio.name : "Chọn file MP3 hoặc WAV"}</span><span className="mt-2 text-xs text-white/40">Tối đa 100 MB</span><input id="audio-file" required type="file" accept="audio/*" onChange={(event) => setAudio(event.target.files?.[0] || null)} className="sr-only" /></label>
        </form>
      </div>
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Disc3, Heart, Loader2, Music2, Play } from "lucide-react";
import TrackActionMenu from "@/components/TrackActionMenu";
import { formatDuration, getJamendoTracks, type JamendoSong } from "@/lib/api";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const albumId = decodeURIComponent(id);
  const searchParams = useSearchParams();
  const albumNameHint = searchParams.get("name") || "Album Auraic";
  const [tracks, setTracks] = useState<JamendoSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { currentTrack, isPlaying, playTrack, likedIds, toggleLike } = usePlayerStore();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    const loadAlbum = async () => {
      try {
        let songs = await getJamendoTracks({ limit: 200, albumId });
        if (songs.length === 0 && albumNameHint !== "Album Auraic") {
          const fallbackSongs = await getJamendoTracks({ limit: 200, search: albumNameHint });
          songs = fallbackSongs.filter((song) => song.album?.title.toLowerCase() === albumNameHint.toLowerCase());
        }
        if (active) setTracks(songs);
      } catch {
        if (active) {
          setTracks([]);
          setFailed(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAlbum();
    return () => { active = false; };
  }, [albumId, albumNameHint]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-2 text-white/55"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /><span>Đang tải album...</span></div>;
  }

  const album = tracks[0]?.album;
  const artist = tracks[0]?.artist;
  const albumTitle = album?.title || albumNameHint;
  const coverImage = album?.coverImage || tracks[0]?.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop";
  const isLiked = (trackId: string) => likedIds.some((likedId) => String(likedId) === trackId);

  return (
    <div className="min-h-full space-y-8 bg-[#09090b] p-6 pb-28 text-white sm:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/80 via-indigo-950/45 to-[#0b0b10] p-6 shadow-2xl sm:p-8">
        <div className="absolute inset-0 opacity-20 blur-3xl" style={{ backgroundImage: `url(${coverImage})`, backgroundPosition: "center", backgroundSize: "cover" }} />
        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-end">
          <img src={coverImage} alt={`Bìa album ${albumTitle}`} className="aspect-square w-44 rounded-2xl object-cover shadow-2xl sm:w-56" />
          <div className="min-w-0 flex-1 space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-300 md:justify-start"><Disc3 className="h-4 w-4" aria-hidden="true" /> Album</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{albumTitle}</h1>
            {artist ? <Link href={`/artist/${encodeURIComponent(artist.id)}?name=${encodeURIComponent(artist.name)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">{artist.name}</Link> : null}
            <p className="text-sm text-white/50">{tracks.length} bài hát</p>
            <button type="button" disabled={!tracks.length} onClick={() => tracks[0] && playTrack(tracks[0] as any, tracks as any, albumTitle)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-500 px-6 font-bold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50"><Play className="h-4 w-4 fill-current" aria-hidden="true" /> Phát album</button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Music2 className="h-5 w-5 text-indigo-400" aria-hidden="true" /> Danh sách bài hát</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          {tracks.length ? tracks.map((track, index) => {
            const current = String(currentTrack?.id) === track.id;
            return <div key={track.id} onClick={() => playTrack(track as any, tracks as any, albumTitle)} className={`group grid cursor-pointer grid-cols-12 items-center border-b border-white/5 px-4 py-3 last:border-0 ${current ? "bg-indigo-500/15" : "hover:bg-white/5"}`}>
              <div className="col-span-1 text-xs font-mono text-white/40">{current && isPlaying ? "▶" : String(index + 1).padStart(2, "0")}</div>
              <div className="col-span-7 flex min-w-0 items-center gap-3 sm:col-span-8"><img src={track.image} alt="" className="h-11 w-11 rounded-lg object-cover" /><div className="min-w-0"><h3 className={`truncate text-sm font-semibold ${current ? "text-indigo-300" : "text-white"}`}>{track.title}</h3><p className="truncate text-xs text-white/45">{track.artist.name}</p></div></div>
              <div className="col-span-4 flex items-center justify-end gap-2 sm:col-span-3">
                <button type="button" aria-label={isLiked(track.id) ? `Bỏ yêu thích ${track.title}` : `Yêu thích ${track.title}`} onClick={(event) => { event.stopPropagation(); toggleLike(track as any); }} className="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.08] hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"><Heart aria-hidden="true" className={`h-4 w-4 ${isLiked(track.id) ? "fill-pink-500 text-pink-500" : ""}`} /></button>
                <span className="hidden text-xs font-mono text-white/45 sm:inline">{formatDuration(track.duration)}</span>
                <TrackActionMenu track={track as any} />
              </div>
            </div>;
          }) : <div className="p-10 text-center text-sm text-white/50">{failed ? "Không thể tải album này từ Auraic." : "Album này chưa có bài hát khả dụng."}</div>}
        </div>
      </section>
    </div>
  );
}

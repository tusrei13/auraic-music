"use client";

import { useEffect, useState } from "react";
import { Disc3, Loader2, Music2, Play, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Artwork from "@/components/Artwork";
import { AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { EngineAlbum, EngineArtist, EngineTrack } from "@/types/sound-engine";

interface SearchPayload {
  songs: EngineTrack[];
  artists: EngineArtist[];
  albums: EngineAlbum[];
}

const emptyPayload: SearchPayload = { songs: [], artists: [], albums: [] };

export default function SearchPage() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() || "";
  const playTrack = usePlayerStore((state) => state.playTrack);
  const [payload, setPayload] = useState<SearchPayload>(emptyPayload);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) { setPayload(emptyPayload); setLoading(false); return; }
    let isMounted = true;
    setLoading(true);
    fetch(`/api/sound-engine/search?q=${encodeURIComponent(query)}&type=all`)
      .then((response) => response.ok ? response.json() : emptyPayload)
      .then((data) => { if (isMounted) setPayload({ songs: data.songs || [], artists: data.artists || [], albums: data.albums || [] }); })
      .catch((error: unknown) => { if (isMounted && (error as { name?: string }).name !== "AbortError") setPayload(emptyPayload); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [query]);

  const playSong = (track: EngineTrack) => playTrack(AuraicAudioAdapter.toPlayerTrack(track), payload.songs.map(AuraicAudioAdapter.toPlayerTrack), "Kết quả tìm kiếm");

  return (
    <main className="min-h-full px-5 pb-36 pt-8 text-white sm:px-8 lg:px-12">
      <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/70">Kết quả tìm kiếm</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{query || "Tìm kiếm âm nhạc"}</h1></div>
      {loading ? <div className="flex items-center gap-2 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" />Đang tìm kiếm...</div> : <div className="space-y-10">
        {payload.songs.length > 0 && <section><div className="mb-3 flex items-center gap-2"><Music2 className="h-5 w-5 text-cyan-200" /><h2 className="text-xl font-bold">Bài hát</h2></div><div className="grid gap-2">{payload.songs.map((track) => <button key={track.id} type="button" onClick={() => playSong(track)} className="group flex items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[0.07]"><Artwork src={track.artwork?.["480x480"] || "/favicon.ico"} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{track.title}</span><span className="block truncate text-sm text-white/45">{track.artist || track.user?.name || "Nghệ sĩ"}</span></span><Play className="h-4 w-4 fill-white opacity-0 group-hover:opacity-100" /></button>)}</div></section>}
        {payload.artists.length > 0 && <section><div className="mb-3 flex items-center gap-2"><User className="h-5 w-5 text-cyan-200" /><h2 className="text-xl font-bold">Nghệ sĩ</h2></div><div className="grid gap-2 sm:grid-cols-2">{payload.artists.map((artist) => <div key={artist.id} className="flex items-center gap-3 rounded-xl p-2"><Artwork src={artist.profile_picture?.["480x480"] || "/favicon.ico"} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" /><span className="truncate font-semibold">{artist.name}</span></div>)}</div></section>}
        {payload.albums.length > 0 && <section><div className="mb-3 flex items-center gap-2"><Disc3 className="h-5 w-5 text-cyan-200" /><h2 className="text-xl font-bold">Album</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{payload.albums.map((album) => <div key={album.id} className="flex items-center gap-3 rounded-xl p-2"><Artwork src={album.artwork?.["480x480"] || "/favicon.ico"} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" /><span className="min-w-0"><span className="block truncate font-semibold">{album.playlist_name}</span><span className="block truncate text-sm text-white/45">{album.user?.name || "Nghệ sĩ"}</span></span></div>)}</div></section>}
        {!payload.songs.length && !payload.artists.length && !payload.albums.length && <p className="text-sm text-white/50">Không tìm thấy kết quả phù hợp.</p>}
      </div>}
    </main>
  );
}
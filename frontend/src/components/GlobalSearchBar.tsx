"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Search, X } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getJamendoTracks, type JamendoSong } from "@/lib/api";

export default function GlobalSearchBar() {
  const router = useRouter();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JamendoSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let active = true;
    const timeoutId = window.setTimeout(() => {
      getJamendoTracks({ limit: 8, search: normalizedQuery })
        .then((tracks) => {
          if (active) setResults(tracks);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    const closeResults = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeResults);
    return () => document.removeEventListener("mousedown", closeResults);
  }, []);

  const chooseTrack = (track: JamendoSong) => {
    playTrack(track as any, results as any, "Tìm kiếm Jamendo");
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const chooseArtist = (artist: JamendoSong["artist"]) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/artist/${encodeURIComponent(artist.id)}?name=${encodeURIComponent(artist.name)}`);
  };

  const chooseAlbum = (album: NonNullable<JamendoSong["album"]>) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/album/${encodeURIComponent(album.id)}?name=${encodeURIComponent(album.title)}`);
  };

  const artists = Array.from(new Map(results.map((track) => [track.artist.id, track.artist])).values()).slice(0, 4);
  const albums = Array.from(new Map(results.filter((track) => track.album).map((track) => [track.album?.id, track.album])).values()).slice(0, 4);

  return (
    <div ref={containerRef} className="relative z-30 px-6 pt-5 sm:px-8">
      <div className="relative mx-auto max-w-3xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder="Tìm bài hát, nghệ sĩ hoặc album trên Jamendo..."
          aria-label="Tìm kiếm nhạc Jamendo"
          aria-expanded={open && Boolean(query.trim())}
          aria-controls="global-search-results"
          role="combobox"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-11 pr-11 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-white/35 focus:border-indigo-400/70 focus:bg-white/[0.09]"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-300" />
        ) : query ? (
          <button type="button" onClick={() => setQuery("")} aria-label="Xóa nội dung tìm kiếm" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/35 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}

        {open && query.trim() && !loading && (
          <div id="global-search-results" role="listbox" aria-label="Kết quả tìm kiếm Jamendo" className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#15151d]/95 p-3 shadow-2xl backdrop-blur-2xl">
            {results.length > 0 ? (
              <div className="space-y-4">
                {artists.length > 0 && <div>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Nghệ sĩ</p>
                  {artists.map((artist) => <button key={artist.id} role="option" type="button" onClick={() => chooseArtist(artist)} className="flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
                    <img src={artist.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <span className="truncate text-sm font-semibold text-white">{artist.name}</span>
                  </button>)}
                </div>}
                <div>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Bài hát</p>
                  {results.slice(0, 8).map((track) => <button key={track.id} role="option" type="button" onClick={() => chooseTrack(track)} className="group flex min-h-12 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
                    <img src={track.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{track.title}</span><span className="block truncate text-xs text-white/45">{track.artist.name}</span></span>
                    <Play aria-hidden="true" className="h-4 w-4 shrink-0 fill-white text-white/60 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </button>)}
                </div>
                {albums.length > 0 && <div>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Album</p>
                  {albums.map((album) => { if (!album) return null; return <button key={album.id} role="option" type="button" onClick={() => chooseAlbum(album)} className="flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
                    <img src={album.coverImage} alt="" className="h-9 w-9 rounded-lg object-cover" /><span className="truncate text-sm font-semibold text-white">{album.title}</span>
                  </button>; })}
                </div>}
              </div>
            ) : (
              <p className="px-3 py-4 text-center text-xs text-white/45">Không tìm thấy bài hát phù hợp trên Jamendo.</p>
            )}
          </div>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? "Đang tìm kiếm" : query.trim() ? `Tìm thấy ${results.length} bài hát` : ""}
      </p>
    </div>
  );
}

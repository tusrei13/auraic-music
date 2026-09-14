"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Loader2, LogIn, LogOut, Mic, Play, Search, Settings2, User, X } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { searchAll, type Album, type Artist, type JamendoSong } from "@/lib/api";
import Artwork from "@/components/Artwork";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

const fallbackArtwork = "/favicon.ico";

function ArtistAvatar({ artist }: { artist: Artist }) {
  const [failed, setFailed] = useState(false);
  const initials = artist.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "♪";
  if (!artist.avatar || failed) {
    return <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/80 to-indigo-500/80 text-[11px] font-black text-white">{initials}</span>;
  }
  return <Artwork src={artist.avatar} alt="" onError={() => setFailed(true)} className="h-9 w-9 shrink-0 rounded-full object-cover" width={36} height={36} />;
}

export default function GlobalSearchBar() {
  const router = useRouter();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const { user, status, openAuthModal, signOut } = useAuthStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JamendoSong[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceSearch = useVoiceSearch("vi-VN");
  const hasAutoSearchedRef = useRef(false);

  const executeSearch = useCallback((searchTerm: string) => {
    const normalized = searchTerm.trim();
    if (!normalized) {
      setResults([]);
      setArtists([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchAll(normalized)
      .then((searchResult) => {
        setResults(searchResult.songs as JamendoSong[]);
        setArtists(searchResult.artists);
        setAlbums(searchResult.albums);
      })
      .catch(() => {
        setResults([]);
        setArtists([]);
        setAlbums([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Update query when voice recognition updates
  useEffect(() => {
    if (voiceSearch.transcript) {
      setQuery(voiceSearch.transcript);
      setOpen(true);
    }
  }, [voiceSearch.transcript]);

  // When voice search finishes listening, immediately trigger search for instant response.
  // Also covers the case where onend fires before the final onresult transcript arrives.
  useEffect(() => {
    if (!voiceSearch.isListening && voiceSearch.transcript && !hasAutoSearchedRef.current) {
      hasAutoSearchedRef.current = true;
      setQuery(voiceSearch.transcript);
      setOpen(true);
      executeSearch(voiceSearch.transcript);
    }
    if (voiceSearch.isListening) {
      hasAutoSearchedRef.current = false;
    }
  }, [voiceSearch.isListening, voiceSearch.transcript, executeSearch]);

  // Debounced search for manual typing
  useEffect(() => {
    if (voiceSearch.isListening) return; // Don't debounce while voice is streaming

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setResults([]);
      setArtists([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let active = true;
    const timeoutId = window.setTimeout(() => {
      searchAll(normalizedQuery)
        .then((searchResult) => {
          if (active) {
            setResults(searchResult.songs as JamendoSong[]);
            setArtists(searchResult.artists);
            setAlbums(searchResult.albums);
          }
        })
        .catch(() => {
          if (active) {
            setResults([]);
            setArtists([]);
            setAlbums([]);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query, voiceSearch.isListening]);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const chooseTrack = (track: JamendoSong) => {
    playTrack(track as any, results as any, "Tìm kiếm Auraic");
    setQuery("");
    setResults([]);
    setArtists([]);
    setAlbums([]);
    setOpen(false);
  };

  const chooseArtist = (artist: JamendoSong["artist"]) => {
    setQuery("");
    setResults([]);
    setArtists([]);
    setAlbums([]);
    setOpen(false);
    router.push(`/artist/${encodeURIComponent(artist.id)}?name=${encodeURIComponent(artist.name)}`);
  };

  const chooseAlbum = (album: NonNullable<JamendoSong["album"]>) => {
    setQuery("");
    setResults([]);
    setArtists([]);
    setAlbums([]);
    setOpen(false);
    router.push(`/album/${encodeURIComponent(album.id)}?name=${encodeURIComponent(album.title)}`);
  };

  const hasResults = results.length > 0 || artists.length > 0 || albums.length > 0;
  const accountLabel = user?.name || user?.email || "Tài khoản";
  const accountInitials = accountLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090910]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex min-h-12 items-center gap-3">
        <div ref={containerRef} className="relative min-w-0 flex-1 sm:w-[min(480px,52vw)] sm:flex-none">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
            } else if (event.key === "Enter" && query.trim()) {
              executeSearch(query);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={voiceSearch.isListening ? "Đang nghe giọng nói của bạn..." : "Tìm bài hát, nghệ sĩ hoặc album..."}
          aria-label="Tìm kiếm nhạc"
          aria-expanded={open && Boolean(query.trim())}
          aria-controls="global-search-results"
          role="combobox"
          className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.07] py-3 pl-11 pr-24 text-sm text-white outline-none backdrop-blur-xl transition-[border-color,box-shadow,background-color] placeholder:text-white/35 focus:border-fuchsia-400/70 focus:bg-white/[0.1] focus:shadow-[0_0_0_3px_rgba(217,70,239,0.12)]"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-300" />
        ) : (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {voiceSearch.state !== "unsupported" ? (
              <button
                type="button"
                onClick={voiceSearch.toggle}
                aria-label={voiceSearch.isListening ? "Dừng ghi âm" : "Tìm kiếm bằng giọng nói"}
                title={voiceSearch.isListening ? "Dừng ghi âm" : "Tìm kiếm bằng giọng nói"}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${voiceSearch.isListening ? "text-rose-300 hover:bg-rose-400/15" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
              >
                {voiceSearch.isListening && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/40 opacity-75" />
                )}
                <Mic className="relative h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.focus();
                }}
                aria-label="Trình duyệt không hỗ trợ tìm kiếm bằng giọng nói. Nhấn để gõ tìm kiếm."
                title="Trình duyệt này chưa hỗ trợ tìm kiếm bằng giọng nói. Vui lòng dùng Chrome hoặc Edge."
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/25 transition hover:bg-white/[0.08] hover:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Xóa nội dung tìm kiếm" className="flex h-9 w-9 items-center justify-center rounded-full text-white/35 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}

        {open && query.trim() && (
          <div id="global-search-results" role="listbox" aria-label="Kết quả tìm kiếm" className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#15151d]/95 p-3 shadow-2xl">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Đang tìm kiếm &ldquo;{query.trim()}&rdquo;...</span>
              </div>
            ) : hasResults ? (
              <div className="space-y-4">
                {artists.slice(0, 4).length > 0 && <div>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Nghệ sĩ</p>
                  {artists.slice(0, 4).map((artist) => <button key={artist.id} role="option" aria-selected={false} type="button" onClick={() => chooseArtist(artist)} className="flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
                    <ArtistAvatar artist={artist} />
                    <span className="truncate text-sm font-semibold text-white">{artist.name}</span>
                  </button>)}
                </div>}
                {results.slice(0, 8).length > 0 && <div>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Bài hát</p>
                  {results.slice(0, 8).map((track) => <button key={track.id} role="option" aria-selected={false} type="button" onClick={() => chooseTrack(track)} className="group flex min-h-12 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
                    <Artwork src={track.image || fallbackArtwork} alt="" className="h-10 w-10 rounded-lg object-cover" width={40} height={40} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{track.title}</span><span className="block truncate text-xs text-white/45">{track.artist.name}</span></span>
                    <Play aria-hidden="true" className="h-4 w-4 shrink-0 fill-white text-white/60 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </button>)}
                </div>}
                {albums.slice(0, 4).length > 0 && <div>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Album</p>
                  {albums.slice(0, 4).map((album) => <button key={album.id} role="option" aria-selected={false} type="button" onClick={() => chooseAlbum(album)} className="flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
                    <Artwork src={album.coverImage || fallbackArtwork} alt="" className="h-9 w-9 rounded-lg object-cover" width={36} height={36} /><span className="truncate text-sm font-semibold text-white">{album.title}</span>
                  </button>)}
                </div>}
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-xs text-white/45">Không tìm thấy bài hát, nghệ sĩ hoặc album phù hợp cho &ldquo;{query.trim()}&rdquo;.</p>
            )}
          </div>
        )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {status === "authenticated" && user ? (
            <>
              <button type="button" aria-label="Thông báo" title="Thông báo" className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400">
                <Bell className="h-[18px] w-[18px]" />
              </button>
              <div ref={accountMenuRef} className="relative">
                <button type="button" onClick={() => setAccountMenuOpen((isOpen) => !isOpen)} aria-expanded={accountMenuOpen} aria-haspopup="menu" className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] pl-1 pr-2 text-left transition hover:border-white/20 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400">
                  <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 text-xs font-black text-slate-950">{accountInitials}</span>
                  <span className="hidden max-w-24 truncate text-xs font-semibold text-white/80 md:block">{accountLabel}</span>
                  <ChevronDown className={`hidden h-3.5 w-3.5 text-white/45 transition sm:block ${accountMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {accountMenuOpen && (
                  <div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-xl border border-white/10 bg-[#171720]/95 p-2 shadow-2xl">
                    <div className="border-b border-white/10 px-3 pb-2 pt-1">
                      <p className="truncate text-sm font-semibold text-white">{accountLabel}</p>
                      <p className="truncate text-xs text-white/40">{user.email}</p>
                    </div>
                    <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); router.push("/profile"); }} className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"><User className="h-4 w-4" />Trang cá nhân</button>
                    <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); router.push("/settings"); }} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"><Settings2 className="h-4 w-4" />Cài đặt</button>
                    <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); signOut(); }} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-rose-300/80 transition hover:bg-rose-400/10 hover:text-rose-200"><LogOut className="h-4 w-4" />Đăng xuất</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button type="button" onClick={openAuthModal} className="flex h-10 items-center gap-2 rounded-full bg-fuchsia-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-fuchsia-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090910]"><LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Đăng nhập</span></button>
          )}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? "Đang tìm kiếm" : voiceSearch.isListening ? "Đang nghe giọng nói..." : query.trim() ? `Tìm thấy ${results.length} bài hát` : ""}
      </p>
      {voiceSearch.errorMessage && (
        <p className="mt-2 text-center text-xs text-rose-300/80">{voiceSearch.errorMessage}</p>
      )}
    </header>
  );
}

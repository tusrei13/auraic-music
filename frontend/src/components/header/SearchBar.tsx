"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Loader2, LogIn, LogOut, Mic, Play, Search, Settings2, User, X } from "lucide-react";
import Artwork from "@/components/Artwork";
import { useDebounce } from "@/hooks/useDebounce";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { EngineAlbum, EngineArtist, EngineTrack } from "@/types/sound-engine";

const recentStorageKey = "auraic-recent-searches";
const fallbackArtwork = "/favicon.ico";

interface SearchPayload {
  topResult?: { id: string; title: string; artist: string; type: "song" | "artist" | "album"; thumbnail: string };
  songs: EngineTrack[];
  artists: EngineArtist[];
  albums: EngineAlbum[];
}

function artworkFor(track: EngineTrack): string {
  return track.artwork?.["480x480"] || track.artwork?.["150x150"] || fallbackArtwork;
}

function artistName(artist?: EngineArtist | null): string {
  if (!artist) return "Nghệ sĩ";
  return artist.name || artist.handle || "Nghệ sĩ";
}

export default function SearchBar() {
  const router = useRouter();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const { user, status, openAuthModal, signOut } = useAuthStore();
  const voiceSearch = useVoiceSearch("vi-VN");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);
  const debouncedQueryRef = useRef(debouncedQuery);
  useEffect(() => { debouncedQueryRef.current = debouncedQuery; }, [debouncedQuery]);
  const [payload, setPayload] = useState<SearchPayload>({ songs: [], artists: [], albums: [] });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handledVoiceTranscriptRef = useRef("");

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(recentStorageKey) || "[]");
      if (Array.isArray(stored)) setRecentSearches(stored.filter((item): item is string => typeof item === "string").slice(0, 6));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const rememberSearch = useCallback((term: string) => {
    const next = [term, ...recentSearches.filter((item) => item !== term)].slice(0, 6);
    setRecentSearches(next);
    window.localStorage.setItem(recentStorageKey, JSON.stringify(next));
  }, [recentSearches]);

  const handleSearch = useCallback((term = query) => {
    const normalized = term.trim();
    if (!normalized) return;
    rememberSearch(normalized);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  }, [query, rememberSearch, router]);

  useEffect(() => {
    if (voiceSearch.transcript) setQuery(voiceSearch.transcript);
    if (voiceSearch.isListening) {
      handledVoiceTranscriptRef.current = "";
    } else if (voiceSearch.transcript && handledVoiceTranscriptRef.current !== voiceSearch.transcript) {
      handledVoiceTranscriptRef.current = voiceSearch.transcript;
      handleSearch(voiceSearch.transcript);
    }
  }, [handleSearch, voiceSearch.isListening, voiceSearch.transcript]);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target)) setOpen(false);
      if (!accountMenuRef.current?.contains(target)) setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      setPayload({ songs: [], artists: [], albums: [] });
      setLoading(false);
      return;
    }

    let isMounted = true;
    const queryRef = { current: debouncedQuery };
    setLoading(true);
    Promise.all([
      fetch(`/api/sound-engine/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`).then((response) => response.ok ? response.json() : []),
      fetch(`/api/sound-engine/search?q=${encodeURIComponent(debouncedQuery)}&type=all`).then((response) => response.ok ? response.json() : { songs: [], artists: [], albums: [] }),
    ]).then(([nextSuggestions, nextPayload]) => {
      if (isMounted && queryRef.current === debouncedQueryRef.current) {
        setSuggestions(Array.isArray(nextSuggestions) ? nextSuggestions : []);
        setPayload({ songs: nextPayload.songs || [], artists: nextPayload.artists || [], albums: nextPayload.albums || [] });
      }
    }).catch((error: unknown) => {
      if (isMounted && queryRef.current === debouncedQueryRef.current && (error as { name?: string }).name !== "AbortError") {
        setSuggestions([]);
        setPayload({ songs: [], artists: [], albums: [] });
      }
    }).finally(() => {
      if (isMounted && queryRef.current === debouncedQueryRef.current) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [debouncedQuery]);

  const playQuickResult = (track: EngineTrack) => {
    const queue = payload.songs.slice(0, 3);
    playTrack(AuraicAudioAdapter.toPlayerTrack(track), queue.map(AuraicAudioAdapter.toPlayerTrack), "Kết quả tìm kiếm");
    setOpen(false);
  };

  const accountLabel = user?.name || user?.email || "Tài khoản";
  const accountInitials = accountLabel.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
  const hasQuickResults = Boolean(payload.topResult || payload.songs.length || payload.artists.length || payload.albums.length);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090910]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex min-h-12 items-center gap-3">
        <div ref={containerRef} className="relative min-w-0 flex-1 sm:w-[min(520px,52vw)] sm:flex-none">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            ref={inputRef}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
            onKeyDown={(event) => {
              if (event.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
              if (event.key === "Enter") handleSearch();
            }}
            placeholder={voiceSearch.isListening ? "Đang nghe... Hãy nói tên bài hát hoặc ca sĩ" : "Tìm bài hát, nghệ sĩ hoặc album..."}
            aria-label="Tìm kiếm nhạc"
            aria-expanded={open}
            aria-controls="search-overlay"
            role="combobox"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.07] py-3 pl-11 pr-24 text-sm text-white outline-none backdrop-blur-xl transition focus:border-cyan-300/70 focus:bg-white/[0.1] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)] placeholder:text-white/35"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin text-cyan-200" />}
            {voiceSearch.state !== "unsupported" && <button type="button" onClick={voiceSearch.toggleListening} aria-label={voiceSearch.isListening ? "Dừng tìm kiếm bằng giọng nói" : "Tìm kiếm bằng giọng nói"} title={voiceSearch.isListening ? "Đang nghe... Hãy nói tên bài hát hoặc ca sĩ" : "Tìm kiếm bằng giọng nói"} className={`relative flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${voiceSearch.isListening ? "text-cyan-200" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
              {voiceSearch.isListening && <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/30" />}
              <Mic className="relative h-4 w-4" />
            </button>}
            {query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Xóa nội dung tìm kiếm" className="flex h-9 w-9 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>}
          </div>

          {open && <div id="search-overlay" role="listbox" className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-[min(34rem,calc(100vh-8rem))] overflow-y-auto rounded-2xl border border-white/15 bg-[#131923]/95 p-3 shadow-2xl backdrop-blur-2xl">
            {!debouncedQuery ? <>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Tìm kiếm gần đây</p>
              {recentSearches.length ? recentSearches.map((term) => <button key={term} type="button" onClick={() => { setQuery(term); handleSearch(term); }} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-white/75 hover:bg-white/[0.08]"><Search className="h-4 w-4 text-white/35" />{term}</button>) : <p className="px-3 py-5 text-sm text-white/40">Các tìm kiếm gần đây sẽ xuất hiện ở đây.</p>}
            </> : <div className="space-y-4">
              {suggestions.length > 0 && <section><p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Gợi ý từ khóa</p>{suggestions.slice(0, 5).map((suggestion) => <button key={suggestion} type="button" onClick={() => handleSearch(suggestion)} className="flex min-h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-white/75 hover:bg-white/[0.08]"><Search className="h-3.5 w-3.5 text-cyan-200/60" />{suggestion}</button>)}</section>}
              {hasQuickResults ? <>
                {payload.topResult && <section><p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Kết quả hàng đầu</p><button type="button" onClick={() => handleSearch()} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[0.08]"><Artwork src={payload.topResult.thumbnail || fallbackArtwork} alt="" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{payload.topResult.title}</span><span className="block truncate text-xs text-white/45">{payload.topResult.artist}</span></span><span className="text-[10px] uppercase text-cyan-200/60">{payload.topResult.type}</span></button></section>}
                {payload.songs.slice(0, 3).length > 0 && <section><p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Bài hát phù hợp</p>{payload.songs.slice(0, 3).map((track) => <button key={track.id} type="button" onClick={() => playQuickResult(track)} className="group flex min-h-12 w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[0.08]"><Artwork src={artworkFor(track)} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{track.title}</span><span className="block truncate text-xs text-white/45">{track.artist || artistName(track.user)}</span></span><Play className="h-4 w-4 fill-white text-white/70 opacity-0 transition group-hover:opacity-100" /></button>)}</section>}
              </> : !loading && <p className="px-3 py-6 text-center text-sm text-white/45">Chưa có kết quả phù hợp.</p>}
            </div>}
          </div>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {status === "authenticated" && user ? <><button type="button" aria-label="Thông báo" title="Thông báo" className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><Bell className="h-[18px] w-[18px]" /></button><div ref={accountMenuRef} className="relative"><button type="button" onClick={() => setAccountMenuOpen((value) => !value)} aria-expanded={accountMenuOpen} aria-haspopup="menu" className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] pl-1 pr-2 text-left hover:bg-white/[0.1]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-fuchsia-400 text-xs font-black text-slate-950">{accountInitials}</span><span className="hidden max-w-24 truncate text-xs font-semibold text-white/80 md:block">{accountLabel}</span><ChevronDown className={`hidden h-3.5 w-3.5 text-white/45 sm:block ${accountMenuOpen ? "rotate-180" : ""}`} /></button>{accountMenuOpen && <div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-xl border border-white/10 bg-[#171720]/95 p-2 shadow-2xl"><p className="truncate border-b border-white/10 px-3 pb-2 pt-1 text-sm font-semibold text-white">{accountLabel}</p><button type="button" role="menuitem" onClick={() => router.push("/profile")} className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/70 hover:bg-white/[0.08]"><User className="h-4 w-4" />Trang cá nhân</button><button type="button" role="menuitem" onClick={() => router.push("/settings")} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/70 hover:bg-white/[0.08]"><Settings2 className="h-4 w-4" />Cài đặt</button><button type="button" role="menuitem" onClick={signOut} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-rose-300/80 hover:bg-rose-400/10"><LogOut className="h-4 w-4" />Đăng xuất</button></div>}</div></> : <button type="button" onClick={openAuthModal} className="flex h-10 items-center gap-2 rounded-full bg-cyan-300 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-200"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Đăng nhập</span></button>}
        </div>
      </div>
      {(voiceSearch.error || voiceSearch.isListening) && <p className="sr-only" role="status" aria-live="polite">{voiceSearch.error || "Đang nghe... Hãy nói tên bài hát hoặc ca sĩ"}</p>}
    </header>
  );
}
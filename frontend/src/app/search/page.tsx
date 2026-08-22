"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Headphones, Heart, Loader2, Play, RefreshCw, Search, Sparkles } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { formatDuration, getJamendoTracks, type JamendoSong } from "@/lib/api";

const suggestedTags = ["Lounge", "Classical", "Electronic", "Jazz", "Pop", "Hip Hop", "Relaxation", "Rock", "Songwriter", "World", "Metal", "Soundtrack"];

export default function SearchPage() {
  const { likedIds, currentTrack, isPlaying, toggleLike, playTrack } = usePlayerStore();
  const [tracks, setTracks] = useState<JamendoSong[]>([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadTracks = (tag = "", nextOffset = 0, append = false) => {
    setLoading(true);
    setError(false);
    getJamendoTracks({ limit: 48, offset: nextOffset, tags: tag || undefined })
      .then((nextTracks) => {
        setTracks((current) => append ? [...current, ...nextTracks] : nextTracks);
        setOffset(nextOffset + nextTracks.length);
        setHasMore(nextTracks.length === 48);
      })
      .catch(() => {
        setTracks([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tracks;
    return tracks.filter((track) =>
      track.title.toLowerCase().includes(normalizedQuery) ||
      track.artist.name.toLowerCase().includes(normalizedQuery) ||
      track.album?.title.toLowerCase().includes(normalizedQuery)
    );
  }, [query, tracks]);

  const isLiked = (id: string) => likedIds.some((likedId) => String(likedId) === id);

  const chooseTag = (tag: string) => {
    const nextTag = activeTag === tag ? "" : tag;
    setActiveTag(nextTag);
    setQuery("");
    loadTracks(nextTag);
  };

  return (
    <div className="min-h-full overflow-y-auto bg-[#09090b] p-6 pb-28 text-white sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-white/10 pb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                <Sparkles className="h-4 w-4" /> Jamendo catalog
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Tìm nhạc quốc tế</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                Khám phá những bản nhạc độc lập từ nghệ sĩ trên toàn thế giới.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm bài hát, nghệ sĩ hoặc album..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition focus:border-indigo-400 focus:bg-white/[0.08] placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => chooseTag(tag)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                  activeTag === tag
                    ? "border-indigo-400 bg-indigo-500 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Headphones className="h-5 w-5 text-indigo-400" />
                {query ? `Kết quả cho “${query}”` : activeTag ? `${activeTag} trên Jamendo` : "Đang được khám phá"}
              </h2>
              {!loading && !error && <p className="mt-1 text-xs text-white/40">{filteredTracks.length} bài hát từ Jamendo</p>}
            </div>
            <button
              type="button"
              onClick={() => loadTracks(activeTag)}
              title="Tải lại catalog"
              className="rounded-full border border-white/10 p-2 text-white/45 transition hover:border-white/25 hover:text-white active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading && (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="h-14 w-14 animate-pulse rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-white/10" /><div className="h-2 w-1/3 animate-pulse rounded bg-white/5" /></div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-8 text-center">
              <p className="text-sm text-rose-200">Không thể tải catalog Jamendo lúc này.</p>
              <button type="button" onClick={() => loadTracks(activeTag)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-white/80 active:scale-95">
                <RefreshCw className="h-3.5 w-3.5" /> Thử lại
              </button>
            </div>
          )}

          {!loading && !error && filteredTracks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <Search className="mx-auto h-7 w-7 text-white/25" />
              <p className="mt-3 text-sm text-white/55">Không tìm thấy bài hát phù hợp.</p>
              <button type="button" onClick={() => { setQuery(""); setActiveTag(""); loadTracks(); }} className="mt-4 text-xs font-semibold text-indigo-300 hover:text-indigo-200">Xem toàn bộ catalog</button>
            </div>
          )}

          {!loading && !error && filteredTracks.length > 0 && (
            <div className="divide-y divide-white/[0.06] overflow-visible rounded-2xl border border-white/10 bg-white/[0.025]">
              {filteredTracks.map((track, index) => {
                const current = String(currentTrack?.id) === track.id;
                const liked = isLiked(track.id);
                return (
                  <div key={track.id} onClick={() => playTrack(track as any, filteredTracks as any, "Jamendo")}
                    className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 transition hover:bg-white/[0.06] sm:gap-4 sm:p-4 ${current ? "bg-indigo-500/[0.08]" : ""}`}>
                    <div className="flex w-6 justify-center text-xs font-mono text-white/30">
                      {current && isPlaying ? <Loader2 className="h-4 w-4 animate-spin text-indigo-300" /> : String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={track.image} alt={track.title} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <h3 className={`truncate text-sm font-bold ${current ? "text-indigo-300" : "text-white"}`}>{track.title}</h3>
                        <p className="truncate text-xs text-white/45">{track.artist.name}{track.album ? ` · ${track.album.title}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3" onClick={(event) => event.stopPropagation()}>
                      <span className="hidden items-center gap-1 text-xs font-mono text-white/35 sm:flex"><Clock3 className="h-3.5 w-3.5" />{formatDuration(track.duration)}</span>
                      <button type="button" onClick={() => toggleLike(track as any)} title={liked ? "Bỏ thích" : "Yêu thích"} className="rounded-full p-2 text-white/35 transition hover:bg-white/10 hover:text-pink-400">
                        <Heart className={`h-4 w-4 ${liked ? "fill-pink-400 text-pink-400" : ""}`} />
                      </button>
                      <TrackActionMenu track={track as any} />
                      <Play className="hidden h-4 w-4 fill-white text-white/70 group-hover:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && !error && hasMore && filteredTracks.length > 0 && (
            <button type="button" onClick={() => loadTracks(activeTag, offset, true)} className="mx-auto flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/65 transition hover:border-indigo-400/60 hover:text-white active:scale-95">
              <Loader2 className="h-4 w-4" /> Tải thêm bài hát
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

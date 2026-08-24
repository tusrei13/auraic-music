"use client";

import { useEffect, useState } from "react";
import { Disc3, Loader2, Play, Radio, Search, Sparkles, Trophy, Users, SlidersHorizontal, Globe2, Clock3, ShieldCheck, Headphones } from "lucide-react";
import { getJamendoTracks, type JamendoSong } from "@/lib/api";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";

const fallbackImage = "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=900&auto=format&fit=crop";

type SurfaceKind = "genres" | "charts" | "radio" | "community" | "search";

const configs: Record<SurfaceKind, { eyebrow: string; title: string; description: string; icon: typeof Disc3; tags?: string; accent: string }> = {
  genres: { eyebrow: "Auraic catalog", title: "Explore by genre", description: "Browse a living catalog of independent music, grouped by the feeling you came for.", icon: Disc3, accent: "fuchsia" },
  charts: { eyebrow: "Global pulse", title: "Charts that move", description: "The tracks people are discovering right now across the Auraic catalog.", icon: Trophy, accent: "amber" },
  radio: { eyebrow: "Always on", title: "Radio for every mood", description: "Pick a station and let the next song arrive without overthinking it.", icon: Radio, accent: "cyan" },
  community: { eyebrow: "Find your people", title: "A community in motion", description: "See what listeners are playing and follow the trails that feel like yours.", icon: Users, accent: "pink" },
  search: { eyebrow: "Deep search", title: "Find your frequency", description: "Search the Auraic catalog with room for context, not just keywords.", icon: Search, accent: "violet" },
};

const genreTags = ["electronic", "rock", "hiphop", "classical", "ambient", "jazz", "folk", "pop"];
const genreTiles = [
  { name: "Electronic", note: "Pulse, synth and motion", color: "from-fuchsia-500/35 to-violet-500/10", icon: "✦" },
  { name: "Rock", note: "Guitars with a little edge", color: "from-rose-500/30 to-orange-500/10", icon: "◒" },
  { name: "Hip hop", note: "Beats, words and attitude", color: "from-cyan-500/30 to-blue-500/10", icon: "◈" },
  { name: "Ambient", note: "Space to think clearly", color: "from-indigo-500/35 to-cyan-500/10", icon: "◌" },
  { name: "Jazz", note: "Warm chords after dark", color: "from-amber-500/30 to-pink-500/10", icon: "◍" },
  { name: "Classical", note: "Timeless, cinematic detail", color: "from-emerald-500/25 to-cyan-500/10", icon: "⌁" },
];
const stations = [
  { name: "Night drive", note: "Synths, neon, open roads", tags: "electronic synthwave" },
  { name: "Quiet focus", note: "Ambient textures for deep work", tags: "ambient piano" },
  { name: "Good energy", note: "Bright beats, no filler", tags: "pop dance" },
  { name: "Late night jazz", note: "Warm rooms and slow chords", tags: "jazz lounge" },
];

export default function CatalogSurface({ kind }: { kind: SurfaceKind }) {
  const config = configs[kind];
  const Icon = config.icon;
  const { playMix, playTrack } = usePlayerStore();
  const [tracks, setTracks] = useState<JamendoSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(kind === "genres" ? "electronic" : "");
  const [query, setQuery] = useState("");
  const [activeStation, setActiveStation] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getJamendoTracks({ limit: 16, tags: kind === "genres" ? selectedTag : undefined, search: kind === "search" ? query : undefined, order: kind === "charts" ? "popularity_total" : undefined })
      .then(setTracks)
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [kind, selectedTag, query]);

  const playStation = async (tags: string, title: string) => {
    setActiveStation(title);
    const next = await getJamendoTracks({ limit: 16, tags });
    setTracks(next);
    playMix(next, title);
  };

  return (
    <div className="min-h-full overflow-y-auto px-5 pb-36 pt-8 text-white sm:px-8 lg:px-12">
      <header className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11101c] p-6 sm:p-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[100px]" />
        <div className="relative max-w-2xl">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-300"><Icon className="h-4 w-4" /> {config.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{config.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">{config.description}</p>
          {kind === "search" ? <div className="relative mt-7 max-w-xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] pl-11 pr-4 text-sm outline-none focus:border-fuchsia-300" placeholder="Tên bài hát, nghệ sĩ hoặc album" aria-label="Tìm kiếm nâng cao" /></div> : null}
        </div>
      </header>

      {kind === "genres" ? <>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{genreTiles.map((genre, index) => <button key={genre.name} type="button" onClick={() => setSelectedTag(genreTags[index % genreTags.length])} className={`group min-h-36 rounded-2xl border border-white/10 bg-gradient-to-br ${genre.color} p-5 text-left transition hover:-translate-y-1 hover:border-fuchsia-200/50 hover:shadow-[0_18px_45px_rgba(139,92,246,0.18)]`}><span className="text-3xl text-white/80">{genre.icon}</span><div className="mt-5 flex items-end justify-between gap-3"><span><span className="block text-base font-bold text-white">{genre.name}</span><span className="mt-1 block text-xs text-white/45">{genre.note}</span></span><span className="text-xs font-bold tabular-nums text-white/45">{(index + 2) * 12} tracks</span></div></button>)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-2"><span className="mr-2 text-xs font-bold uppercase tracking-[0.18em] text-white/35">Explore more</span>{genreTags.map((tag) => <button key={tag} type="button" onClick={() => setSelectedTag(tag)} className={`min-h-10 rounded-full border px-4 text-sm font-semibold capitalize transition ${selectedTag === tag ? "border-fuchsia-300 bg-fuchsia-300 text-slate-950" : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white"}`}>{tag}</button>)}</div>
        <div className="mt-5 flex items-center gap-2 text-xs text-white/40"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Auraic catalog · license information available per track</div>
      </> : null}
      {kind === "charts" ? <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="relative min-h-64 overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/20 via-rose-500/10 to-transparent p-6"><div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.35),transparent_65%)]" /><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="rounded-full border border-amber-200/30 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">#01 this week</span><Trophy className="h-5 w-5 text-amber-200" /></div><div><p className="text-xs uppercase tracking-[0.2em] text-white/45">Auraic global pulse</p><h2 className="mt-2 max-w-md text-3xl font-black text-white sm:text-4xl">{tracks[0]?.title || "Loading the top track"}</h2><p className="mt-2 text-sm text-white/60">{tracks[0]?.artist.name || "Auraic artists"} · 12.4K plays this week</p></div></div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center gap-2 text-sm font-bold"><Globe2 className="h-4 w-4 text-cyan-300" /> Chart view</div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" className="min-h-11 rounded-xl bg-white text-sm font-bold text-slate-950">Global</button><button type="button" className="min-h-11 rounded-xl border border-white/10 text-sm font-semibold text-white/55 hover:bg-white/10">Vietnam</button></div><div className="mt-3 grid grid-cols-3 gap-2"><button type="button" className="min-h-10 rounded-lg border border-fuchsia-300/50 bg-fuchsia-300/10 text-xs font-bold text-fuchsia-100">Week</button><button type="button" className="min-h-10 rounded-lg border border-white/10 text-xs text-white/50">Month</button><button type="button" className="min-h-10 rounded-lg border border-white/10 text-xs text-white/50">All time</button></div><p className="mt-5 flex items-center gap-2 text-xs leading-5 text-white/40"><Clock3 className="h-4 w-4 shrink-0" /> Snapshot refreshed daily from Auraic listening events.</p></div>
      </div> : null}
      {kind === "radio" ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{stations.map((station, index) => <button key={station.name} type="button" onClick={() => void playStation(station.tags, station.name)} className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/50 ${activeStation === station.name ? "border-cyan-300/70 bg-cyan-300/10" : `border-white/10 bg-gradient-to-br ${index % 2 === 0 ? "from-cyan-400/15 to-white/[0.03]" : "from-fuchsia-400/15 to-white/[0.03]"}`}`}><span className="absolute -right-5 -top-8 h-32 w-32 rounded-full border border-white/10 bg-white/[0.05]" /><span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Radio className="h-5 w-5" /></span><h2 className="relative mt-8 text-lg font-bold">{station.name}</h2><p className="relative mt-1 text-sm text-white/45">{station.note}</p><span className="relative mt-5 inline-flex items-center gap-2 text-xs font-bold text-cyan-200">{activeStation === station.name ? <><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Playing now</> : <><Play className="h-3.5 w-3.5 fill-current" /> Start station</>} <span className="text-white/25">·</span> 24/7</span></button>)}</div> : null}
      {kind === "search" ? <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-white/10 py-4"><span className="mr-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/35"><SlidersHorizontal className="h-4 w-4" /> Refine</span>{["All licenses", "Commercial use", "Under 4 min", "Instrumental", "Newest"].map((filter, index) => <button key={filter} type="button" className={`min-h-10 rounded-xl border px-3 text-xs font-semibold transition ${index === 0 ? "border-fuchsia-300/50 bg-fuchsia-300/10 text-fuchsia-100" : "border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}>{filter}</button>)}</div> : null}
      {kind === "community" ? <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">{["Mina is deep in ambient", "Khoa saved a midnight set", "Linh is exploring jazz"].map((item, index) => <article key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-300 text-sm font-black text-slate-950">{String.fromCharCode(77 + index)}</div><div><p className="text-sm font-semibold text-white">{item}</p><span className="text-xs text-white/35">{index + 2} minutes ago</span></div><Headphones className="ml-auto h-4 w-4 text-cyan-300/60" /></div><p className="mt-6 text-sm leading-6 text-white/65">A small listening trail worth following through the Auraic catalog.</p><div className="mt-5 flex gap-2"><button type="button" className="min-h-10 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/55 hover:bg-white/10">View playlist</button><button type="button" className="min-h-10 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/55 hover:bg-white/10">Follow</button></div></article>)}</div> : null}

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">{kind === "charts" ? "Ranked this week" : "From Auraic"}</p><h2 className="mt-2 text-2xl font-bold">{kind === "charts" ? "Top discoveries" : "A good place to start"}</h2></div><span className="text-xs text-white/35">{tracks.length} tracks</span></div>
        {loading ? <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/45"><Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" /> Tuning the catalog...</div> : tracks.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-white/40">No Auraic tracks matched this view.</div> : <div className="divide-y divide-white/10 border-y border-white/10">{tracks.map((track, index) => <div key={track.id} className="group flex items-center gap-3 py-4"><span className="w-7 text-center text-xs font-bold text-white/25">{kind === "charts" ? String(index + 1).padStart(2, "0") : ""}</span><img src={track.image || fallbackImage} alt={track.title} className="h-12 w-12 rounded-xl object-cover" /><button type="button" onClick={() => playTrack(track as any, tracks as any, config.title)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold group-hover:text-fuchsia-200">{track.title}</span><span className="mt-1 block truncate text-xs text-white/40">{track.artist.name} · {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}</span></button><TrackActionMenu track={track as any} /><button type="button" onClick={() => playTrack(track as any, tracks as any, config.title)} aria-label={`Phát ${track.title}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-fuchsia-300 hover:text-white"><Play className="h-4 w-4 fill-current" /></button></div>)}</div>}
      </section>
    </div>
  );
}

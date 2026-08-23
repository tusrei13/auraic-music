"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles, Heart, Loader2, ArrowUpRight, Waves, Disc3, Dumbbell, PartyPopper, CloudRain, Sun } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getJamendoTracks } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";

export default function HomePage() {
  const { playMix, playTrack, toggleLike, likedIds, currentTrack, isPlaying } = usePlayerStore();
  const router = useRouter();
  const vibeSectionRef = useRef<HTMLElement>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [vibeLoading, setVibeLoading] = useState<string | null>(null);

  useEffect(() => {
    getJamendoTracks({ limit: 12 })
      .then((data) => setSongs(data))
      .catch((err) => console.error("Lỗi tải bài hát từ API:", err))
      .finally(() => setLoading(false));
  }, []);

  const featured = songs[0];
  const featuredArtist = typeof featured?.artist === "object" ? featured.artist?.name : featured?.artist;
  const vibes = [
    { label: "Focus", note: "Deep work", tags: "ambient classical piano", className: "from-cyan-500/30 to-blue-600/10", icon: Waves },
    { label: "Chill", note: "Slow motion", tags: "chillout lofi lounge", className: "from-violet-500/35 to-fuchsia-500/10", icon: Sparkles },
    { label: "Night drive", note: "After dark", tags: "electronic synthwave dance", className: "from-pink-500/30 to-rose-500/10", icon: Disc3 },
    { label: "Dreamy", note: "Soft focus", tags: "ambient dreamy cinematic", className: "from-indigo-500/35 to-cyan-500/10", icon: Sparkles },
    { label: "Workout", note: "Move with it", tags: "energetic rock hiphop", className: "from-orange-500/30 to-rose-500/10", icon: Dumbbell },
    { label: "Party", note: "Raise the room", tags: "dance pop house", className: "from-yellow-500/25 to-pink-500/15", icon: PartyPopper },
    { label: "Melancholy", note: "A softer place", tags: "acoustic piano sad", className: "from-sky-500/25 to-indigo-500/15", icon: CloudRain },
    { label: "Morning", note: "Start gently", tags: "acoustic folk jazz", className: "from-amber-400/30 to-cyan-500/10", icon: Sun },
  ];

  const handleExplore = () => {
    if (songs.length === 0) return;
    playMix(songs, "Auraic Mix");
    window.setTimeout(() => {
      vibeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

  const handleVibe = async (vibe: (typeof vibes)[number]) => {
    if (vibeLoading === vibe.label) return;
    setSelectedVibe(vibe.label);
    setVibeLoading(vibe.label);
    try {
      const vibeTracks = await getJamendoTracks({ limit: 12, tags: vibe.tags });
      const nextTracks = vibeTracks.length > 0 ? vibeTracks : songs;
      if (nextTracks.length > 0) {
        setSongs(nextTracks);
        playMix(nextTracks, `${vibe.label} Aura`);
      }
    } catch (error) {
      console.error("Lỗi tải vibe Jamendo:", error);
      if (songs.length > 0) playMix(songs, `${vibe.label} Aura`);
    } finally {
      setVibeLoading(null);
    }
  };

  return (
    <div className="min-h-full overflow-y-auto scrollbar-none px-5 pb-36 pt-3 text-white sm:px-8 lg:px-12">
      <section className="relative isolate grid min-h-[470px] grid-cols-1 items-end overflow-hidden rounded-[28px] border border-white/15 bg-[#080817] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
        <div className="absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-[110px]" />
        <div className="absolute right-10 top-0 -z-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="relative z-10 pb-2 lg:pb-8">
          <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300"><Sparkles className="h-4 w-4" /> The Auraic experience</p>
          <h1 className="max-w-xl text-5xl font-black leading-[0.96] tracking-[-0.06em] sm:text-7xl">Feel the <span className="bg-gradient-to-r from-fuchsia-300 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Aura.</span><br /><em className="font-semibold text-white/85">Live the music.</em></h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/55">A living soundtrack for your late nights, clear mornings, and everything in between.</p>
          <button onClick={handleExplore} disabled={songs.length === 0} className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-bold text-[#0b0a14] shadow-[0_0_35px_rgba(196,120,255,0.4)] transition hover:-translate-y-0.5 hover:bg-fuchsia-100 disabled:opacity-50"><Play className="h-4 w-4 fill-current" /> Explore Auraic <ArrowUpRight className="h-4 w-4" /></button>
        </div>
        <div className="relative mx-auto mt-8 aspect-square w-full max-w-[370px] lg:mt-0 lg:max-w-[460px]">
          <div className="absolute inset-[-12%] rounded-full bg-gradient-to-br from-fuchsia-500/35 via-violet-500/25 to-cyan-400/30 blur-3xl" />
          <div className="absolute inset-[3%] rounded-full border border-white/15 shadow-[0_0_70px_rgba(191,112,255,0.55)]" />
          <img src={featured?.image || "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1200&auto=format&fit=crop"} alt={featured?.title || "Auraic atmospheric artwork"} className="relative h-full w-full rounded-[24%] object-cover shadow-2xl transition duration-700 hover:scale-[1.025]" />
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between rounded-2xl border border-white/15 bg-black/35 p-4 backdrop-blur-xl"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Featured now</p><p className="mt-1 truncate text-sm font-bold">{featured?.title || "A new frequency"}</p><p className="truncate text-xs text-white/50">{featuredArtist || "Auraic radio"}</p></div><button aria-label="Phát bài hát nổi bật" onClick={() => featured && playTrack(featured, songs)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105"><Play className="h-4 w-4 fill-current" /></button></div>
        </div>
      </section>

      <section ref={vibeSectionRef} className="mt-10 scroll-mt-6">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-300">Choose your atmosphere</p><h2 className="mt-2 text-2xl font-bold tracking-tight">What are you feeling?</h2></div><span className="hidden text-xs text-white/35 sm:block">Curated for this moment</span></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{vibes.map((vibe) => { const Icon = vibe.icon; const isSelected = selectedVibe === vibe.label; const isLoading = vibeLoading === vibe.label; return <button key={vibe.label} type="button" aria-pressed={isSelected} disabled={vibeLoading !== null} onClick={() => void handleVibe(vibe)} className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_12px_40px_rgba(109,78,255,0.18)] disabled:cursor-wait disabled:opacity-80 ${vibe.className} ${isSelected ? "border-white/60 shadow-[0_0_28px_rgba(217,140,255,0.3)]" : "border-white/10"}`}><Icon className={`mb-8 h-5 w-5 text-white/80 transition group-hover:rotate-12 ${isLoading ? "animate-pulse" : ""}`} /><p className="font-bold">{isLoading ? "Tuning..." : vibe.label}</p><p className="mt-1 text-xs text-white/45">{isSelected && !isLoading ? "Now playing" : vibe.note}</p></button>; })}</div>
      </section>

      <section className="mt-12 space-y-4">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">On repeat</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Trending now</h2></div><button type="button" onClick={() => router.push("/discover")} className="text-xs font-semibold text-white/45 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300">View all <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/45"><Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" /> Tuning your atmosphere...</div>
        ) : songs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{songs.slice(0, 5).map((song, index) => { const artist = typeof song.artist === "object" ? song.artist?.name : song.artist; const isCurrent = String(currentTrack?.id) === String(song.id); const liked = likedIds.some((id: any) => String(id) === String(song.id)); return <article key={song.id} className="group min-w-0"><button onClick={() => playTrack(song, songs, "Trending now")} className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"><img src={song.image} alt={song.title} loading={index > 1 ? "lazy" : "eager"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-70" /><span className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></span>{isCurrent && isPlaying && <span className="absolute left-3 top-3 rounded-full bg-fuchsia-500 px-2 py-1 text-[9px] font-bold uppercase tracking-wider">Playing</span>}</button><div className="flex items-start justify-between gap-2 pt-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold group-hover:text-fuchsia-200">{song.title}</h3><p className="mt-1 truncate text-xs text-white/45">{artist}</p></div><div className="flex shrink-0 items-center gap-1"><button aria-label={liked ? "Bỏ thích" : "Yêu thích"} onClick={() => toggleLike(song)} className={`mt-0.5 ${liked ? "text-pink-400" : "text-white/25 hover:text-pink-300"}`}><Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /></button><TrackActionMenu track={song} /></div></div></article>; })}</div>
        ) : <div className="border-b border-white/10 py-10 text-center text-sm text-white/40">Chưa có bài hát nào trong catalog Jamendo.</div>}
      </section>

      <section className="mt-12 space-y-4">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">A little deeper</p><h2 className="mt-2 text-2xl font-bold tracking-tight">For your next chapter</h2></div></div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/50 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Đang tải bài hát từ API...</span>
          </div>
        ) : songs.length > 0 ? (
          <div className="divide-y divide-white/10 border-y border-white/10">{songs.slice(5, 10).map((song, index) => {
                const liked = likedIds.some((id: any) => String(id) === String(song.id));
                const isCurrent = String(currentTrack?.id) === String(song.id);
                const artistName = typeof song.artist === "object" ? song.artist?.name : song.artist;
                return (
                  <div
                    key={song.id}
                    onClick={() => playTrack(song, songs)}
                    className={`group flex items-center gap-4 py-4 transition ${isCurrent ? "text-fuchsia-300" : "hover:text-fuchsia-200"}`}
                  >
                    <span className="w-6 text-xs text-white/25">{String(index + 6).padStart(2, "0")}</span><img src={song.image} alt={song.title} className="h-12 w-12 shrink-0 rounded-xl object-cover" /><div onClick={() => playTrack(song, songs)} className="min-w-0 flex-1 cursor-pointer"><h4 className="truncate text-sm font-semibold">{song.title}</h4><p className="mt-1 truncate text-xs text-white/40">{artistName}</p></div><div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        className="text-white/40 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                        title={liked ? "Bỏ thích" : "Yêu thích"}
                      >
                        <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                      </button>

                      <TrackActionMenu track={song} />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <p className="text-white/40 text-sm">Chưa có bài hát nào trong catalog Jamendo.</p>
          </div>
        )}
      </section>
    </div>
  );
}
"use client";

import { use, useState } from "react";
import { ALL_SYSTEM_SONGS, Track } from "@/app/library/page";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { Play, Music, Disc, Users, Heart, Clock } from "lucide-react";

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artistName = decodeURIComponent(id);
  const store = usePlayerStore() as any;

  // Lọc tất cả bài hát thuộc về Nghệ sĩ này
  const artistSongs = ALL_SYSTEM_SONGS.filter((s) => {
    const name = typeof s.artist === "object" ? s.artist.name : s.artist;
    return name.toLowerCase() === artistName.toLowerCase();
  });

  // Gom nhóm danh sách Album
  const albums = Array.from(
    new Set(artistSongs.map((s) => s.album).filter(Boolean))
  );

  const handlePlaySong = (song: Track) => {
    if (store.playTrack) {
      store.playTrack(song, artistSongs);
    }
  };

  return (
    <div className="min-h-full overflow-y-auto scrollbar-none pb-28 text-white bg-[#09090b] p-8 space-y-10">
      {/* Banner Nghệ Sĩ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-black p-8 border border-white/10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500/30 flex-shrink-0">
          <img
            src={artistSongs[0]?.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"}
            alt={artistName}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase text-indigo-400 tracking-widest">
            <Users className="w-4 h-4" /> Nghệ sĩ xác minh
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">{artistName}</h1>
          <p className="text-xs text-white/60">
            {artistSongs.length} bài hát • {albums.length} Album đã phát hành
          </p>

          <div className="pt-2">
            <button
              onClick={() => artistSongs.length > 0 && handlePlaySong(artistSongs[0])}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Phát bài nổi bật
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách bài hát nổi bật */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-400" /> Bài hát phổ biến
        </h2>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          {artistSongs.map((song, index) => (
            <div
              key={song.id}
              onClick={() => handlePlaySong(song)}
              className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-white/5 transition-all cursor-pointer group border-b border-white/5 last:border-0"
            >
              <div className="col-span-1 text-xs font-mono text-white/40 font-bold">
                0{index + 1}
              </div>

              <div className="col-span-7 flex items-center gap-3 min-w-0">
                <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover" />
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 truncate">
                    {song.title}
                  </h4>
                  <p className="text-xs text-white/40 truncate">{song.album || "Single"}</p>
                </div>
              </div>

              <div className="col-span-4 flex items-center justify-end gap-3">
                <span className="text-xs font-mono text-white/40">{song.duration || "03:30"}</span>
                <TrackActionMenu track={song} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Thống kê Album */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Disc className="w-5 h-5 text-purple-400" /> Album & Đĩa đơn
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.map((albumName, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 hover:border-indigo-500/50 transition-all group"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-white/10">
                <img
                  src={artistSongs[idx]?.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop"}
                  alt={albumName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white truncate">{albumName}</h3>
                <p className="text-xs text-white/40 mt-0.5">Album chính thức</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, ListMusic, User, Check, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";

export interface TrackActionMenuProps {
  track: any;
  playlists?: any[];
  onAddToPlaylist?: (playlistId: number | string, trackId: number | string) => void;
}

export default function TrackActionMenu({
  track,
  playlists = [],
  onAddToPlaylist,
}: TrackActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const store = usePlayerStore() as any;

  const isLiked = store.likedIds?.some((id: any) => String(id) === String(track.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPlaylists(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const artistName = typeof track.artist === "object" ? track.artist?.name : track.artist;

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof store.addToQueue === "function") {
      store.addToQueue(track);
    }
    setIsOpen(false);
  };

  const handleGoToArtist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artistName) {
      router.push(`/artist/${encodeURIComponent(artistName)}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
        title="Tùy chọn"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#18181c] border border-white/10 shadow-2xl py-2 z-50 text-xs text-white backdrop-blur-xl">
          {/* Thêm vào Playlist */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPlaylists(!showPlaylists);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 font-semibold">
                <Plus className="w-4 h-4 text-indigo-400" /> Thêm vào playlist
              </span>
              <span className="text-[10px] text-white/40">›</span>
            </button>

            {/* Submenu chọn Playlist */}
            {showPlaylists && (
              <div className="absolute right-full top-0 mr-1 w-48 rounded-xl bg-[#22222a] border border-white/10 shadow-2xl py-2 max-h-52 overflow-y-auto scrollbar-none z-50">
                {playlists.length > 0 ? (
                  playlists.map((pl) => {
                    const isInPlaylist = pl.songIds?.some(
                      (id: any) => String(id) === String(track.id)
                    );
                    return (
                      <button
                        key={pl.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddToPlaylist) onAddToPlaylist(pl.id, track.id);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center justify-between text-white/80 hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="truncate">{pl.name}</span>
                        {isInPlaylist && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-white/40 italic text-[11px] text-center">
                    Chưa có playlist nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lưu vào yêu thích */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (store.toggleLike) store.toggleLike(track.id);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer font-semibold"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-pink-500 text-pink-500" : "text-pink-400"}`} />
            {isLiked ? "Xóa khỏi Yêu thích" : "Lưu vào bài hát đã thích"}
          </button>

          {/* Thêm vào hàng đợi */}
          <button
            onClick={handleAddToQueue}
            className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer font-semibold"
          >
            <ListMusic className="w-4 h-4 text-purple-400" /> Thêm vào hàng đợi
          </button>

          <div className="my-1 border-t border-white/10" />

          {/* Xem nghệ sĩ */}
          <button
            onClick={handleGoToArtist}
            className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer font-semibold"
          >
            <User className="w-4 h-4 text-cyan-400" /> Xem nghệ sĩ
          </button>
        </div>
      )}
    </div>
  );
}
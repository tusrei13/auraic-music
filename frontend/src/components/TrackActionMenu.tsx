"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, ListMusic, User, Check, Heart, X, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";

export interface TrackActionMenuProps {
  track: any;
  playlists?: any[];
  onAddToPlaylist?: (playlistId: number | string, trackId: number | string) => void;
}

export default function TrackActionMenu({
  track,
  playlists: propPlaylists,
  onAddToPlaylist,
}: TrackActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const store = usePlayerStore() as any;
  const { playlists: storePlaylists, createPlaylist, addTrackToPlaylist } = usePlaylistStore();

  const activePlaylists = storePlaylists.length > 0 ? storePlaylists : (propPlaylists || []);
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

  const handleOpenCreateModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setShowPlaylists(false);
    setPlaylistTitle("");
    setIsModalOpen(true);
  };

  const handleConfirmCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (playlistTitle.trim()) {
      createPlaylist(playlistTitle, track);
      setIsModalOpen(false);
      setPlaylistTitle("");
    }
  };

  const handleSelectPlaylist = (e: React.MouseEvent, playlistId: string | number) => {
    e.stopPropagation();
    addTrackToPlaylist(String(playlistId), track);
    if (onAddToPlaylist) {
      onAddToPlaylist(playlistId, track.id);
    }
    setIsOpen(false);
    setShowPlaylists(false);
  };

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
    <>
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

              {/* Submenu chọn / tạo Playlist */}
              {showPlaylists && (
                <div className="absolute right-full top-0 mr-1.5 w-52 rounded-2xl bg-[#22222a] border border-white/10 shadow-2xl p-1.5 max-h-60 overflow-y-auto scrollbar-none z-50 space-y-1">
                  {/* Nút Tạo playlist mới */}
                  <button
                    onClick={handleOpenCreateModal}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/20 transition-all cursor-pointer text-left"
                  >
                    <Plus className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>+ Tạo playlist mới</span>
                  </button>

                  <div className="h-[1px] bg-white/10 my-1" />

                  {/* Danh sách Playlist */}
                  {activePlaylists.length > 0 ? (
                    activePlaylists.map((pl: any) => {
                      const isInPlaylist =
                        pl.tracks?.some((t: any) => String(t.id) === String(track.id)) ||
                        pl.songIds?.some((id: any) => String(id) === String(track.id));

                      return (
                        <button
                          key={pl.id}
                          onClick={(e) => handleSelectPlaylist(e, pl.id)}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-xl flex items-center justify-between text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                          <span className="truncate font-medium">{pl.title || pl.name}</span>
                          {isInPlaylist && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 ml-1" />}
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

      {/* Modern Custom Modal Pop-up */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-[#18181c] border border-white/15 rounded-3xl p-6 shadow-2xl relative text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tạo playlist mới</h3>
                  <p className="text-xs text-white/50">Bài hát "{track.title}" sẽ tự động thêm vào đây</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleConfirmCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">Tên playlist</label>
                <input
                  type="text"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  placeholder="Nhập tên playlist của bạn..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!playlistTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Tạo & Thêm bài hát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
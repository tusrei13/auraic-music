"use client";

import { useState } from "react";
import { 
  X, 
  Trash2, 
  GripVertical, 
  Play, 
  ListMusic, 
  Music2 
} from "lucide-react";
import { usePlayerStore, Track } from "@/store/usePlayerStore";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const {
    currentTrack,
    isPlaying,
    userQueue = [],
    contextQueue = [],
    contextTitle = "Trang hiện tại",
    contextIndex = 0,
    playTrack,
    clearQueue,
    removeFromUserQueue,
    removeFromContextQueue,
    reorderQueue,
  } = usePlayerStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Lấy danh sách các bài hát còn lại từ nguồn phát (bỏ qua bài đang phát)
  const remainingContextTracks = contextQueue.slice(contextIndex + 1);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newQueue = [...userQueue];
    const [draggedItem] = newQueue.splice(draggedIndex, 1);
    newQueue.splice(dropIndex, 0, draggedItem);

    if (reorderQueue) {
      reorderQueue(newQueue);
    }

    setDraggedIndex(null);
  };

  const handlePlayTrack = (track: Track) => {
    if (playTrack) {
      playTrack(track, contextQueue, contextTitle);
    }
  };

  const renderArtist = (artist: any) => {
    if (!artist) return "";
    return typeof artist === "object" ? artist.name : artist;
  };

  return (
    <aside className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#121216]/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Hàng đợi phát</h2>
        </div>

        <div className="flex items-center gap-2">
          {userQueue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
        {/* Đang phát */}
        {currentTrack && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Đang phát</h3>
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden">
                <img src={currentTrack.image} alt={currentTrack.title} className="w-full h-full object-cover" />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-indigo-300 truncate">{currentTrack.title}</h4>
                <p className="text-xs text-white/50 truncate">
                  {renderArtist(currentTrack.artist)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Hàng đợi cá nhân (Do người dùng thêm) */}
        {userQueue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Tiếp theo từ hàng đợi ({userQueue.length})
              </h3>
            </div>

            <div className="space-y-2">
              {userQueue.map((track, index) => (
                <div
                  key={`user-${track.id}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`group p-2.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/5 flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing ${
                    draggedIndex === index ? "opacity-40 border-indigo-500 border-dashed" : ""
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-white/20 group-hover:text-white/60 flex-shrink-0" />

                  <div
                    onClick={() => handlePlayTrack(track)}
                    className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden group/thumb cursor-pointer"
                  >
                    <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => handlePlayTrack(track)}>
                    <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate cursor-pointer">
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-white/40 truncate">{renderArtist(track.artist)}</p>
                  </div>

                  <button
                    onClick={() => removeFromUserQueue(index)}
                    className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Xóa khỏi hàng đợi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Danh sách tiếp theo từ nguồn phát (Album / Playlist / Trang) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider truncate">
              Tiếp theo từ: <span className="text-indigo-300 font-bold">{contextTitle}</span>
            </h3>
          </div>

          {remainingContextTracks.length > 0 ? (
            <div className="space-y-2">
              {remainingContextTracks.map((track, index) => (
                <div
                  key={`ctx-${track.id}-${index}`}
                  className="group p-2.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/5 flex items-center gap-3 transition-all"
                >
                  <div
                    onClick={() => handlePlayTrack(track)}
                    className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden group/thumb cursor-pointer"
                  >
                    <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlayTrack(track)}>
                    <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-white/40 truncate">{renderArtist(track.artist)}</p>
                  </div>

                  <button
                    onClick={() => removeFromContextQueue(contextIndex + 1 + index)}
                    className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Xóa khỏi danh sách"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            userQueue.length === 0 && (
              <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl space-y-2">
                <Music2 className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs font-medium text-white/40">Hàng đợi trống</p>
                <p className="text-[11px] text-white/30">Chọn một danh sách phát hoặc thêm bài hát vào hàng đợi</p>
              </div>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
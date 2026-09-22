"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useAdaptiveGraphics } from "@/hooks/useAdaptiveGraphics";
import { X, Trash2, GripVertical, Play, ListMusic, Music2, Sparkles } from "lucide-react";
import Artwork from "@/components/Artwork";
import { usePlayerStore, Track } from "@/store/usePlayerStore";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function SpatialEqualizer({ isPlaying }: { isPlaying: boolean }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const { quality } = useAdaptiveGraphics();
  const tiltEnabled = quality === "high";

  useGSAP(
    () => {
      if (!tiltEnabled || !barsRef.current) return;
      const ctx = gsap.context(() => {
        barsRef.current.forEach((bar, i) => {
          if (!bar) return;
          const heights = [0.7, 0.4, 0.9, 0.5];
          if (isPlaying) {
            const totalDuration = 0.75 + i * 0.12;
            const step = totalDuration / 4;
            const tl = gsap.timeline({ repeat: -1, yoyo: true, delay: i * 0.1 });
            tl.to(bar, { scaleY: heights[i], duration: step, ease: "sine.inOut" })
              .to(bar, { scaleY: 0.15, duration: step, ease: "sine.inOut" })
              .to(bar, { scaleY: 1, duration: step, ease: "sine.inOut" })
              .to(bar, { scaleY: 0.4, duration: step, ease: "sine.inOut" });
          } else {
            gsap.to(bar, { scaleY: 0.25, duration: 0.25 });
          }
        });
      });
      return () => ctx.revert();
    },
    [isPlaying, tiltEnabled]
  );

  return (
    <div className="flex items-end gap-[3px] h-3.5 px-1 py-0.5" title={isPlaying ? "Đang phát" : "Tạm dừng"}>
      {[0.7, 0.4, 0.9, 0.5].map((heightScale, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className="w-[2.5px] rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] origin-bottom block"
          style={{ height: "100%" }}
        />
      ))}
    </div>
  );
}

export default function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setIsMounted(true);
  }, [isOpen]);

  useGSAP(
    () => {
      if (!isOpen || !drawerRef.current) return;
      gsap.fromTo(
        drawerRef.current,
        { xPercent: 100, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 0.8, ease: "power4.out" }
      );
    },
    [isOpen]
  );

  useEffect(() => {
    if (isOpen || !isMounted || !drawerRef.current) return;
    gsap.to(drawerRef.current, {
      xPercent: 100,
      opacity: 0,
      duration: 0.5,
      ease: "power3.in",
      onComplete: () => setIsMounted(false),
    });
  }, [isOpen, isMounted]);

  useGSAP(
    () => {
      if (!isOpen || !drawerRef.current) return;
      const items = drawerRef.current.querySelectorAll(".queue-item");
      gsap.from(items, {
        y: 20,
        opacity: 0,
        stagger: 0.04,
        ease: "power2.out",
        duration: 0.5,
      });
    },
    [isOpen]
  );

  const getCurrentIndex = () => {
    if (!currentTrack || contextQueue.length === 0) return contextIndex;
    const idx = contextQueue.findIndex((t) => String(t.id) === String(currentTrack.id));
    return idx !== -1 ? idx : contextIndex;
  };

  const activeIndex = getCurrentIndex();
  const remainingContextTracks = contextQueue.slice(activeIndex + 1);
  const totalUpcoming = userQueue.length + remainingContextTracks.length;

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

  if (!isMounted) return null;

  return (
    <div
      ref={drawerRef}
      className="fixed right-4 top-20 bottom-28 w-80 sm:w-88 z-40 rounded-3xl border border-white/15 bg-black/60 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden select-none"
      role="dialog"
      aria-label="Hàng đợi phát nhạc"
    >
      <div className="px-4 py-3.5 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ListMusic className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white tracking-wide truncate">Hàng đợi phát</h2>
          <span className="bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-medium text-white/80 shrink-0">
            {totalUpcoming}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {userQueue.length > 0 && (
            <button
              onClick={clearQueue}
              className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center gap-1 cursor-pointer"
              title="Xóa tất cả bài thêm thủ công"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa sạch</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] border border-transparent hover:border-white/20 transition-all cursor-pointer"
            title="Đóng hàng đợi"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        {currentTrack ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Đang phát
              </span>
              <SpatialEqualizer isPlaying={isPlaying} />
            </div>

            <div className="bg-indigo-500/15 border border-indigo-500/40 rounded-2xl p-3 shadow-[0_0_20px_rgba(99,102,241,0.2)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden shadow-md ring-1 ring-white/20">
                  <Artwork
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <SpatialEqualizer isPlaying={isPlaying} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-200 transition-colors truncate">
                      {currentTrack.title}
                    </h4>
                  </div>
                  <p className="text-xs text-white/60 truncate mt-0.5 font-medium">{renderArtist(currentTrack.artist)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center space-y-1">
            <Music2 className="w-6 h-6 text-white/30 mx-auto" />
            <p className="text-xs text-white/50">Chưa có bài hát đang phát</p>
          </div>
        )}

        {userQueue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Đã thêm vào hàng đợi ({userQueue.length})
              </h3>
            </div>

            <div className="space-y-1.5">
              {userQueue.map((track, index) => (
                <div
                  key={`user-${track.id}-${index}`}
                  className={`queue-item p-2.5 rounded-xl hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10 flex items-center justify-between group cursor-grab active:cursor-grabbing relative overflow-hidden ${
                    draggedIndex === index
                      ? "opacity-35 border-indigo-500/50 border-dashed bg-indigo-500/10"
                      : "bg-white/[0.02]"
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                >
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 mr-2 cursor-pointer"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden group/thumb bg-white/5 ring-1 ring-white/10">
                      <Artwork
                        src={track.image}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white/90 group-hover:text-indigo-300 transition-colors truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-white/40 truncate mt-0.5">{renderArtist(track.artist)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromUserQueue(index);
                      }}
                      className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer"
                      title="Tháo khỏi hàng đợi"
                      aria-label="Xóa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div
                      className="p-1 text-white/20 group-hover:text-white/60 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-md transition-colors"
                      title="Kéo thả để sắp xếp"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider truncate">
              Tiếp theo từ:{" "}
              <span className="text-indigo-300 font-semibold normal-case">{contextTitle}</span>
            </h3>
          </div>

          {remainingContextTracks.length > 0 ? (
            <div className="space-y-1.5">
              {remainingContextTracks.map((track, index) => {
                const targetOriginalIndex = activeIndex + 1 + index;

                return (
                  <div
                    key={`ctx-${track.id}-${index}`}
                    className="queue-item p-2.5 rounded-xl hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10 flex items-center justify-between group bg-white/[0.02] relative overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 mr-2 cursor-pointer"
                      onClick={() => handlePlayTrack(track)}
                    >
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden group/thumb bg-white/5 ring-1 ring-white/10">
                        <Artwork
                          src={track.image}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-white/90 group-hover:text-indigo-300 transition-colors truncate">
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-white/40 truncate mt-0.5">{renderArtist(track.artist)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (removeFromContextQueue) {
                            removeFromContextQueue(targetOriginalIndex);
                          }
                        }}
                        className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer"
                        title="Tháo khỏi hàng đợi"
                        aria-label="Xóa"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            userQueue.length === 0 && (
              <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-2xl space-y-2">
                <Music2 className="w-7 h-7 text-white/20 mx-auto" />
                <p className="text-xs font-medium text-white/50">Bài hát cuối trong danh sách</p>
                <p className="text-[11px] text-white/30">
                  Khi hết bài, nhạc sẽ tự động phát xoay vòng hoặc bài gợi ý
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

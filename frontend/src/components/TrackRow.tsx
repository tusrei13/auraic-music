"use client";

import { motion } from "framer-motion";
import { Play, Heart } from "lucide-react";
import Artwork from "@/components/Artwork";
import TrackActionMenu from "@/components/TrackActionMenu";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Track } from "@/store/usePlayerStore";

interface TrackRowProps {
  track: Track;
  index: number;
  queue?: Track[];
  contextTitle?: string;
  onPlay?: () => void;
}

export default function TrackRow({ track, index, queue, contextTitle, onPlay }: TrackRowProps) {
  const { playTrack, toggleLike, likedIds, currentTrack, isPlaying } = usePlayerStore();
  const liked = likedIds.some((id) => String(id) === String(track.id));
  const isCurrent = String(currentTrack?.id) === String(track.id);

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      playTrack(track, queue, contextTitle);
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(track);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAddToPlaylist = (_playlistId: string | number) => {
    handleMenuClick(_playlistId as any);
  };

  return (
    <motion.div
      className="group relative flex items-center gap-4 rounded-2xl border border-transparent bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-auraic-border hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(168,85,247,0.08)] cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ x: 6 }}
      onClick={handlePlay}
    >
      {/* Index or Equalizer */}
      <div className="w-6 flex justify-center">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                animate={{ height: ["30%", "100%", "40%", "90%", "50%"] }}
                transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Artwork */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-auraic-border">
        <Artwork src={track.image} alt={track.title} className="h-full w-full object-cover" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity"
          initial={false}
          whileHover={{ opacity: 1 }}
        >
          <Play className="h-5 w-5 fill-white text-white" />
        </motion.div>
      </div>

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <h4 className={`truncate text-sm font-semibold transition-colors ${isCurrent ? "text-fuchsia-300" : "text-white group-hover:text-fuchsia-200"}`}>
          {track.title}
        </h4>
        <p className="truncate text-xs text-white/40">
          {typeof track.artist === "object" ? track.artist?.name : track.artist}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <motion.button
          onClick={handleToggleLike}
          className={`p-1.5 rounded-lg transition-colors ${liked ? "text-pink-400" : "text-white/40 hover:text-pink-300 hover:bg-white/5"}`}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          title={liked ? "Bỏ thích" : "Yêu thích"}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        </motion.button>

        <TrackActionMenu track={track} onAddToPlaylist={handleAddToPlaylist} />
      </div>

      {/* Playing indicator for current track */}
      {isCurrent && isPlaying && (
        <motion.div
          className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-fuchsia-500 to-cyan-400"
          layoutId="playing-indicator"
          transition={{ type: "spring", damping: 24, stiffness: 180 }}
        />
      )}
    </motion.div>
  );
}

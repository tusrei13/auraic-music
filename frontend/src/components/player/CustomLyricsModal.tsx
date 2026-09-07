"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileText, Check, Music2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";

interface CustomLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export function parseLrc(lrcText: string): Array<{ time: number; text: string }> {
  const lines = lrcText.split("\n");
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let match;
    const timestamps: number[] = [];
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, "0").slice(0, 3), 10) : 0;
      timestamps.push(minutes * 60 + seconds + millis / 1000);
    }

    const text = trimmed.replace(timeRegex, "").trim();
    if (timestamps.length > 0 && text) {
      for (const time of timestamps) {
        result.push({ time, text });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

export default function CustomLyricsModal({
  isOpen,
  onClose,
  track,
}: CustomLyricsModalProps) {
  const [lyricsContent, setLyricsContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const { addToast } = useToastStore();

  if (!isOpen || !track) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLyricsContent(content);
      setActiveTab("paste");
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!lyricsContent.trim()) {
      addToast("Vui lòng nhập hoặc tải file lời bài hát", "error");
      return;
    }

    setSaving(true);
    try {
      const parsed = parseLrc(lyricsContent);
      const payloadLyrics = parsed.length > 0 ? parsed : lyricsContent;

      // 1. Try to persist into Supabase custom_lyrics table
      try {
        await supabase.from("custom_lyrics").upsert({
          track_id: String(track.id),
          track_title: track.title,
          artist_name: typeof track.artist === "string" ? track.artist : track.artist?.name,
          lyrics: lyricsContent,
          parsed_json: parsed.length > 0 ? parsed : null,
          updated_at: new Date().toISOString(),
        });
      } catch (sbErr) {
        console.warn("Supabase custom_lyrics optional table fallback:", sbErr);
      }

      // 2. Cache in local storage
      localStorage.setItem(`auraic-custom-lyrics-${track.id}`, JSON.stringify(payloadLyrics));

      // 3. Update current active track in player store immediately
      const currentTrack = usePlayerStore.getState().currentTrack;
      if (currentTrack && String(currentTrack.id) === String(track.id)) {
        usePlayerStore.setState({
          currentTrack: {
            ...currentTrack,
            lyrics: payloadLyrics,
          },
        });
      }

      addToast("Đã đồng bộ lời bài hát thành công!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addToast("Không thể lưu lời bài hát lúc này", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-neutral-950/85 p-6 shadow-2xl backdrop-blur-2xl text-white"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <Music2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Attach Custom Lyrics</h3>
                <p className="text-xs text-white/50 truncate max-w-xs">
                  {track.title} • {typeof track.artist === "string" ? track.artist : track.artist?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="mt-5 flex gap-2 rounded-xl bg-white/[0.05] p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                activeTab === "paste"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <FileText className="inline mr-1.5 h-3.5 w-3.5" /> Paste Text / .LRC
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                activeTab === "upload"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <UploadCloud className="inline mr-1.5 h-3.5 w-3.5" /> Upload File (.lrc, .txt)
            </button>
          </div>

          {/* Body */}
          <div className="mt-4">
            {activeTab === "upload" ? (
              <label className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-white/20 hover:border-violet-400 bg-white/[0.02] cursor-pointer transition p-4 text-center group">
                <UploadCloud className="h-10 w-10 text-white/40 group-hover:text-violet-400 mb-2 transition" />
                <span className="text-sm font-medium">Bấm để tải tệp lời bài hát</span>
                <span className="text-xs text-white/40 mt-1">Định dạng hỗ trợ: .lrc, .txt</span>
                <input
                  type="file"
                  accept=".lrc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={8}
                  value={lyricsContent}
                  onChange={(e) => setLyricsContent(e.target.value)}
                  placeholder={`[00:12.50] Dán lời bài hát kèm timestamp ở đây...\n[00:16.80] Hoặc văn bản thuần nếu không có thời gian.`}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 p-3.5 font-mono text-xs text-white/90 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 scrollbar-none"
                />
                <p className="text-[11px] text-white/40 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  Hỗ trợ định dạng chuẩn LRC thời gian thực: [mm:ss.xx]
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60 hover:bg-white/10 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : (
                <>
                  <Check className="h-4 w-4" /> Đồng bộ vào bài hát
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

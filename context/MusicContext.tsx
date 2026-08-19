"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Khai báo kiểu dữ liệu cho bài hát
export type Track = {
  id: number;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
};

// Khai báo các tính năng mà bộ não sẽ có
interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playMix: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Danh sách phát tổng để test nút Next/Prev
const defaultPlaylist: Track[] = [
  { id: 1, title: "Chạy Ngay Đi", artist: "Sơn Tùng M-TP", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Waiting For You", artist: "MONO", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Chìm Sâu", artist: "RPT MCK", image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 101, title: "Nốt Nhạc Trôi", artist: "Chillies", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = defaultPlaylist.findIndex(t => t.id === currentTrack.id);
    // Nếu không tìm thấy hoặc là bài cuối cùng, quay lại bài đầu tiên (Loop)
    const nextIndex = (currentIndex === -1 || currentIndex === defaultPlaylist.length - 1) ? 0 : currentIndex + 1;
    playTrack(defaultPlaylist[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentTrack) return;
    const currentIndex = defaultPlaylist.findIndex(t => t.id === currentTrack.id);
    // Nếu là bài đầu tiên, quay lại bài cuối cùng
    const prevIndex = (currentIndex <= 0) ? defaultPlaylist.length - 1 : currentIndex - 1;
    playTrack(defaultPlaylist[prevIndex]);
  };

  const playMix = () => {
    // Lấy ngẫu nhiên một bài hát trong danh sách defaultPlaylist
    const randomIndex = Math.floor(Math.random() * defaultPlaylist.length);
    playTrack(defaultPlaylist[randomIndex]);
  };

  return (
    <MusicContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay, playNext, playPrevious, playMix }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
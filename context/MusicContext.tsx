"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Khai báo kiểu dữ liệu cho bài hát
export type Track = {
  id: number;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
  lyrics?: { time: number; text: string }[]; // Thêm thuộc tính lyrics để lưu lời bài hát
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
  { 
    id: 1, 
    title: "Chạy Ngay Đi", 
    artist: "Sơn Tùng M-TP", 
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lyrics: [
      { time: 0, text: "(Nhạc dạo...)" },
      { time: 5, text: "Chạy ngay đi, trước khi..." },
      { time: 10, text: "Mọi điều tồi tệ hơn..." },
      { time: 15, text: "Gạt bỏ đi, những thứ..." },
      { time: 20, text: "Làm tổn thương nhau..." }
    ]
  },
  { 
    id: 2, 
    title: "Waiting For You", 
    artist: "MONO", 
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    lyrics: [
      { time: 0, text: "(Intro bắt tai...)" },
      { time: 5, text: "Khi màn đêm buông xuống..." },
      { time: 10, text: "Anh lại nghĩ về em..." },
      { time: 15, text: "Cứ thế chờ đợi từng ngày..." },
      { time: 20, text: "I'm waiting for you..." }
    ]
  },
  { 
    id: 3, 
    title: "Chìm Sâu", 
    artist: "RPT MCK", 
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    lyrics: [
      { time: 0, text: "(Beat Chill...)" },
      { time: 5, text: "Tại vì anh thương em..." },
      { time: 10, text: "Nên là anh mới thế..." },
      { time: 15, text: "Chìm sâu vào trong đôi mắt em..." },
      { time: 20, text: "Gặp em vào một ngày nắng..." }
    ]
  },
  { 
    id: 101, 
    title: "Nốt Nhạc Trôi", 
    artist: "Chillies", 
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    lyrics: [
      { time: 0, text: "(Nhạc nhẹ nhàng...)" },
      { time: 5, text: "Những giai điệu nhẹ nhàng..." },
      { time: 10, text: "Trôi theo từng đám mây..." },
      { time: 15, text: "Màn đêm khẽ buông..." },
      { time: 20, text: "Gửi trao niềm thương..." }
    ]
  },
];

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track) => {
    // Tự động tìm lyrics từ defaultPlaylist nếu bài hát truyền vào chưa có
    const matchedTrack = defaultPlaylist.find(t => t.id === track.id);
    const fullTrackData = {
      ...track,
      lyrics: track.lyrics || matchedTrack?.lyrics,
    };

    setCurrentTrack(fullTrackData);
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
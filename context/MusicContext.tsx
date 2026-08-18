"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// 1. Khai báo khuôn mẫu (kiểu dữ liệu) của một bài hát
export type Track = {
  id: number;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
};

// Khai báo những gì Trạm phát sóng này sẽ cung cấp
interface MusicContextType {
  currentTrack: Track | null;       // Bài hát đang phát hiện tại
  playTrack: (track: Track) => void; // Hành động chọn bài hát mới
}

// 2. Tạo Trạm phát sóng
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// 3. Tạo "Cái loa" (Provider) để bọc bên ngoài ứng dụng
export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // Hàm này sẽ được Trang chủ gọi khi click vào 1 Album
  const playTrack = (track: Track) => {
    setCurrentTrack(track);
  };

  return (
    <MusicContext.Provider value={{ currentTrack, playTrack }}>
      {children}
    </MusicContext.Provider>
  );
}

// 4. Tạo một công cụ (Hook) để các component khác dễ dàng kết nối vào Trạm phát sóng
export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic phải được sử dụng bên trong MusicProvider");
  }
  return context;
}
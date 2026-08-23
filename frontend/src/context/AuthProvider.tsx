"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const userId = useAuthStore((state) => state.user?.id || null);
  const switchPlayerUser = usePlayerStore((state) => state.switchUser);
  const switchPlaylistUser = usePlaylistStore((state) => state.switchUser);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    switchPlayerUser(userId);
    switchPlaylistUser(userId);
  }, [switchPlayerUser, switchPlaylistUser, userId]);

  return children;
}

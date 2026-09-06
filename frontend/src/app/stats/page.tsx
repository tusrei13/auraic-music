"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getMyListeningInsights, type UserListeningInsights } from "@/lib/api";
import { Loader2, TrendingUp, PlayCircle, SkipForward, CheckCircle2, Music2 } from "lucide-react";

const METRIC_ITEMS = [
  { key: "started", label: "Đã phát", icon: PlayCircle, color: "text-cyan-300" },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle2, color: "text-emerald-300" },
  { key: "skipped", label: "Đã bỏ qua", icon: SkipForward, color: "text-amber-300" },
] as const;

export default function StatsPage() {
  const { status, initialize } = useAuthStore();
  const [insights, setInsights] = useState<UserListeningInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(14);

  useEffect(() => {
    if (status === "idle") void initialize();
  }, [initialize, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    setError(null);
    void getMyListeningInsights(days)
      .then(setInsights)
      .catch(() => setError("Không thể tải dữ liệu thống kê"))
      .finally(() => setIsLoading(false));
  }, [status, days]);

  if (status === "idle") {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
        <Music2 className="h-8 w-8" />
        <p>Đăng nhập để xem thống kê nghe nhạc</p>
      </div>
    );
  }

  const maxPlays = insights?.topTracks[0]?.plays ?? 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Thống kê nghe nhạc</h1>
          <p className="mt-1 text-sm text-white/55">Dữ liệu {days} ngày gần nhất</p>
        </div>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-sm text-white outline-none backdrop-blur-xl"
        >
          <option value={7}>7 ngày</option>
          <option value={14}>14 ngày</option>
          <option value={30}>30 ngày</option>
        </select>
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
        </div>
      ) : error ? (
        <p className="mt-10 text-center text-sm text-rose-300">{error}</p>
      ) : insights ? (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {METRIC_ITEMS.map((item) => {
              const value = insights.metrics[item.key as keyof typeof insights.metrics] as number;
              return (
                <div key={item.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className={`flex items-center gap-2 text-xs font-semibold ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-3xl font-black text-white">{value}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-200">
              <TrendingUp className="h-4 w-4" />
              Tỷ lệ hoàn thành
            </div>
            <p className="mt-2 text-3xl font-black text-white">{insights.metrics.completionRate}%</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                style={{ width: `${Math.min(insights.metrics.completionRate, 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-sm font-bold text-white">Top bài hát nghe nhiều</h2>
            <div className="mt-4 space-y-4">
              {insights.topTracks.length === 0 ? (
                <p className="text-sm text-white/50">Chưa có dữ liệu</p>
              ) : (
                insights.topTracks.map((track, index) => (
                  <div key={track.trackId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-4 text-white">{index + 1}. {track.title}</span>
                      <span className="shrink-0 text-white/55">{track.plays} lần</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-400"
                        style={{ width: `${(track.plays / maxPlays) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

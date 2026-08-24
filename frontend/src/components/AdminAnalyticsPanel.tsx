"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { getAdminAnalytics, type AdminAnalytics } from "@/lib/api";

export default function AdminAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(false);
    try {
      setAnalytics(await getAdminAnalytics());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  if (loading) {
    return <div className="mt-8 flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/45"><Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" /> Loading analytics...</div>;
  }

  if (error) {
    return <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-10 text-center text-sm text-rose-100"><p>Không thể tải dữ liệu analytics.</p><button type="button" onClick={() => void loadAnalytics()} className="flex min-h-10 items-center gap-2 rounded-xl border border-rose-200/30 px-3 font-semibold hover:bg-rose-200/10"><RefreshCw className="h-4 w-4" /> Thử lại</button></div>;
  }

  const maxStarted = Math.max(...(analytics?.daily.map((day) => day.started) || [0]), 1);
  const totals = analytics?.totals || { started: 0, completed: 0, skipped: 0 };

  return <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
    <article className="rounded-2xl border border-white/10 bg-black/20 p-6">
      <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-cyan-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Persisted events</p><h2 className="mt-1 text-xl font-black">Listening momentum</h2></div></div>
      <div className="mt-8 flex h-48 items-end gap-2 border-b border-white/10">
        {analytics?.daily.map((day) => <div key={day.date} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className="relative min-h-1 rounded-t-md bg-gradient-to-t from-fuchsia-500/70 to-cyan-300/80" style={{ height: `${Math.max((day.started / maxStarted) * 100, day.started ? 4 : 1)}%` }} title={`${day.date}: ${day.started} started`} /><span className="truncate text-center text-[9px] text-white/30">{day.date.slice(5)}</span></div>)}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div><p className="text-2xl font-black text-cyan-200">{totals.started}</p><p className="text-[10px] uppercase tracking-wider text-white/35">Started</p></div><div><p className="text-2xl font-black text-emerald-200">{totals.completed}</p><p className="text-[10px] uppercase tracking-wider text-white/35">Completed</p></div><div><p className="text-2xl font-black text-rose-200">{totals.skipped}</p><p className="text-[10px] uppercase tracking-wider text-white/35">Skipped</p></div></div>
    </article>
    <article className="rounded-2xl border border-white/10 bg-black/20 p-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">Top tracks</p><h2 className="mt-1 text-xl font-black">Most started</h2>{analytics?.topTracks.length ? <div className="mt-5 space-y-4">{analytics.topTracks.slice(0, 5).map((track, index) => <div key={track.trackId} className="flex items-center gap-3"><span className="w-5 text-xs text-white/30">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-sm">{track.title}</span><span className="text-xs text-cyan-200">{track.plays}</span></div>)}</div> : <p className="mt-8 text-sm leading-6 text-white/40">Chưa có playback event trong 7 ngày gần nhất.</p>}</article>
  </section>;
}

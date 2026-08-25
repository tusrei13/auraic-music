"use client";

import { useState } from "react";
import { Clipboard, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { isJamendoTrackId } from "@/lib/api";

export default function LicenseActions({ mode }: { mode: "info" | "download" | "credits" }) {
  const { currentTrack } = usePlayerStore();
  const [useCase, setUseCase] = useState("personal");
  const [accepted, setAccepted] = useState(false);
  const [copied, setCopied] = useState(false);
  const track = currentTrack as (typeof currentTrack & { licenseUrl?: string }) | null;
  const artist = typeof track?.artist === "string" ? track.artist : track?.artist?.name || "Auraic artist";
  const licenseUrl = track?.licenseUrl || "https://creativecommons.org/licenses/";
  const isDownloadable = Boolean(track?.audioUrl && isJamendoTrackId(track.id));
  const attribution = track ? `"${track.title}" by ${artist}, available on Auraic. ${licenseUrl}` : "Select an Auraic track to generate attribution.";

  const copyAttribution = async () => {
    await navigator.clipboard.writeText(attribution);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (mode === "credits") return <section className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><h2 className="font-bold">Copy-ready attribution</h2><p className="mt-1 text-xs text-white/40">Keep the artist and original source visible when using this track.</p></div></div><p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/70">{attribution}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void copyAttribution()} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy credit"}</button><a href={licenseUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/65 hover:bg-white/10"><ExternalLink className="h-4 w-4" /> View license</a></div></section>;

  if (mode === "info") return <section className="mt-8 max-w-2xl rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">License source</p><h2 className="mt-2 text-xl font-bold">Attribution required</h2></div><ShieldCheck className="h-6 w-6 text-emerald-300" /></div><p className="mt-4 text-sm leading-6 text-white/60">Check the original terms before publishing, remixing or using this track commercially.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void copyAttribution()} className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-200 px-4 text-sm font-bold text-emerald-950"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy attribution"}</button><a href={licenseUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/70 hover:bg-white/10"><ExternalLink className="h-4 w-4" /> Original terms</a></div></section>;

  return <section className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">Use this track</p><h2 className="mt-2 text-xl font-bold">Choose your use case</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ value: "personal", label: "Personal" }, { value: "non-commercial", label: "Non-commercial" }, { value: "commercial", label: "Commercial" }].map((option) => <button key={option.value} type="button" onClick={() => setUseCase(option.value)} className={`min-h-12 rounded-xl border px-3 text-sm font-semibold ${useCase === option.value ? "border-fuchsia-300 bg-fuchsia-300/15 text-fuchsia-100" : "border-white/10 text-white/55 hover:bg-white/10"}`}>{option.label}</button>)}</div><label className="mt-5 flex items-start gap-3 text-sm text-white/60"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-fuchsia-400" />I have read the license terms and will include the required attribution.</label><div className="mt-6 flex flex-wrap items-center gap-3"><a href={isDownloadable && accepted && useCase !== "commercial" ? track?.audioUrl : undefined} download={track?.title || "auraic-track"} aria-disabled={!isDownloadable || !accepted || useCase === "commercial"} className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold ${isDownloadable && accepted && useCase !== "commercial" ? "bg-fuchsia-300 text-slate-950" : "cursor-not-allowed bg-white/10 text-white/30"}`}><Download className="h-4 w-4" />{useCase === "commercial" ? "Request commercial license" : "Download track"}</a><button type="button" onClick={() => void copyAttribution()} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/60 hover:bg-white/10"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy credit"}</button></div>{!currentTrack ? <p className="mt-4 text-xs text-amber-200/70">Choose a track in the player first.</p> : null}</section>;
}

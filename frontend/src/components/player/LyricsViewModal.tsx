"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";
import { normalizeLyrics, type LyricLine } from "@/lib/lyrics";
import { getLyrics } from "@/lib/api";
import { ChevronDown, Heart, Share2, Disc3, Mic2 } from "lucide-react";
import Artwork from "@/components/Artwork";
import TrackActionMenu from "@/components/TrackActionMenu";

interface LyricsViewModalProps {
  currentTime: number;
  onSeek?: (time: number) => void;
}

interface Palette {
  primary: string;
  secondary: string;
  tertiary: string;
  primaryGlow: string;
  secondaryGlow: string;
}

const DEFAULT_PALETTES: Palette[] = [
  {
    primary: "#a855f7",
    secondary: "#06b6d4",
    tertiary: "#ec4899",
    primaryGlow: "rgba(168, 85, 247, 0.4)",
    secondaryGlow: "rgba(6, 182, 212, 0.35)",
  },
  {
    primary: "#6366f1",
    secondary: "#ec4899",
    tertiary: "#3b82f6",
    primaryGlow: "rgba(99, 102, 241, 0.4)",
    secondaryGlow: "rgba(236, 72, 153, 0.35)",
  },
  {
    primary: "#10b981",
    secondary: "#06b6d4",
    tertiary: "#8b5cf6",
    primaryGlow: "rgba(16, 185, 129, 0.4)",
    secondaryGlow: "rgba(6, 182, 212, 0.35)",
  },
  {
    primary: "#f43f5e",
    secondary: "#8b5cf6",
    tertiary: "#f59e0b",
    primaryGlow: "rgba(244, 63, 94, 0.4)",
    secondaryGlow: "rgba(139, 92, 246, 0.35)",
  },
];

function extractPaletteFromHash(str: string): Palette {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DEFAULT_PALETTES.length;
  return DEFAULT_PALETTES[idx];
}

export default function LyricsViewModal({ currentTime, onSeek }: LyricsViewModalProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isLyricsOpen = usePlayerStore((state) => state.isLyricsOpen);
  const closeLyrics = usePlayerStore((state) => state.closeLyrics);
  const likedIds = usePlayerStore((state) => state.likedIds);
  const toggleLike = usePlayerStore((state) => state.toggleLike);

  const [fetchedLyrics, setFetchedLyrics] = useState<LyricLine[] | null>(null);
  const [fetchedPlainLyrics, setFetchedPlainLyrics] = useState<string | null>(null);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTES[0]);
  const [isMounted, setIsMounted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const minimizeBtnRef = useRef<HTMLButtonElement>(null);

  const artistName = useMemo(() => {
    if (!currentTrack?.artist) return "Ca sĩ chưa xác định";
    return typeof currentTrack.artist === "object" ? currentTrack.artist.name : currentTrack.artist;
  }, [currentTrack]);

  const liked = currentTrack
    ? likedIds.some((id) => String(id) === String(currentTrack.id))
    : false;

  const baseLikes = 18960;
  const likeCount = baseLikes + (liked ? 1 : 0);
  const shareCount = 662;

  const handleShare = useCallback(() => {
    if (!currentTrack) return;
    const shareText = `${currentTrack.title} - ${artistName} | Auraic Music`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(shareText);
      useToastStore.getState().addToast("Đã sao chép liên kết bài hát!", "success");
    }
  }, [currentTrack, artistName]);

  const lyrics = useMemo(() => {
    const source = currentTrack?.lyrics || fetchedLyrics || fetchedPlainLyrics;
    const normalized = normalizeLyrics(source);
    return Array.isArray(normalized) ? normalized : [];
  }, [currentTrack?.lyrics, fetchedLyrics, fetchedPlainLyrics]);

  const activeIndex = useMemo(() => {
    if (!currentTrack || lyrics.length === 0) return -1;
    let active = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [currentTrack, lyrics, currentTime]);

  // Dynamic Palette Extraction from Album Artwork
  useEffect(() => {
    if (!currentTrack?.image) {
      setPalette(extractPaletteFromHash(currentTrack?.title || "Auraic"));
      return;
    }

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentTrack.image;

    img.onload = () => {
      if (isCancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;

        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;
        let rAlt = 0,
          gAlt = 0,
          bAlt = 0,
          countAlt = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;

          if (brightness > 40 && brightness < 220) {
            if (r > g && r > b) {
              rSum += r;
              gSum += g;
              bSum += b;
              count++;
            } else {
              rAlt += r;
              gAlt += g;
              bAlt += b;
              countAlt++;
            }
          }
        }

        if (count > 0 && countAlt > 0) {
          const c1 = `rgb(${Math.round(rSum / count)}, ${Math.round(gSum / count)}, ${Math.round(bSum / count)})`;
          const c2 = `rgb(${Math.round(rAlt / countAlt)}, ${Math.round(gAlt / countAlt)}, ${Math.round(bAlt / countAlt)})`;
          setPalette({
            primary: c1,
            secondary: c2,
            tertiary: "#8b5cf6",
            primaryGlow: `rgba(${Math.round(rSum / count)}, ${Math.round(gSum / count)}, ${Math.round(bSum / count)}, 0.45)`,
            secondaryGlow: `rgba(${Math.round(rAlt / countAlt)}, ${Math.round(gAlt / countAlt)}, ${Math.round(bAlt / countAlt)}, 0.35)`,
          });
        } else {
          setPalette(extractPaletteFromHash(currentTrack.title));
        }
      } catch {
        setPalette(extractPaletteFromHash(currentTrack.title));
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setPalette(extractPaletteFromHash(currentTrack.title));
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.image, currentTrack?.title]);

  // Fetch Lyrics if not embedded
  useEffect(() => {
    let isCancelled = false;

    if (!currentTrack) {
      setFetchedLyrics(null);
      setFetchedPlainLyrics(null);
      setLyricsLoaded(false);
      return;
    }

    if (currentTrack.lyrics) {
      setLyricsLoaded(true);
      return;
    }

    setLyricsLoaded(false);
    const artist = (typeof currentTrack.artist === "object" ? currentTrack.artist.name : currentTrack.artist) || "";

    getLyrics(currentTrack.title, artist)
      .then(async (data) => {
        if (isCancelled) return;
        const raw = data?.syncedLyrics || data?.plainLyrics;
        if (raw) {
          const durationNum = currentTrack.duration ? Number(currentTrack.duration) : undefined;
          const normalized = normalizeLyrics(raw, durationNum);
          if (normalized.length > 0) {
            setFetchedLyrics(normalized);
            setLyricsLoaded(true);
            return;
          }
        }

        if (!isCancelled) {
          setFetchedLyrics([]);
          setLyricsLoaded(true);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setFetchedLyrics([]);
          setLyricsLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  // Mount / Unmount modal
  useEffect(() => {
    if (isLyricsOpen) {
      setIsMounted(true);
    }
  }, [isLyricsOpen]);

  // GSAP: Modal entry animation
  useGSAP(
    () => {
      if (!isLyricsOpen || !modalRef.current) return;
      gsap.fromTo(
        modalRef.current,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: "power4.out" }
      );
    },
    [isLyricsOpen]
  );

  // GSAP: Modal exit animation
  useEffect(() => {
    if (isLyricsOpen || !isMounted || !modalRef.current) return;
    gsap.to(modalRef.current, {
      yPercent: 100,
      opacity: 0,
      duration: 0.5,
      ease: "power3.in",
      onComplete: () => setIsMounted(false),
    });
  }, [isLyricsOpen, isMounted]);

  // GSAP: Blob infinite animations
  useGSAP(
    () => {
      if (!isLyricsOpen) return;
      const ctx = gsap.context(() => {
        if (blob1Ref.current) {
          gsap.to(blob1Ref.current, {
            x: 80,
            y: -60,
            scale: 1.15,
            duration: 5.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
        if (blob2Ref.current) {
          gsap.to(blob2Ref.current, {
            x: -70,
            y: 50,
            scale: 0.9,
            duration: 6.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      });
      return () => ctx.revert();
    },
    [isLyricsOpen]
  );

  // GSAP: Loader spinner
  useGSAP(
    () => {
      if (lyricsLoaded || !loaderRef.current) return;
      gsap.to(loaderRef.current, {
        rotate: 360,
        duration: 4,
        repeat: -1,
        ease: "none",
      });
    },
    [lyricsLoaded]
  );

  // GSAP: Minimize button hover
  useEffect(() => {
    const btn = minimizeBtnRef.current;
    if (!btn) return;
    const onEnter = () => gsap.to(btn, { scale: 1.1, duration: 0.2, force3D: true });
    const onLeave = () => gsap.to(btn, { scale: 1, duration: 0.2, force3D: true });
    const onDown = () => gsap.to(btn, { scale: 0.9, duration: 0.1, force3D: true });
    const onUp = () => gsap.to(btn, { scale: 1.1, duration: 0.2, force3D: true });
    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("mousedown", onDown);
    btn.addEventListener("mouseup", onUp);
    return () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("mousedown", onDown);
      btn.removeEventListener("mouseup", onUp);
    };
  }, [isLyricsOpen]);

  // GSAP: Karaoke lyrics timeline + smooth scroll interp
  useGSAP(
    () => {
      if (!isLyricsOpen || !lyricsRef.current || activeIndex < 0) return;

      const container = lyricsRef.current;
      const lines = container.querySelectorAll("[data-lyric-line]");

      lines.forEach((line, idx) => {
        const el = line as HTMLElement;
        if (idx === activeIndex) {
          gsap.to(el, {
            scale: 1.05,
            color: "white",
            duration: 0.4,
            ease: "power2.out",
            force3D: true,
          });
        } else if (idx < activeIndex) {
          gsap.to(el, {
            scale: 1,
            color: "rgba(255,255,255,0.35)",
            duration: 0.3,
            ease: "power2.out",
          });
        } else {
          gsap.to(el, {
            scale: 1,
            color: "rgba(255,255,255,0.3)",
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });

      const activeEl = lines[activeIndex] as HTMLElement | undefined;
      if (activeEl && container) {
        const targetY =
          activeEl.offsetTop -
          container.offsetTop -
          container.clientHeight / 2 +
          activeEl.clientHeight / 2;
        gsap.to(container, {
          scrollTop: targetY,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    },
    [activeIndex, isLyricsOpen]
  );

  const handleSeek = (time: number) => {
    if (onSeek) {
      onSeek(time);
    }
  };

  if (!currentTrack) return null;

  return (
    <>
      {isMounted && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#07080d] pb-[108px] sm:pb-[100px] md:pb-[96px]"
        >
          {/* Backdrop blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              ref={blob1Ref}
              className="absolute -top-[20%] -left-[10%] h-[75vw] w-[75vw] max-h-[850px] max-w-[850px] rounded-full blur-[110px]"
              style={{
                background: `radial-gradient(circle, ${palette.primaryGlow} 0%, transparent 70%)`,
              }}
            />
            <div
              ref={blob2Ref}
              className="absolute -bottom-[20%] -right-[10%] h-[80vw] w-[80vw] max-h-[900px] max-w-[900px] rounded-full blur-[130px]"
              style={{
                background: `radial-gradient(circle, ${palette.secondaryGlow} 0%, transparent 70%)`,
              }}
            />
            <div className="absolute inset-0 backdrop-blur-3xl opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/75 to-[#05060a]/95" />
          </div>

          {/* Minimize button */}
          <div className="relative z-20 flex items-center justify-end px-6 pt-5 pb-1 sm:px-10 sm:pt-6">
            <button
              ref={minimizeBtnRef}
              onClick={closeLyrics}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-md border border-white/10 shadow-lg cursor-pointer active:scale-90 transition-all hover:bg-white/20 hover:text-white"
              title="Thu nhỏ lời bài hát"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden px-6 sm:px-10 lg:px-16 pb-4">
            {/* Left column: artwork + details */}
            <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 flex-col items-center justify-center p-6 xl:p-10">
              <div className="flex flex-col items-start max-w-[340px] xl:max-w-[380px] w-full">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 group">
                  <div
                    className="pointer-events-none absolute -inset-3 -z-10 rounded-2xl opacity-40 blur-2xl transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle at center, ${palette.primaryGlow} 0%, ${palette.secondaryGlow} 60%, transparent 80%)`,
                    }}
                  />
                  <Artwork
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="mt-5 w-full">
                  <h3 className="text-xl xl:text-2xl font-bold text-white tracking-tight line-clamp-1">
                    {currentTrack.title}
                  </h3>
                  <p className="text-sm xl:text-base font-medium text-white/60 mt-1 line-clamp-1">
                    {artistName}
                  </p>

                  <div className="mt-4 flex items-center gap-7">
                    <button
                      onClick={() => toggleLike(currentTrack)}
                      className="flex flex-col items-center gap-1 text-white/60 hover:text-pink-400 transition-colors cursor-pointer group"
                      title={liked ? "Bỏ thích" : "Yêu thích"}
                    >
                      <Heart
                        className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                          liked ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : ""
                        }`}
                      />
                      <span className="text-[11px] font-medium font-mono text-white/50">{likeCount}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer group"
                      title="Chia sẻ bài hát"
                    >
                      <Share2 className="h-5 w-5 transition-transform group-hover:scale-110" />
                      <span className="text-[11px] font-medium font-mono text-white/50">{shareCount}</span>
                    </button>

                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <TrackActionMenu track={currentTrack} placement="up" />
                      <span className="text-[11px] font-medium font-mono text-transparent select-none">...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: header + lyrics */}
            <div
              ref={lyricsRef}
              className="flex-1 overflow-y-auto px-4 py-8 text-left scrollbar-none sm:px-8 lg:px-10 lg:py-12"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 10%, black 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 10%, black 88%, transparent 100%)",
              }}
            >
              <div className="mx-auto flex max-w-3xl flex-col">
                <div className="mb-6 lg:mb-8 text-left space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-400/40 bg-purple-950/40 font-arcade text-xs text-purple-300 mb-2">
                    <Mic2 className="w-3.5 h-3.5" />
                    <span>8-BIT RETRO KARAOKE SYNC</span>
                  </div>
                  <h2 className="font-pixel text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-bold text-neutral-400 leading-snug">
                    Track: <span className="text-white font-extrabold">{currentTrack.title}</span>
                  </h2>
                  <h3 className="font-arcade text-sm sm:text-base text-white/70 tracking-wider">
                    Artist: <span className="text-cyan-300 font-bold">{artistName}</span>
                  </h3>
                </div>

                {!lyricsLoaded ? (
                  <div ref={loaderRef} className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-white/50">
                    <Disc3 className="h-10 w-10 text-white/40 animate-spin" />
                    <p className="font-arcade text-sm tracking-wide">Đang đọc dữ liệu karaoke...</p>
                  </div>
                ) : lyrics.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-white/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-xl">
                      <Mic2 className="h-8 w-8 text-white/40" />
                    </div>
                    <div className="text-center">
                      <p className="font-pixel text-lg font-bold text-white/90">Bản nhạc không lời</p>
                      <p className="font-arcade text-xs text-white/40 mt-1 tracking-wider">
                        Thưởng thức giai điệu du dương trong không gian Arcade Hi-Fi
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 py-6 pb-20">
                    {lyrics.map((line, index) => {
                      const isCurrent = index === activeIndex;
                      const isPassed = index < activeIndex;

                      return (
                        <div
                          key={`${line.time}-${index}`}
                          data-lyric-line
                          ref={isCurrent ? activeLineRef : undefined}
                          onClick={() => handleSeek(line.time)}
                          className="group cursor-pointer select-none transition-all duration-300 text-left"
                        >
                          <p
                            className={`font-pixel leading-tight tracking-tight transition-all duration-300 ${
                              isCurrent
                                ? "text-2xl sm:text-3xl lg:text-[40px] xl:text-[44px] font-black text-white"
                                : isPassed
                                ? "text-xl sm:text-2xl lg:text-[30px] xl:text-[34px] font-bold text-white/35 hover:text-white/80"
                                : "text-xl sm:text-2xl lg:text-[30px] xl:text-[34px] font-bold text-white/30 hover:text-white/80"
                            }`}
                            style={
                              isCurrent
                                ? {
                                    textShadow: `0 0 25px ${palette.primaryGlow}, 0 0 50px ${palette.secondaryGlow}`,
                                  }
                                : undefined
                            }
                          >
                            {line.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { motion, useAnimation, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type ReactNode, useEffect, useRef } from "react";

export const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export const slideIn = {
  hidden: { opacity: 0, x: -30 },
  show: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);
  const springConfig = { damping: 20, stiffness: 200 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
    >
      {children}
    </motion.div>
  );
}

export function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-20 overflow-hidden rounded-inherit pointer-events-none"
      initial={{ x: "-100%" }}
      whileHover={{ x: "100%" }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <div className="h-full w-[40%] rotate-[25deg] translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
}

export function AnimatedEqualizer({ isActive, className = "" }: { isActive: boolean; className?: string }) {
  const bars = [1, 2, 3, 4];
  return (
    <div className={`flex items-end gap-0.5 ${className}`} aria-label="Equalizer">
      {bars.map((bar) => (
        <motion.span
          key={bar}
          className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
          animate={isActive ? { height: ["35%", "90%", "45%", "100%", "60%"] } : { height: "15%" }}
          transition={
            isActive
              ? { duration: 0.6 + bar * 0.15, repeat: Infinity, ease: "easeInOut", delay: bar * 0.08 }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            controls.start("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    const current = ref.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [controls, threshold]);

  return { ref, controls };
}

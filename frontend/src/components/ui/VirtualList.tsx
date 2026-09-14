"use client";

/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual's useVirtualizer
   intentionally returns non-memoizable functions; React Compiler reacts by skipping
   memoization of this leaf component, which is the supported integration. */

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualListProps<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  maxHeight?: string;
  className?: string;
  children: (item: T, index: number) => ReactNode;
}

/**
 * Windowed/virtualized list: mounts only the rows actually visible on screen
 * (plus a small overscan), so hundreds of track rows never touch the DOM.
 * Uses pure transform-based positioning on the GPU compositor thread.
 */
export default function VirtualList<T>({
  items,
  estimateSize = 64,
  overscan = 6,
  maxHeight = "min(70vh, 640px)",
  className = "",
  children,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto scrollbar-none ${className}`}
      style={{ maxHeight }}
    >
      <div
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (item === undefined) return null;
          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 w-full will-change-transform"
              style={{
                height: virtualRow.size,
                transform: `translate3d(0, ${virtualRow.start}px, 0)`,
              }}
            >
              {children(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
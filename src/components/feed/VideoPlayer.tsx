"use client";

import { useEffect, useRef } from "react";
import type { ScoredVideo } from "@/types";

interface VideoPlayerProps {
  video: ScoredVideo;
  isActive: boolean;
  onWatched: (watchedDuration: number, skipped: boolean) => void;
}

export function VideoPlayer({ video, isActive, onWatched }: VideoPlayerProps) {
  const startTimeRef = useRef<number | null>(null);
  const hasReportedRef = useRef(false);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      hasReportedRef.current = false;
    } else {
      if (startTimeRef.current && !hasReportedRef.current) {
        const watchedMs = Date.now() - startTimeRef.current;
        const watchedSec = watchedMs / 1000;
        const skipped = watchedSec < video.duration * 0.3;
        onWatched(watchedSec, skipped);
        hasReportedRef.current = true;
      }
      startTimeRef.current = null;
    }
  }, [isActive, video.duration, onWatched]);

  return (
    <div className="relative w-full h-full bg-black">
      {isActive ? (
        <iframe
          src={video.embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={video.title}
        />
      ) : (
        // Thumbnail placeholder when not active
        <div className="w-full h-full relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
    </div>
  );
}

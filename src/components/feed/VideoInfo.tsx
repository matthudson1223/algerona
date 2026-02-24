"use client";

import { useState } from "react";
import type { ScoredVideo } from "@/types";

interface VideoInfoProps {
  video: ScoredVideo;
}

export function VideoInfo({ video }: VideoInfoProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-14 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
      <p className="text-white font-semibold text-sm mb-1">@{video.channelName}</p>
      <button
        className="text-zinc-200 text-xs text-left pointer-events-auto"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={expanded ? "" : "line-clamp-2"}>
          {video.title}
          {video.description && ` · ${video.description}`}
        </span>
        {!expanded && video.description && (
          <span className="text-zinc-400 ml-1">more</span>
        )}
      </button>
    </div>
  );
}

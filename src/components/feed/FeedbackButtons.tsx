"use client";

import { useState } from "react";
import type { ScoredVideo } from "@/types";

interface FeedbackButtonsProps {
  video: ScoredVideo;
  onFeedback: (action: string) => void;
  onWhyShown: () => void;
}

export function FeedbackButtons({ video, onFeedback, onWhyShown }: FeedbackButtonsProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleLike = () => {
    setLiked(true);
    setDisliked(false);
    onFeedback("like");
  };

  const handleDislike = () => {
    setDisliked(true);
    setLiked(false);
    onFeedback("dislike");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-3">
      {/* Channel avatar */}
      <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden border-2 border-white">
        {video.channelName.charAt(0).toUpperCase()}
      </div>

      {/* Like */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1"
        aria-label="Like"
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${liked ? "bg-red-500" : "bg-black/40"}`}>
          <svg className="w-6 h-6 text-white" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="text-white text-xs">{(video.likeCount / 1000).toFixed(1)}K</span>
      </button>

      {/* Dislike */}
      <button
        onClick={handleDislike}
        className="flex flex-col items-center gap-1"
        aria-label="Dislike"
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${disliked ? "bg-zinc-500" : "bg-black/40"}`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </div>
        <span className="text-white text-xs">Skip</span>
      </button>

      {/* More like this */}
      <button
        onClick={() => onFeedback("more_like_this")}
        className="flex flex-col items-center gap-1"
        aria-label="More like this"
      >
        <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-white text-xs">More</span>
      </button>

      {/* Less like this */}
      <button
        onClick={() => onFeedback("less_like_this")}
        className="flex flex-col items-center gap-1"
        aria-label="Less like this"
      >
        <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </div>
        <span className="text-white text-xs">Less</span>
      </button>

      {/* Why shown */}
      <button
        onClick={onWhyShown}
        className="flex flex-col items-center gap-1"
        aria-label="Why was this shown"
      >
        <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
          <span className="text-white text-lg font-bold">?</span>
        </div>
        <span className="text-white text-xs">Why</span>
      </button>
    </div>
  );
}

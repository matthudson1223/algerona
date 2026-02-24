"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useFeedStore } from "@/store/feed";
import { useAlgorithmStore } from "@/store/algorithm";
import { VideoPlayer } from "@/components/feed/VideoPlayer";
import { FeedbackButtons } from "@/components/feed/FeedbackButtons";
import { VideoInfo } from "@/components/feed/VideoInfo";
import { WhyShownModal } from "@/components/feed/WhyShownModal";
import type { ScoredVideo } from "@/types";

export default function FeedPage() {
  const { videos, currentIndex, isLoading, fetchFeed, fetchMore, setCurrentIndex, recordWatch, recordFeedback } =
    useFeedStore();
  const { activeProfile, fetchProfiles } = useAlgorithmStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [whyVideo, setWhyVideo] = useState<ScoredVideo | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (activeProfile) {
      fetchFeed(activeProfile.id);
    }
  }, [activeProfile, fetchFeed]);

  // Fetch more when nearing end
  useEffect(() => {
    if (currentIndex >= videos.length - 5) {
      fetchMore(activeProfile?.id);
    }
  }, [currentIndex, videos.length, activeProfile, fetchMore]);

  // Intersection observer for scroll snapping
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll(".feed-item");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute("data-index") ?? "0");
            setCurrentIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [videos, setCurrentIndex]);

  const handleWatched = useCallback(
    (video: ScoredVideo, duration: number, skipped: boolean) => {
      recordWatch(video, duration, skipped);
    },
    [recordWatch]
  );

  const handleFeedback = useCallback(
    (video: ScoredVideo, action: string) => {
      recordFeedback(video, action);
    },
    [recordFeedback]
  );

  if (isLoading && videos.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Building your feed...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && videos.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black p-8 text-center">
        <div>
          <p className="text-white font-semibold mb-2">No videos found</p>
          <p className="text-zinc-400 text-sm">Try adjusting your algorithm settings to broaden your feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="feed-container">
      {videos.map((video, idx) => (
        <div key={video.id} className="feed-item relative" data-index={idx}>
          <VideoPlayer
            video={video}
            isActive={idx === currentIndex}
            onWatched={(d, s) => handleWatched(video, d, s)}
          />
          <VideoInfo video={video} />

          {/* Right-side action buttons */}
          <div className="absolute right-0 bottom-16 z-10">
            <FeedbackButtons
              video={video}
              onFeedback={(action) => handleFeedback(video, action)}
              onWhyShown={() => setWhyVideo(video)}
            />
          </div>
        </div>
      ))}

      {whyVideo && (
        <WhyShownModal video={whyVideo} onClose={() => setWhyVideo(null)} />
      )}
    </div>
  );
}

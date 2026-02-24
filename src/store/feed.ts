import { create } from "zustand";
import type { ScoredVideo } from "@/types";

interface FeedStore {
  videos: ScoredVideo[];
  currentIndex: number;
  isLoading: boolean;
  nextPageToken: string | null;
  error: string | null;

  fetchFeed: (profileId?: string) => Promise<void>;
  fetchMore: (profileId?: string) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  recordWatch: (video: ScoredVideo, watchedDuration: number, skipped: boolean) => Promise<void>;
  recordFeedback: (video: ScoredVideo, action: string) => Promise<void>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  videos: [],
  currentIndex: 0,
  isLoading: false,
  nextPageToken: null,
  error: null,

  fetchFeed: async (profileId) => {
    set({ isLoading: true, error: null, videos: [], currentIndex: 0 });
    try {
      const url = `/api/feed${profileId ? `?profileId=${profileId}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      set({
        videos: data.videos ?? [],
        nextPageToken: data.nextPageToken ?? null,
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  fetchMore: async (profileId) => {
    const { nextPageToken, isLoading } = get();
    if (isLoading || !nextPageToken) return;

    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ pageToken: nextPageToken });
      if (profileId) params.set("profileId", profileId);
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      set((state) => ({
        videos: [...state.videos, ...(data.videos ?? [])],
        nextPageToken: data.nextPageToken ?? null,
        isLoading: false,
      }));
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  recordWatch: async (video, watchedDuration, skipped) => {
    await fetch("/api/videos/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: video.id,
        platform: video.platform,
        watchedDuration,
        totalDuration: video.duration,
        skipped,
      }),
    });
  },

  recordFeedback: async (video, action) => {
    await fetch("/api/videos/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: video.id,
        platform: video.platform,
        action,
      }),
    });
  },
}));

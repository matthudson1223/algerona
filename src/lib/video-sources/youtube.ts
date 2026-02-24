import type { VideoMetadata } from "@/types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { high: { url: string } };
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    tags?: string[];
    categoryId?: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: { duration: string };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
  snippet: {
    tags?: string[];
    categoryId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
    channelId: string;
    channelTitle: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: { high: { url: string } };
  };
}

// ISO 8601 duration to seconds
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0");
  const minutes = parseInt(match[2] ?? "0");
  const seconds = parseInt(match[3] ?? "0");
  return hours * 3600 + minutes * 60 + seconds;
}

const YOUTUBE_CATEGORY_NAMES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
};

export async function fetchYouTubeShorts(options: {
  query?: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<{ videos: VideoMetadata[]; nextPageToken?: string }> {
  const { query = "", maxResults = 20, pageToken } = options;

  // Search for YouTube Shorts (#shorts or videoDuration=short)
  const searchParams = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoDuration: "short", // YouTube's "short" = under 4 minutes
    maxResults: String(maxResults),
    key: API_KEY,
    ...(query && { q: `${query} #shorts` }),
    ...(pageToken && { pageToken }),
    order: "relevance",
    safeSearch: "moderate",
  });

  const searchRes = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed: ${searchRes.statusText}`);
  }
  const searchData = await searchRes.json();
  const items: YouTubeSearchItem[] = searchData.items ?? [];
  const nextPageToken: string | undefined = searchData.nextPageToken;

  if (items.length === 0) return { videos: [], nextPageToken };

  // Fetch video details (duration, stats)
  const videoIds = items.map((i) => i.id.videoId).join(",");
  const detailsParams = new URLSearchParams({
    part: "contentDetails,statistics,snippet",
    id: videoIds,
    key: API_KEY,
  });

  const detailsRes = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
  if (!detailsRes.ok) {
    throw new Error(`YouTube video details failed: ${detailsRes.statusText}`);
  }
  const detailsData = await detailsRes.json();
  const details: YouTubeVideoDetails[] = detailsData.items ?? [];

  const detailsMap = new Map(details.map((d) => [d.id, d]));

  const videos: VideoMetadata[] = items
    .map((item) => {
      const detail = detailsMap.get(item.id.videoId);
      if (!detail) return null;

      const duration = parseDuration(detail.contentDetails.duration);
      // Filter to true Shorts: 60 seconds or less
      if (duration > 60 || duration === 0) return null;

      const categoryName = YOUTUBE_CATEGORY_NAMES[detail.snippet.categoryId] ?? "General";
      const language =
        detail.snippet.defaultAudioLanguage ??
        detail.snippet.defaultLanguage ??
        "en";

      return {
        id: item.id.videoId,
        platform: "youtube" as const,
        title: detail.snippet.title,
        description: detail.snippet.description,
        thumbnailUrl: detail.snippet.thumbnails.high?.url ?? "",
        duration,
        viewCount: parseInt(detail.statistics.viewCount ?? "0"),
        likeCount: parseInt(detail.statistics.likeCount ?? "0"),
        publishedAt: new Date(detail.snippet.publishedAt),
        channelId: detail.snippet.channelId,
        channelName: detail.snippet.channelTitle,
        tags: detail.snippet.tags ?? [],
        categories: [categoryName],
        language: language.split("-")[0], // "en-US" -> "en"
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1&controls=0&loop=1&playlist=${item.id.videoId}&modestbranding=1&rel=0`,
      } satisfies VideoMetadata;
    })
    .filter((v): v is VideoMetadata => v !== null);

  return { videos, nextPageToken };
}

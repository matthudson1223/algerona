export interface AlgorithmProfile {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Category weights (0-100)
  categories: {
    cooking: number;
    technology: number;
    comedy: number;
    fitness: number;
    music: number;
    education: number;
    gaming: number;
    news: number;
    travel: number;
    art: number;
    sports: number;
    science: number;
  };

  controls: {
    maxDuration: number;
    minDuration: number;
    languages: string[];
    excludeKeywords: string[];
    includeKeywords: string[];
    freshness: "day" | "week" | "month" | "any";
    popularityBias: number;
    diversityFactor: number;
    repeatTolerance: number;
  };

  sources: {
    youtube: { enabled: boolean; weight: number };
    tiktok: { enabled: boolean; weight: number };
  };

  nlRules: string[];
}

export interface VideoMetadata {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // seconds
  viewCount: number;
  likeCount: number;
  publishedAt: Date;
  channelId: string;
  channelName: string;
  channelFollowerCount?: number;
  tags: string[];
  categories: string[];
  language: string;
  embedUrl: string;
}

export interface ScoredVideo extends VideoMetadata {
  score: number;
  scoreBreakdown: {
    categoryScore: number;
    keywordBonus: number;
    keywordPenalty: number;
    freshnessScore: number;
    popularityScore: number;
    diversityBonus: number;
    repeatPenalty: number;
    sourceScore: number;
    nlRuleScore: number;
  };
  matchedCategories: string[];
  matchedKeywords: string[];
}

export interface WatchEvent {
  id: string;
  userId: string;
  videoId: string;
  platform: "youtube" | "tiktok";
  watchedDuration: number;
  totalDuration: number;
  skipped: boolean;
  timestamp: Date;
}

export interface FeedbackEvent {
  id: string;
  userId: string;
  videoId: string;
  platform: "youtube" | "tiktok";
  action: "like" | "dislike" | "block_creator" | "more_like_this" | "less_like_this";
  timestamp: Date;
}

export interface AlgorithmSuggestion {
  type: "category_weight" | "keyword" | "freshness" | "popularity" | "nl_rule";
  description: string;
  currentValue: unknown;
  suggestedValue: unknown;
  field: string;
  reason: string;
}

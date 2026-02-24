import type { VideoMetadata, ScoredVideo, AlgorithmProfile } from "@/types";

// Map video categories/tags to our internal category keys
const CATEGORY_KEYWORDS: Record<keyof AlgorithmProfile["categories"], string[]> = {
  cooking: ["cooking", "recipe", "food", "baking", "chef", "meal", "cuisine", "kitchen"],
  technology: ["tech", "technology", "programming", "coding", "software", "hardware", "ai", "gadget"],
  comedy: ["comedy", "funny", "humor", "laugh", "meme", "joke", "skit"],
  fitness: ["fitness", "workout", "exercise", "gym", "health", "yoga", "running", "training"],
  music: ["music", "song", "singing", "musician", "band", "concert", "piano", "guitar"],
  education: ["education", "learn", "tutorial", "howto", "explained", "science", "history", "math"],
  gaming: ["gaming", "game", "gamer", "gameplay", "esports", "minecraft", "playstation", "xbox"],
  news: ["news", "politics", "current events", "breaking", "world", "government"],
  travel: ["travel", "vacation", "trip", "explore", "adventure", "destination", "tourism"],
  art: ["art", "drawing", "painting", "illustration", "design", "creative", "craft", "diy"],
  sports: ["sports", "football", "basketball", "soccer", "baseball", "tennis", "nfl", "nba"],
  science: ["science", "physics", "chemistry", "biology", "astronomy", "space", "nature"],
};

function categoryMatchScore(
  video: VideoMetadata,
  categories: AlgorithmProfile["categories"]
): { score: number; matched: string[] } {
  const videoText = [video.title, video.description, ...video.tags, ...video.categories]
    .join(" ")
    .toLowerCase();

  let totalWeight = 0;
  let totalMaxWeight = 0;
  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const weight = categories[category as keyof AlgorithmProfile["categories"]];
    const hasMatch = keywords.some((kw) => videoText.includes(kw));

    if (hasMatch) {
      totalWeight += weight;
      matched.push(category);
    }
    totalMaxWeight += 100; // max possible weight per category
  }

  // Normalize to 0-100
  const score = matched.length > 0 ? (totalWeight / (matched.length * 100)) * 100 : 0;
  return { score, matched };
}

function keywordScore(
  video: VideoMetadata,
  includeKeywords: string[],
  excludeKeywords: string[]
): { bonus: number; penalty: number; matchedKeywords: string[] } {
  const videoText = [video.title, video.description, ...video.tags]
    .join(" ")
    .toLowerCase();

  const matchedKeywords: string[] = [];
  let bonus = 0;
  let penalty = 0;

  for (const kw of includeKeywords) {
    if (videoText.includes(kw.toLowerCase())) {
      bonus += 20;
      matchedKeywords.push(kw);
    }
  }

  for (const kw of excludeKeywords) {
    if (videoText.includes(kw.toLowerCase())) {
      penalty += 50;
    }
  }

  return { bonus: Math.min(bonus, 40), penalty, matchedKeywords };
}

function freshnessScore(publishedAt: Date, freshness: AlgorithmProfile["controls"]["freshness"]): number {
  const ageMs = Date.now() - publishedAt.getTime();
  const agedays = ageMs / (1000 * 60 * 60 * 24);

  if (freshness === "any") return 50;

  const maxAge = { day: 1, week: 7, month: 30 }[freshness];
  if (agedays > maxAge * 2) return 0;
  if (agedays <= maxAge) return 100;
  // Linear decay from maxAge to maxAge*2
  return Math.max(0, 100 - ((agedays - maxAge) / maxAge) * 100);
}

function popularityScore(video: VideoMetadata, popularityBias: number): number {
  // Score based on view count relative to a 10M view "viral" threshold
  const viralThreshold = 10_000_000;
  const rawScore = Math.min(video.viewCount / viralThreshold, 1) * 100;

  // Blend: popularityBias=100 => pure rawScore, popularityBias=0 => inverted (prefer niche)
  return (popularityBias / 100) * rawScore + ((100 - popularityBias) / 100) * (100 - rawScore);
}

function durationFilter(
  video: VideoMetadata,
  minDuration: number,
  maxDuration: number
): boolean {
  return video.duration >= minDuration && video.duration <= maxDuration;
}

function languageFilter(video: VideoMetadata, languages: string[]): boolean {
  if (languages.length === 0) return true;
  return languages.includes(video.language);
}

export function scoreVideo(
  video: VideoMetadata,
  profile: AlgorithmProfile,
  watchedVideoIds: Set<string>
): ScoredVideo | null {
  const { controls, categories, sources } = profile;

  // Hard filters — return null to exclude entirely
  if (!durationFilter(video, controls.minDuration, controls.maxDuration)) return null;
  if (!languageFilter(video, controls.languages)) return null;

  // Source weight
  const sourceWeight =
    video.platform === "youtube"
      ? sources.youtube.enabled
        ? sources.youtube.weight
        : 0
      : sources.tiktok.enabled
      ? sources.tiktok.weight
      : 0;

  if (sourceWeight === 0) return null;

  const catResult = categoryMatchScore(video, categories);
  const kwResult = keywordScore(video, controls.includeKeywords, controls.excludeKeywords);
  const freshness = freshnessScore(video.publishedAt, controls.freshness);
  const popularity = popularityScore(video, controls.popularityBias);
  const repeatPenalty = watchedVideoIds.has(video.id) ? (100 - controls.repeatTolerance) : 0;

  const sourceScore = (sourceWeight / 100) * 100;

  const breakdown = {
    categoryScore: catResult.score,
    keywordBonus: kwResult.bonus,
    keywordPenalty: kwResult.penalty,
    freshnessScore: freshness,
    popularityScore: popularity,
    diversityBonus: 0, // handled at feed level
    repeatPenalty,
    sourceScore,
    nlRuleScore: 0, // populated separately by NL engine
  };

  const finalScore =
    catResult.score * 0.35 +
    kwResult.bonus * 0.10 -
    kwResult.penalty * 0.20 +
    freshness * 0.15 +
    popularity * 0.15 +
    sourceScore * 0.05 -
    repeatPenalty * 0.10;

  if (finalScore <= 0) return null;

  return {
    ...video,
    score: finalScore,
    scoreBreakdown: breakdown,
    matchedCategories: catResult.matched,
    matchedKeywords: kwResult.matchedKeywords,
  };
}

export function rankVideos(
  videos: VideoMetadata[],
  profile: AlgorithmProfile,
  watchedVideoIds: Set<string>,
  diversityFactor: number = 50
): ScoredVideo[] {
  const scored = videos
    .map((v) => scoreVideo(v, profile, watchedVideoIds))
    .filter((v): v is ScoredVideo => v !== null);

  // Apply diversity: inject some random shuffling proportional to diversityFactor
  if (diversityFactor > 0) {
    const shuffleStrength = diversityFactor / 100;
    scored.forEach((v) => {
      v.score += (Math.random() - 0.5) * shuffleStrength * 20;
      v.scoreBreakdown.diversityBonus = shuffleStrength * 10;
    });
  }

  return scored.sort((a, b) => b.score - a.score);
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { fetchYouTubeShorts } from "@/lib/video-sources/youtube";
import { rankVideos } from "@/lib/algorithm/scorer";
import type { AlgorithmProfile } from "@/types";

function dbProfileToAlgorithmProfile(p: Awaited<ReturnType<typeof db.algorithmProfile.findFirst>>): AlgorithmProfile | null {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    categories: {
      cooking: p.catCooking,
      technology: p.catTechnology,
      comedy: p.catComedy,
      fitness: p.catFitness,
      music: p.catMusic,
      education: p.catEducation,
      gaming: p.catGaming,
      news: p.catNews,
      travel: p.catTravel,
      art: p.catArt,
      sports: p.catSports,
      science: p.catScience,
    },
    controls: {
      maxDuration: p.maxDuration,
      minDuration: p.minDuration,
      languages: p.languages,
      excludeKeywords: p.excludeKeywords,
      includeKeywords: p.includeKeywords,
      freshness: p.freshness as AlgorithmProfile["controls"]["freshness"],
      popularityBias: p.popularityBias,
      diversityFactor: p.diversityFactor,
      repeatTolerance: p.repeatTolerance,
    },
    sources: {
      youtube: { enabled: p.youtubeEnabled, weight: p.youtubeWeight },
      tiktok: { enabled: p.tiktokEnabled, weight: p.tiktokWeight },
    },
    nlRules: p.nlRules,
  };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const pageToken = searchParams.get("pageToken") ?? undefined;

  // Get active profile
  const dbProfile = profileId
    ? await db.algorithmProfile.findFirst({
        where: { id: profileId, userId: session.user.id },
      })
    : await db.algorithmProfile.findFirst({
        where: { userId: session.user.id, isActive: true },
      });

  if (!dbProfile) {
    return NextResponse.json({ error: "No algorithm profile found" }, { status: 404 });
  }

  const profile = dbProfileToAlgorithmProfile(dbProfile);
  if (!profile) return NextResponse.json({ error: "Profile error" }, { status: 500 });

  // Get recently watched video IDs to penalize repeats
  const recentWatch = await db.watchEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { timestamp: "desc" },
    take: 100,
    select: { videoId: true },
  });
  const watchedIds = new Set(recentWatch.map((w) => w.videoId));

  // Build search query from top categories + include keywords
  const topCategories = Object.entries(profile.categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k)
    .join(" ");

  const query = [topCategories, ...profile.controls.includeKeywords].join(" ").trim();

  const { videos, nextPageToken } = await fetchYouTubeShorts({
    query,
    maxResults: 50,
    pageToken,
  });

  const ranked = rankVideos(videos, profile, watchedIds, profile.controls.diversityFactor);

  return NextResponse.json({
    videos: ranked.slice(0, 20),
    nextPageToken,
  });
}

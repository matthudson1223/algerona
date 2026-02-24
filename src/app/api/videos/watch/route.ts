import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId, platform, watchedDuration, totalDuration, skipped } = await req.json();

  const event = await db.watchEvent.create({
    data: {
      userId: session.user.id,
      videoId,
      platform,
      watchedDuration: Math.round(watchedDuration),
      totalDuration: Math.round(totalDuration),
      skipped: Boolean(skipped),
    },
  });

  return NextResponse.json(event, { status: 201 });
}

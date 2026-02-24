import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId, platform, action } = await req.json();

  const valid = ["like", "dislike", "block_creator", "more_like_this", "less_like_this"];
  if (!valid.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const event = await db.feedbackEvent.create({
    data: {
      userId: session.user.id,
      videoId,
      platform,
      action,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

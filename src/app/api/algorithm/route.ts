import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";

// GET /api/algorithm — list user's algorithm profiles
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await db.algorithmProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(profiles);
}

// POST /api/algorithm — create a new profile
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name = "My Feed", ...rest } = body;

  const profile = await db.algorithmProfile.create({
    data: {
      userId: session.user.id,
      name,
      ...rest,
    },
  });

  return NextResponse.json(profile, { status: 201 });
}

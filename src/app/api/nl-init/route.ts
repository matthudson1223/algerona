import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInitialProfile } from "@/lib/algorithm/nl-translator";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description } = await req.json();
  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const profile = await generateInitialProfile(description);
  return NextResponse.json(profile);
}

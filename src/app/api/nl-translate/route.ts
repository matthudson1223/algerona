import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { translateNLToParams } from "@/lib/algorithm/nl-translator";
import type { AlgorithmProfile } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instruction, currentProfile } = await req.json();

  if (!instruction || typeof instruction !== "string") {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  const result = await translateNLToParams(
    instruction,
    currentProfile as Pick<AlgorithmProfile, "categories" | "controls" | "nlRules">
  );

  return NextResponse.json(result);
}

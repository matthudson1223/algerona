import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  // (has at least one algorithm profile)
  // TODO: check db for profile — for now redirect to onboarding
  redirect("/onboarding");
}

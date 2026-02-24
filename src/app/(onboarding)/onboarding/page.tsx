"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_OPTIONS = [
  { key: "cooking", label: "Cooking & Food", emoji: "🍳" },
  { key: "technology", label: "Tech & Dev", emoji: "💻" },
  { key: "comedy", label: "Comedy", emoji: "😂" },
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "education", label: "Learning", emoji: "📚" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "news", label: "News", emoji: "📰" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "art", label: "Art & DIY", emoji: "🎨" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "science", label: "Science", emoji: "🔬" },
];

type Step = "welcome" | "nl" | "categories" | "creating";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [nlDescription, setNlDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreate = async () => {
    setStep("creating");
    setError(null);

    try {
      // Build a description combining NL input + selected categories
      const catDesc = selectedCategories.size > 0
        ? `I enjoy: ${Array.from(selectedCategories).join(", ")}.`
        : "";
      const fullDescription = [nlDescription.trim(), catDesc].filter(Boolean).join(" ") ||
        "Show me a variety of entertaining short videos.";

      // Generate profile with Claude via API
      const initRes = await fetch("/api/nl-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: fullDescription }),
      });
      if (!initRes.ok) throw new Error("Failed to generate profile");
      const profileData = await initRes.json();

      // Create via API
      const res = await fetch("/api/algorithm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Feed",
          isActive: true,
          // Map categories to db fields
          catCooking: profileData.categories.cooking,
          catTechnology: profileData.categories.technology,
          catComedy: profileData.categories.comedy,
          catFitness: profileData.categories.fitness,
          catMusic: profileData.categories.music,
          catEducation: profileData.categories.education,
          catGaming: profileData.categories.gaming,
          catNews: profileData.categories.news,
          catTravel: profileData.categories.travel,
          catArt: profileData.categories.art,
          catSports: profileData.categories.sports,
          catScience: profileData.categories.science,
          ...profileData.controls,
          nlRules: profileData.nlRules,
        }),
      });

      if (!res.ok) throw new Error("Failed to create profile");

      router.push("/feed");
    } catch (e) {
      setError(String(e));
      setStep("categories");
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-6">
          <div className="text-5xl">🎛️</div>
          <h1 className="text-3xl font-bold text-white">Your feed,<br />your rules.</h1>
          <p className="text-zinc-400 leading-relaxed">
            Algerona gives you full control over what you watch.
            Define your algorithm — no black boxes, no manipulation.
          </p>
          <button
            onClick={() => setStep("nl")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl text-lg transition-colors"
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  if (step === "nl") {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col px-6 pt-16 pb-8">
        <div className="flex-1 max-w-sm mx-auto w-full space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">What do you want to watch?</h2>
            <p className="text-zinc-400 text-sm">Describe your ideal feed in plain language. You can always change this later.</p>
          </div>

          <textarea
            value={nlDescription}
            onChange={(e) => setNlDescription(e.target.value)}
            placeholder="e.g. I love cooking tutorials and tech news, but I want to avoid anything political or violent. Keep videos short and snappy."
            className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-2xl p-4 text-sm min-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />

          <p className="text-zinc-600 text-xs text-center">or skip to pick categories</p>
        </div>

        <div className="max-w-sm mx-auto w-full flex gap-3 mt-6">
          <button
            onClick={() => setStep("categories")}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-medium transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => setStep("categories")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-semibold transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === "categories") {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col px-6 pt-16 pb-8">
        <div className="flex-1 max-w-sm mx-auto w-full space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Pick your interests</h2>
            <p className="text-zinc-400 text-sm">Select topics you enjoy. You can fine-tune later.</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {CATEGORY_OPTIONS.map(({ key, label, emoji }) => {
              const selected = selectedCategories.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    selected
                      ? "border-indigo-500 bg-indigo-900/30"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className={`text-xs font-medium ${selected ? "text-indigo-300" : "text-zinc-400"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-sm mx-auto w-full mt-6">
          <button
            onClick={handleCreate}
            disabled={selectedCategories.size === 0 && !nlDescription.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
          >
            Build my feed
          </button>
          {selectedCategories.size === 0 && !nlDescription.trim() && (
            <p className="text-zinc-600 text-xs text-center mt-2">Select at least one category or describe your preferences above</p>
          )}
        </div>
      </div>
    );
  }

  // Creating step
  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-5">
        <div className="w-12 h-12 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-white text-xl font-semibold">Building your algorithm...</h2>
        <p className="text-zinc-400 text-sm">Translating your preferences into parameters</p>
      </div>
    </div>
  );
}

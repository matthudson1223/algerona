"use client";

import { useEffect, useState } from "react";
import { useAlgorithmStore } from "@/store/algorithm";
import { CategorySlider } from "@/components/algorithm/CategorySlider";
import { NLInput } from "@/components/algorithm/NLInput";
import type { AlgorithmProfile } from "@/types";

const CATEGORY_KEYS = [
  "cooking", "technology", "comedy", "fitness", "music",
  "education", "gaming", "news", "travel", "art", "sports", "science",
] as const;

export default function AlgorithmPage() {
  const { activeProfile, fetchProfiles, updateProfile, applyNLInstruction, isLoading } =
    useAlgorithmStore();
  const [localProfile, setLocalProfile] = useState<AlgorithmProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (activeProfile) setLocalProfile(activeProfile);
  }, [activeProfile]);

  if (isLoading || !localProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const handleCategoryChange = (key: keyof AlgorithmProfile["categories"], value: number) => {
    setLocalProfile((prev) => prev ? {
      ...prev,
      categories: { ...prev.categories, [key]: value },
    } : prev);
  };

  const handleControlChange = (
    key: keyof AlgorithmProfile["controls"],
    value: AlgorithmProfile["controls"][typeof key]
  ) => {
    setLocalProfile((prev) => prev ? {
      ...prev,
      controls: { ...prev.controls, [key]: value },
    } : prev);
  };

  const handleSave = async () => {
    if (!localProfile) return;
    // Flatten categories back to db field names
    const catChanges = Object.fromEntries(
      CATEGORY_KEYS.map((k) => [
        `cat${k.charAt(0).toUpperCase()}${k.slice(1)}`,
        localProfile.categories[k],
      ])
    );
    await updateProfile(localProfile.id, {
      ...catChanges,
      maxDuration: localProfile.controls.maxDuration,
      minDuration: localProfile.controls.minDuration,
      freshness: localProfile.controls.freshness,
      popularityBias: localProfile.controls.popularityBias,
      diversityFactor: localProfile.controls.diversityFactor,
      repeatTolerance: localProfile.controls.repeatTolerance,
      excludeKeywords: localProfile.controls.excludeKeywords,
      includeKeywords: localProfile.controls.includeKeywords,
    } as Partial<AlgorithmProfile>);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Algorithm Editor</h1>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm">{localProfile.name}</span>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto">
        {/* Natural language input */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Natural Language
          </h2>
          <NLInput onSubmit={applyNLInstruction} />
        </section>

        {/* Category weights */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Content Categories
          </h2>
          <div className="space-y-1">
            {CATEGORY_KEYS.map((key) => (
              <CategorySlider
                key={key}
                label={key}
                value={localProfile.categories[key]}
                onChange={(v) => handleCategoryChange(key, v)}
              />
            ))}
          </div>
        </section>

        {/* Content controls */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Controls
          </h2>
          <div className="space-y-5">
            {/* Freshness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">Freshness</span>
                <span className="text-indigo-300 text-xs capitalize">{localProfile.controls.freshness}</span>
              </div>
              <div className="flex gap-2">
                {(["day", "week", "month", "any"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleControlChange("freshness", f)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      localProfile.controls.freshness === f
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Popularity bias */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">Popularity</span>
                <span className="text-zinc-400 text-xs">
                  {localProfile.controls.popularityBias <= 20 ? "Niche" :
                   localProfile.controls.popularityBias <= 40 ? "Indie" :
                   localProfile.controls.popularityBias <= 60 ? "Mixed" :
                   localProfile.controls.popularityBias <= 80 ? "Popular" : "Viral only"}
                </span>
              </div>
              <input
                type="range" min={0} max={100} step={10}
                value={localProfile.controls.popularityBias}
                onChange={(e) => handleControlChange("popularityBias", Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-zinc-600 text-xs mt-1">
                <span>Niche</span>
                <span>Viral</span>
              </div>
            </div>

            {/* Diversity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">Variety</span>
                <span className="text-zinc-400 text-xs">
                  {localProfile.controls.diversityFactor <= 30 ? "Focused" :
                   localProfile.controls.diversityFactor <= 60 ? "Balanced" : "Exploratory"}
                </span>
              </div>
              <input
                type="range" min={0} max={100} step={10}
                value={localProfile.controls.diversityFactor}
                onChange={(e) => handleControlChange("diversityFactor", Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-zinc-600 text-xs mt-1">
                <span>Narrow</span>
                <span>Wide</span>
              </div>
            </div>

            {/* Max duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">Max Duration</span>
                <span className="text-indigo-300 text-xs">{localProfile.controls.maxDuration}s</span>
              </div>
              <input
                type="range" min={5} max={60} step={5}
                value={localProfile.controls.maxDuration}
                onChange={(e) => handleControlChange("maxDuration", Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-zinc-600 text-xs mt-1">
                <span>5s</span>
                <span>60s</span>
              </div>
            </div>
          </div>
        </section>

        {/* NL Rules */}
        {localProfile.nlRules.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Active Rules
            </h2>
            <div className="space-y-2">
              {localProfile.nlRules.map((rule, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-zinc-200 text-sm">{rule}</span>
                  <button
                    onClick={() => {
                      const newRules = localProfile.nlRules.filter((_, ri) => ri !== i);
                      setLocalProfile((prev) => prev ? {
                        ...prev,
                        nlRules: newRules,
                      } : prev);
                    }}
                    className="text-zinc-500 hover:text-red-400 ml-3 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

"use client";

import type { ScoredVideo } from "@/types";

interface WhyShownModalProps {
  video: ScoredVideo;
  onClose: () => void;
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-400 text-xs w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-zinc-800 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white text-xs w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

export function WhyShownModal({ video, onClose }: WhyShownModalProps) {
  const b = video.scoreBreakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-t-2xl p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-base">Why was this shown?</h2>
          <button onClick={onClose} className="text-zinc-400 text-xl leading-none">&times;</button>
        </div>

        <p className="text-zinc-300 text-sm mb-1 font-medium truncate">{video.title}</p>
        <p className="text-zinc-500 text-xs mb-5">{video.channelName}</p>

        <div className="space-y-3 mb-5">
          <ScoreBar label="Category match" value={b.categoryScore} />
          <ScoreBar label="Keyword bonus" value={b.keywordBonus} max={40} />
          <ScoreBar label="Freshness" value={b.freshnessScore} />
          <ScoreBar label="Popularity" value={b.popularityScore} />
          <ScoreBar label="Source pref." value={b.sourceScore} />
          {b.repeatPenalty > 0 && (
            <ScoreBar label="Repeat penalty" value={-b.repeatPenalty} max={100} />
          )}
        </div>

        {video.matchedCategories.length > 0 && (
          <div className="mb-3">
            <p className="text-zinc-400 text-xs mb-2">Matched categories</p>
            <div className="flex flex-wrap gap-2">
              {video.matchedCategories.map((c) => (
                <span key={c} className="bg-indigo-900/60 text-indigo-300 text-xs px-2 py-1 rounded-full capitalize">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <span className="text-zinc-400 text-sm">Total score</span>
          <span className="text-white font-bold text-lg">{video.score.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

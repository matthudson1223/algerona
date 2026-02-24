"use client";

import { useState } from "react";

interface NLInputProps {
  onSubmit: (instruction: string) => Promise<string>;
}

const SUGGESTIONS = [
  "More cooking, less news",
  "Only short videos under 30 seconds",
  "Prefer small creators with under 100k followers",
  "More chill and relaxing content",
  "I want to learn something every time I scroll",
];

export function NLInput({ onSubmit }: NLInputProps) {
  const [value, setValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (instruction: string) => {
    if (!instruction.trim() || isProcessing) return;
    setIsProcessing(true);
    setLastResult(null);
    setError(null);

    try {
      const explanation = await onSubmit(instruction);
      setLastResult(explanation);
      setValue("");
    } catch {
      setError("Failed to process instruction. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(value)}
          placeholder='e.g. "more cooking, no politics"'
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isProcessing}
        />
        <button
          onClick={() => handleSubmit(value)}
          disabled={!value.trim() || isProcessing}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors"
        >
          {isProcessing ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {lastResult && (
        <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl px-4 py-3">
          <p className="text-indigo-300 text-sm">{lastResult}</p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm px-1">{error}</p>
      )}

      {/* Quick suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSubmit(s)}
            disabled={isProcessing}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

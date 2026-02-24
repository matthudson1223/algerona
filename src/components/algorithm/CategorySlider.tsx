"use client";

interface CategorySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  emoji?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  cooking: "🍳",
  technology: "💻",
  comedy: "😂",
  fitness: "💪",
  music: "🎵",
  education: "📚",
  gaming: "🎮",
  news: "📰",
  travel: "✈️",
  art: "🎨",
  sports: "⚽",
  science: "🔬",
};

function getTrackColor(value: number): string {
  if (value === 0) return "bg-zinc-700";
  if (value <= 30) return "bg-blue-900";
  if (value <= 60) return "bg-indigo-700";
  if (value <= 80) return "bg-indigo-500";
  return "bg-indigo-400";
}

function getLabel(value: number): string {
  if (value === 0) return "Blocked";
  if (value <= 20) return "Rare";
  if (value <= 40) return "Low";
  if (value <= 60) return "Medium";
  if (value <= 80) return "High";
  return "Max";
}

export function CategorySlider({ label, value, onChange, emoji }: CategorySliderProps) {
  const displayEmoji = emoji ?? CATEGORY_EMOJIS[label.toLowerCase()] ?? "📌";

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xl w-7 text-center select-none">{displayEmoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-sm capitalize">{label}</span>
          <span className={`text-xs font-medium ${value === 0 ? "text-red-400" : "text-indigo-300"}`}>
            {getLabel(value)}
          </span>
        </div>
        <div className="relative h-2">
          <div className="absolute inset-0 bg-zinc-800 rounded-full" />
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all ${getTrackColor(value)}`}
            style={{ width: `${value}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            aria-label={`${label} weight`}
          />
        </div>
      </div>
    </div>
  );
}

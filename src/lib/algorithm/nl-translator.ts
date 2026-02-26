import type { AlgorithmProfile } from "@/types";

interface NLTranslationResult {
  changes: Partial<{
    categories: Partial<AlgorithmProfile["categories"]>;
    controls: Partial<AlgorithmProfile["controls"]>;
    nlRules: string[];
  }>;
  explanation: string;
}

const SYSTEM_PROMPT = `You are the algorithm engine for Algerona, a video feed app that lets users control their feed with natural language.

The user has an algorithm profile with the following structure:
- categories: object with keys [cooking, technology, comedy, fitness, music, education, gaming, news, travel, art, sports, science], each with a weight 0-100 (0=block, 100=maximize)
- controls:
  - maxDuration: max video length in seconds (default 60)
  - minDuration: min video length in seconds (default 5)
  - languages: array of language codes (e.g. ["en"])
  - excludeKeywords: array of words to avoid
  - includeKeywords: array of words to prefer
  - freshness: "day" | "week" | "month" | "any"
  - popularityBias: 0-100 (0=niche content, 100=viral/popular)
  - diversityFactor: 0-100 (0=narrow focus, 100=wide variety)
  - repeatTolerance: 0-100 (how often to show similar content)
- nlRules: array of natural language rules

Given a user's natural language instruction, return a JSON object with:
- changes: which parameters to update (only include changed fields)
- explanation: a brief human-readable explanation of what changed

Be conservative — only change what was clearly requested. If a request is ambiguous, make a reasonable interpretation.`;

export async function translateNLToParams(
  instruction: string,
  currentProfile: Pick<AlgorithmProfile, "categories" | "controls" | "nlRules">
): Promise<NLTranslationResult> {
  const response = await fetch("https://openrouter.io/api/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://algerona.app",
      "X-Title": "Algerona",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Current profile:
${JSON.stringify(currentProfile, null, 2)}

User instruction: "${instruction}"

Respond with ONLY valid JSON matching this schema:
{
  "changes": {
    "categories": { /* only changed categories */ },
    "controls": { /* only changed controls */ },
    "nlRules": [ /* full updated array if adding rules */ ]
  },
  "explanation": "Brief explanation of what changed"
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const content = data.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from OpenRouter");
  }

  // Strip markdown code fences if present
  const jsonText = content.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  return JSON.parse(jsonText) as NLTranslationResult;
}

export async function generateInitialProfile(
  description: string
): Promise<Pick<AlgorithmProfile, "categories" | "controls" | "nlRules">> {
  const response = await fetch("https://openrouter.io/api/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://algerona.app",
      "X-Title": "Algerona",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4-6",
      max_tokens: 1024,
      system: `You are setting up a video feed algorithm profile for a new user based on their preferences.

Return ONLY valid JSON with this exact structure — no markdown, no explanation outside the JSON:
{
  "categories": {
    "cooking": 0-100,
    "technology": 0-100,
    "comedy": 0-100,
    "fitness": 0-100,
    "music": 0-100,
    "education": 0-100,
    "gaming": 0-100,
    "news": 0-100,
    "travel": 0-100,
    "art": 0-100,
    "sports": 0-100,
    "science": 0-100
  },
  "controls": {
    "maxDuration": 60,
    "minDuration": 5,
    "languages": ["en"],
    "excludeKeywords": [],
    "includeKeywords": [],
    "freshness": "week",
    "popularityBias": 30,
    "diversityFactor": 50,
    "repeatTolerance": 20
  },
  "nlRules": []
}

Set category weights based on what the user says they want to watch. Use 0 for things they want to avoid, 75-100 for strong interests, 40-60 for mild interest, 0-20 for low interest.`,
      messages: [
        {
          role: "user",
          content: `User description: "${description}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const content = data.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from OpenRouter");

  const jsonText = content.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(jsonText);
}

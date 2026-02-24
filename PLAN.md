# Algerona - Customizable Short-Form Video Feed Algorithm

## Vision
A mobile-first web application that puts users in full control of their short-form vertical video feed. Instead of opaque, engagement-maximizing algorithms, users explicitly define *what* they want to watch through natural language and tunable parameters. The algorithm serves the user — not the other way around.

---

## Core Concepts

### User-Defined Algorithm
Each user owns an "algorithm profile" — a set of rules, weights, and preferences that determine what videos surface in their feed. This profile is:
- **Transparent**: every parameter is visible and explained
- **Editable**: users can adjust any weight, toggle any category, or rewrite rules
- **Describable**: users can type natural language like "more cooking, less drama, no politics" and the system translates that into parameter changes
- **Promptable**: the system periodically asks "You've been watching a lot of X — want more of it?" and the user decides

### Video Sources
Aggregate short-form vertical videos from multiple platforms:
- YouTube Shorts
- TikTok (via unofficial/scraping APIs or embed approach)
- Instagram Reels (future consideration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 Frontend (Next.js)               │
│  Mobile-first PWA with vertical video player     │
│  Algorithm editor / Natural language input        │
│  Preference prompts / Onboarding flow            │
├─────────────────────────────────────────────────┤
│                  API Layer (Next.js API Routes)  │
│  Auth / User profiles / Algorithm CRUD           │
│  Feed generation / Video metadata caching        │
├─────────────────────────────────────────────────┤
│              Algorithm Engine                     │
│  Scoring & ranking pipeline                      │
│  NL-to-parameters translation                    │
│  Feedback loop processing                        │
├─────────────────────────────────────────────────┤
│              Data / Storage                       │
│  PostgreSQL (user profiles, algorithm configs)   │
│  Redis (feed cache, session state)               │
│  Video metadata index                            │
├─────────────────────────────────────────────────┤
│           External Video APIs                    │
│  YouTube Data API / TikTok / Embed proxying      │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ (App Router), React, TypeScript | SSR, mobile PWA support, single codebase for UI + API |
| Styling | Tailwind CSS | Rapid mobile-first UI development |
| Video Player | Custom player wrapping platform embeds + native `<video>` | Cross-platform video playback |
| State Management | Zustand | Lightweight, fits algorithm state well |
| Backend/API | Next.js API Routes | Colocated with frontend, serverless-ready |
| Database | PostgreSQL (via Prisma ORM) | Relational data for user profiles + algorithm configs |
| Cache | Redis (Upstash for serverless) | Feed caching, rate limiting |
| Auth | NextAuth.js | Simple auth with OAuth providers |
| NL Processing | Claude API | Translate natural language into algorithm parameters |
| Deployment | Vercel | Native Next.js support, edge functions |

---

## Data Models

### AlgorithmProfile
```
{
  id: string
  userId: string
  name: string                    // "My Chill Feed", "Learning Mode", etc.

  // Category weights (0-100 scale)
  categories: {
    cooking: 75,
    technology: 60,
    comedy: 40,
    fitness: 20,
    music: 80,
    education: 50,
    gaming: 0,        // 0 = blocked
    news: 0,
    ...
  }

  // Content controls
  controls: {
    maxVideoDuration: 60,         // seconds
    minVideoDuration: 5,
    preferredLanguages: ["en"],
    excludeKeywords: ["drama", "prank"],
    includeKeywords: ["recipe", "tutorial"],
    freshness: "week",            // how recent: "day", "week", "month", "any"
    popularityBias: 30,           // 0 = niche only, 100 = viral only
    diversityFactor: 50,          // 0 = stay narrow, 100 = explore widely
    repeatTolerance: 20,          // how often to resurface similar content
  }

  // Source preferences
  sources: {
    youtube: { enabled: true, weight: 70 },
    tiktok: { enabled: true, weight: 30 },
  }

  // Natural language rules (processed by Claude)
  naturalLanguageRules: [
    "Show me more woodworking and DIY projects",
    "No clickbait thumbnails",
    "Prefer creators with under 100k followers"
  ]

  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### User
```
{
  id: string
  email: string
  algorithmProfiles: AlgorithmProfile[]   // users can have multiple
  activeProfileId: string
  watchHistory: WatchEvent[]
  feedbackHistory: FeedbackEvent[]
}
```

### WatchEvent
```
{
  videoId: string
  platform: "youtube" | "tiktok"
  watchedDuration: number
  totalDuration: number
  skipped: boolean
  timestamp: DateTime
}
```

### FeedbackEvent
```
{
  videoId: string
  action: "like" | "dislike" | "block_creator" | "more_like_this" | "less_like_this"
  timestamp: DateTime
}
```

---

## Feature Breakdown

### Phase 1 — Foundation (MVP)
The core loop: user sets preferences, gets a feed, watches videos, refines.

1. **Project scaffolding**
   - Next.js app with TypeScript, Tailwind, Prisma, auth
   - Database schema + migrations
   - Basic project structure

2. **Onboarding flow**
   - Welcome screen explaining the concept
   - Natural language prompt: "Describe what you'd like to watch"
   - Category picker with sliders (visual, intuitive)
   - Generate initial algorithm profile from inputs

3. **Algorithm editor**
   - Full parameter dashboard with sliders, toggles, keyword inputs
   - Natural language input bar ("make it more chill, less news")
   - NL-to-parameter translation via Claude API
   - Save/load/switch between multiple profiles
   - Real-time preview of how changes affect the feed

4. **Video feed (core experience)**
   - Vertical swipe-based video player (TikTok-style UX)
   - Pull videos from YouTube Shorts API initially
   - Scoring engine ranks videos against active algorithm profile
   - Smooth transitions, preloading next videos
   - Skip/like/dislike/more-like-this/less-like-this actions

5. **Basic feedback loop**
   - Track watch duration, skips, explicit feedback
   - Surface prompts: "You've been skipping cooking videos — lower the weight?"
   - User approves or rejects every suggested change (full control)

### Phase 2 — Multi-Source & Polish
6. **TikTok integration**
   - Add TikTok as a video source
   - Unified video metadata normalization across platforms
   - Source weight balancing in the algorithm

7. **Algorithm transparency dashboard**
   - "Why was this shown?" explanation per video
   - Score breakdown: "Matched: cooking (75%), short duration (90%), fresh (60%)"
   - History of algorithm changes with undo

8. **Smart prompting system**
   - Periodic check-ins based on viewing patterns
   - "It's evening — switch to your 'Relaxation' profile?"
   - Trend detection: "You've watched 20 woodworking videos this week"

9. **PWA optimization**
   - Install prompt, offline support for cached feed
   - Push notifications for algorithm suggestions
   - App-like navigation with bottom tab bar

### Phase 3 — Advanced Features
10. **Algorithm sharing & discovery**
    - Share your algorithm profile as a link
    - Community algorithm presets: "Focused Learning", "Dinner Recipes Only"
    - Import/remix other users' algorithms

11. **Time & context controls**
    - Schedule different algorithms by time of day
    - "Workout mode" / "Bedtime mode" profiles that auto-activate
    - Session limits: "Stop after 20 minutes"

12. **Advanced NL understanding**
    - Conversational refinement: back-and-forth with the system
    - "Why did you show me that?" → explanation + inline adjustment
    - Voice input for hands-free control

---

## Scoring Engine Design

The algorithm engine scores each candidate video against the user's active profile:

```
finalScore =
    categoryMatchScore   * categoryWeight
  + keywordBonus
  - keywordPenalty
  + freshnessScore       * freshnessWeight
  + popularityScore      * popularityBias
  + diversityBonus       * diversityFactor
  - repeatPenalty        * (1 - repeatTolerance)
  + sourcePreference     * sourceWeight
  + nlRuleScore          // from Claude-evaluated rules
```

- Videos scoring below a threshold are filtered out
- Remaining videos are ranked and served in order
- A small random shuffle factor prevents staleness

---

## Key UX Principles

1. **Never change anything without asking.** The algorithm doesn't silently adapt. Every suggested change is surfaced as a prompt the user accepts or rejects.
2. **Explain everything.** Every video has a "why" button. Every parameter has a tooltip. No black boxes.
3. **Multiple profiles, easy switching.** Users think in modes (learning, relaxing, cooking). Support that.
4. **Natural language is the primary input.** Sliders are for power users. Most people should be able to type what they want.
5. **Mobile-first, desktop-capable.** Designed for thumb-scrolling on a phone. Works on desktop too.

---

## Project Structure (Proposed)

```
algerona/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (login, signup)
│   │   ├── (main)/               # Main app layout
│   │   │   ├── feed/             # Video feed page
│   │   │   ├── algorithm/        # Algorithm editor
│   │   │   ├── onboarding/       # First-time setup
│   │   │   └── profile/          # User profile / settings
│   │   ├── api/                  # API routes
│   │   │   ├── feed/             # Feed generation endpoints
│   │   │   ├── algorithm/        # Algorithm CRUD
│   │   │   ├── videos/           # Video metadata
│   │   │   └── auth/             # Auth endpoints
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── feed/                 # VideoPlayer, SwipeContainer, FeedbackButtons
│   │   ├── algorithm/            # Sliders, CategoryPicker, NLInput, ProfileSwitcher
│   │   ├── onboarding/           # OnboardingSteps, CategoryGrid
│   │   └── ui/                   # Shared UI primitives
│   ├── lib/
│   │   ├── algorithm/            # Scoring engine, NL translation
│   │   ├── video-sources/        # YouTube, TikTok API clients
│   │   ├── db/                   # Prisma client, queries
│   │   └── utils/
│   ├── store/                    # Zustand stores
│   └── types/                    # TypeScript type definitions
├── prisma/
│   └── schema.prisma
├── public/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Implementation Order for Phase 1

| Step | What | Details |
|------|------|---------|
| 1 | Project setup | Next.js, TypeScript, Tailwind, Prisma, basic layout |
| 2 | Auth | NextAuth with email/Google OAuth |
| 3 | Database schema | User, AlgorithmProfile, WatchEvent, FeedbackEvent |
| 4 | Algorithm data model + CRUD API | Create, read, update, delete algorithm profiles |
| 5 | Algorithm editor UI | Category sliders, controls, keyword inputs |
| 6 | NL input + Claude integration | Natural language bar that modifies algorithm params |
| 7 | YouTube Shorts integration | Fetch video metadata, search by categories/keywords |
| 8 | Scoring engine | Rank videos against algorithm profile |
| 9 | Video feed UI | Vertical swipe player, preloading, feedback buttons |
| 10 | Onboarding flow | NL prompt + category picker → initial profile |
| 11 | Feedback loop | Watch tracking, skip detection, suggestion prompts |
| 12 | Mobile optimization + PWA | Responsive polish, install prompt, performance |

---

## Open Questions for Review

1. **Auth approach**: Email + Google OAuth sufficient for MVP, or add more providers?
2. **TikTok sourcing**: TikTok has no official public API — are you comfortable with embed-based approaches or unofficial APIs for phase 2?
3. **Hosting**: Vercel is the natural fit for Next.js. Any preference otherwise?
4. **Claude API for NL**: Plan uses Claude to translate natural language into algorithm parameters. This is the core "magic" — confirm this approach works for you.
5. **Scope of MVP**: Phase 1 focuses on YouTube Shorts only with the full algorithm editor. Does that feel right as a first milestone?

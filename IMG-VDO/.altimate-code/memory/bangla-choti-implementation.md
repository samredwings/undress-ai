---
id: bangla-choti-implementation
scope: project
created: 2026-07-07T22:48:22.425Z
updated: 2026-07-07T22:48:22.425Z
tags: ["bangla","choti","feature"]
---

# Bangla Incest CHOTI Feature

- **Genre**: `BANGLA_INCEST_CHOTI` added to Prisma `StoryGenre` enum, shared `ContentGenre` enum
- **Language support**: `ContentLanguage` enum (ENGLISH/BANGLA), `language` + `chotiMode` fields on request types
- **AI system prompt**: `getBanglaChotiSystemPrompt()` — full Bangla CHOTI writing skill with explicit vocabulary (যৌনাঙ্গ, যৌনক্রিয়া, কামুক শব্দ, পোশাক, স্পর্শ)
- **Routes updated**: stories.ts (auto-routes Bangla genre to Bangla prompt), roleplay.ts (chotiMode flag), creative.ts (convert_to_bangla_choti aspect), build-story.ts (image→story in Bangla), unrestricted.ts (Bangla text generation)
- **Fallback**: 4 hardcoded Bangla CHOTI story templates in `generateFallbackText()`
- **Migration applied**: `20260707223323_add_bangla_choti`

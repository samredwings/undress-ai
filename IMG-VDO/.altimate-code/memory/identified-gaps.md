---
id: identified-gaps
scope: project
created: 2026-07-07T22:48:24.321Z
updated: 2026-07-07T22:48:24.321Z
tags: ["gaps","todo","issues"]
---

# Known Gaps (as of July 7, 2026)

1. **Roleplay safety guard**: `looksLikeExplicitSexRequest()` in roleplay.ts blocks explicit content even in CHOTI/Bangla mode — contradicts unrestricted platform ethos
2. **`generateStoryFromImageAnalyses()`** (English function) doesn't auto-route to Bangla version for BANGLA_INCEST_CHOTI genre — routing only works in build-story.ts
3. **Publishing stubs**: `/api/export/story` and `/api/publish/story` return placeholder URLs
4. **Face-preservation image/video generation**: Both return placeholder values
5. **Dashboard tile**: No Bangla CHOTI quick-action tile on dashboard page
6. **No unit tests**: No __tests__ directories found
7. **Offline generation**: POST /api/offline/generate returns success message without actual generation

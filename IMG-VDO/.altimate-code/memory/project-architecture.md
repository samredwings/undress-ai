---
id: project-architecture
scope: project
created: 2026-07-07T22:48:17.936Z
updated: 2026-07-07T22:48:17.936Z
tags: ["architecture","monorepo","project"]
---

# StoryBook Studio — Project Architecture

- **Monorepo (Turborepo)**: apps/api (Express, port 3001), apps/web (Next.js 14, port 3000), apps/worker (Bull queue, port 3002)
- **Packages**: shared/ (types), nsfw-filter/ (always-permissive checker), video-generator/ (provider abstraction)
- **Database**: PostgreSQL 16 + Prisma ORM 5.22, managed via `prisma migrate dev`
- **Infrastructure**: Docker Compose (postgres:16-alpine, redis:7-alpine, minio/minio)
- **Pricing**: 100% free tier (HuggingFace Inference API), optional BYOK (OpenAI, Runway, Pika, ElevenLabs, Replicate)
- **Content Policy**: Fully unrestricted — NSFW_DETECTION_ENABLED=false, ADULT_CONTENT_ALLOWED=true, UNRESTRICTED_MODE=true

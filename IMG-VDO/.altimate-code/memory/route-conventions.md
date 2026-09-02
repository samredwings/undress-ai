---
id: route-conventions
scope: project
created: 2026-07-07T22:48:20.057Z
updated: 2026-07-07T22:48:20.057Z
tags: ["conventions","routes","api"]
---

# API Route Conventions

- **Pattern**: Each route file has its own `Router()`, Zod validation schema, and default export
- **Auth**: 15/17 routes protected by `authMiddleware` (JWT Bearer token); health, auth, models, offline are public
- **Error handling**: Zod validation errors return 400; all other errors return 500 with descriptive messages
- **Route registration**: In `apps/api/src/index.ts`, public routes registered before protected ones, error handler at end
- **Route files maintain their own PrismaClient instance** (could be optimized with a shared client)
- **Zod schemas used for runtime validation** — not just TypeScript types

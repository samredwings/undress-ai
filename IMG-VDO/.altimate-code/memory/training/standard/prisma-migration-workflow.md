---
id: training/standard/prisma-migration-workflow
scope: project
created: 2026-07-07T22:48:41.429Z
updated: 2026-08-24T12:29:46.804Z
tags: ["training","standard"]
---

<!-- training
kind: standard
applied: 29
-->
# Prisma Migration Workflow
- Always use `npx prisma migrate dev --name <description>` for schema changes
- The .env file with DATABASE_URL must exist in apps/api/
- After migration, always verify: check tables, enum values, and _prisma_migrations tracking
- Old manual SQL migrations should be backed up, not deleted
- Regenerate Prisma Client: npx prisma generate

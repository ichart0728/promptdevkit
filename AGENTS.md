## Project Overview

- **Name**: PromptDevKit (web)
- **Goal**: Prompt CRUD / search / execution (template expansion) with basic auth and future team sharing
- **Stack**: Next.js (App Router) + TypeScript + TailwindCSS / Prisma + PostgreSQL / Auth.js v5 (NextAuth)
- **Package Manager**: pnpm
- **Database**: Docker Compose `postgres:16`

  - Default: `localhost:5432`. If the host already uses 5432, change Compose to `5433:5432` and update `.env` accordingly.

**Key directories**

```
prisma/                  # Prisma schema & migrations
src/app/                 # App Router pages + API routes
src/lib/                 # Shared utilities (e.g., prisma.ts)
src/generated/prisma/    # Prisma Client build output (do not commit)
.github/workflows/ci.yml # CI config
docker-compose.yml       # postgres + pgadmin
```

**Required environment variables (`.env`)**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pdk?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pdk_shadow?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change_me
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Provide `.env.example` for onboarding.

---

## How to Test

> CI lives in `.github/workflows/ci.yml`. For local checks, run in this order.

1. **Start DB**

```bash
docker compose up -d
docker compose ps
```

2. **Sync Prisma**

```bash
pnpm prisma generate
pnpm prisma db push
# When schema changed:
pnpm prisma migrate dev -n "<msg>"
```

3. **Static checks**

```bash
pnpm lint
# If no script for type-check:
pnpm tsc --noEmit
```

4. **Build**

```bash
pnpm build
```

5. **Run (manual verification)**

```bash
pnpm dev
# open http://localhost:3000
```

6. **Tests (if/when introduced)**

```bash
pnpm test
# Focus a single case:
pnpm vitest run -t "<TestName>"
```

---

## Coding Conventions

**TypeScript**

- Assume `strict`. Avoid `any`; add types where unclear.
- Prefer `@/*` import alias over deep relative paths.

**Next.js**

- App Router only. Use `"use client"` strictly where client APIs are needed.
- API Routes return `NextResponse.json(...)`; set accurate HTTP status codes.

**Prisma**

- Always use the shared client in `src/lib/prisma.ts` (avoid multiple instances).
- Any schema change **must** be accompanied by a migration (`migrate dev`). No ad-hoc SQL outside migrations.

**Auth.js v5**

- Use `@auth/prisma-adapter`. `session.strategy = "database"`.
- Secrets stay server-side; never expose in client bundles.

**Naming & structure**

- Files: `kebab-case.ts(x)`; Types/Classes: `PascalCase`; variables/functions: `camelCase`.
- Keep UI logic and data access separate (DB in API routes; UI fetches from API).

**Lint/Format**

- `pnpm lint` must pass before a PR is merged. Respect ESLint/Prettier rules.

---

## Prohibited Areas

- Do **not** edit or commit `src/generated/prisma/` (build output).
- Do **not** commit `.env` or secrets (update `.env.example` instead).
- Do **not** call Prisma directly from client components (use API routes).
- Do **not** change `prisma/schema.prisma` without creating a migration.
- Do **not** change DB ports in `docker-compose.yml` without also updating `.env` and README.
- Do **not** break `.github/workflows/ci.yml` without prior agreement.

---

## PR Template

**Title**: `[promptdevkit] <short title>`

**Summary**

- What was implemented/changed (1–3 lines)

**Motivation / Context**

- Why this is needed; link related issues/bugs

**Changes**

- Technical highlights (API, DB, UI, etc.)

**How to Run**

```bash
docker compose up -d
pnpm prisma generate
pnpm prisma db push   # or: pnpm prisma migrate dev -n "<msg>"
pnpm build
pnpm dev
```

**Screenshots / Videos** (when UI changes)

**Checklist**

- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] DB changes include a migration
- [ ] Tests added/updated as needed
- [ ] `.env.example` updated if required

**Labels**

- `priority:P0|P1|P2` and `type:feature|bug|chore|infra|doc`

---

## Prohibited Zones (Repo Map Quick Ref)

- `/src/generated/prisma/*` — auto-generated; never hand-edit
- `/public/*` — large assets only via review
- `/legacy/*` — if appears later, treat as read-only unless an issue explicitly asks

---

## Notes for Agents (CodeX)

- First verify `.env` and DB port alignment → `pnpm prisma db push` → `pnpm build`.
- If port 5432 conflicts with a host Postgres, switch Compose to `5433:5432` and update `.env`.
- Ensure `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")` exists in `prisma/schema.prisma`.
- Prefer small, focused PRs with passing lint/build and clear run steps.

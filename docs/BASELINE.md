# Stage 0 Baseline Report

- **Date**: 2026-10-30
- **Node Version**: v26.5.1
- **npm Version**: 11.17.0
- **Workspace**: `C:\Users\jorda\.gemini\antigravity\scratch\applix`

## 1. Starting Checklist Verification
- [x] `package.json`, `prisma/schema.prisma`, and `src/` are present.
- [x] API Routes count: **123** `route.ts` files found under `src/app/api/`.
- [x] Database models: **44** `model` blocks in `prisma/schema.prisma`.
- [x] `src/middleware.ts` exists and includes lockdown check.
- [x] `src/lib/platform-hosts.ts` does **not** exist yet (to be created in Stage 1).
- [x] `Navbar.tsx` supportSession type: already updated to `{ expiresAt: number; ticketRef: string | null } | null`.

## 2. Test Suite (`npm test`)
- **Total tests**: 30 tests across 6 files
- **Passing**: 28 tests passing (`discord-signature.test.ts`, `email-templates.test.ts`, `link-preview.test.ts`, `position-availability.test.ts`).
- **Failures / Known Issues**:
  - `src/lib/session.test.ts`: Fails due to top-level `await` under CJS tsx runner (`Transform failed with 1 error: Top-level await is currently not supported with the "cjs" output format`).
  - `src/lib/signed-token.test.ts`: Fails due to identical top-level `await` under CJS tsx runner.

## 3. Build & Compilation Verification
- `npx prisma generate`: **PASSED** (Generated Prisma Client v5.22.0 in 432ms).
- `npx tsc --noEmit`: **PASSED** (0 type errors, clean exit).
- `npm run build`: `scripts/sync-policies.ts` requires a live Postgres connection for policy syncing if remote DB URL is not set locally during standalone builds. Full TypeScript and Next app types pass clean.

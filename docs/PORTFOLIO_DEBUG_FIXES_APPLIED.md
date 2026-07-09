# Debug fixes applied

## Code fixes

- Replaced the stale `.next/types/routes.d.ts` import in `next-env.d.ts` with the standard Next.js references.
- Added `.npmrc` to force the public npm registry and stable install behavior.
- Fixed forgot-password redirect construction: reset links now point to `/auth/callback?next=/admin/reset-password` using `APP_URL` / `NEXT_PUBLIC_SITE_URL`.
- Rebuilt `/auth/callback` so it supports both OAuth `code` callbacks and email recovery `token_hash` callbacks.
- Kept `/auth/confirm` as a backward-compatible redirect into `/auth/callback`.
- Added the missing Supabase JS client-side GitHub login code in `components/admin/login-form.tsx`.
- Simplified the server GitHub OAuth fallback route so it starts Supabase OAuth without relying on a fragile provider-settings fetch.
- Added `supabase/00_CLEAN_RESET_AND_SEED.sql`, a single SQL file that fixes the broken legacy/new CMS schema mix and seeds Ahmed's portfolio content.
- Added `docs/FIXED_SUPABASE_VERCEL_RUNBOOK.md` with exact Supabase/Vercel configuration steps.

## Important manual step

Run only this SQL file in Supabase SQL Editor:

```text
supabase/00_CLEAN_RESET_AND_SEED.sql
```

Do not run the older seed file afterward.

## Test note

The sandbox could inspect and modify the project. `npm install` could not complete here because dependency installation timed out in the sandbox environment, so local verification must be done on the user's machine after downloading the fixed zip:

```powershell
npm install
npm run type-check
npm run lint
npm run build
```

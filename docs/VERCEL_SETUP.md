# Vercel Setup

## Required Environment Variables

Add these in Vercel Project Settings, for Production and any trusted Preview environment:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
APP_URL=https://your-production-domain.vercel.app
ALLOWED_ORIGINS=https://your-production-domain.vercel.app
REQUIRE_ADMIN_MFA=false
ADMIN_MFA_REMEMBER_DAYS=10
```

Optional:

```text
NEXT_PUBLIC_GITHUB_USERNAME=mhiriaziz13-gif
GITHUB_TOKEN=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

## Secret Handling

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-safe.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- Never expose the service role key as `NEXT_PUBLIC_*`.
- Do not paste secrets into source files.

## Production Domain

Set both values to the deployed Vercel production URL:

```text
APP_URL=https://your-production-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
```

`ALLOWED_ORIGINS` must contain only explicitly trusted deployed HTTPS origins in production. Localhost and `127.0.0.1` are added automatically outside production and are filtered from the production allowlist.

## Preview Deployments

Preview deployments have different hostnames. Add preview origins only if you intend to test admin/auth there. Otherwise, keep admin auth production-only.

## GitHub Auto Deploy

Connect the GitHub repository to Vercel and keep auto-deploy enabled for the production branch.

After changing environment variables:

1. Save variables.
2. Redeploy from Vercel.
3. Confirm `/`, `/admin/login`, `/auth/callback` and `/api/contact` load.

## Old Domain Removal

Remove any old portfolio domain from:

- Vercel Domains
- Supabase Auth Site URL
- Supabase Redirect URLs
- GitHub OAuth app callback settings if relevant

## Security Notes

The app adds CSP, HSTS, frame protection, referrer policy, permissions policy, content-type protection and a legacy cross-domain policy opt-out through `next.config.js`.

The CSP allows inline scripts/styles because Next.js and the current animation stack require framework-managed inline runtime/style behavior. Keep this documented if tightening CSP later.

## 2026 CMS/Auth Refinement

The current remote Supabase project already contains the reviewed security migrations. Do not run an apply-all migration command: the local and remote migration ledgers contain historical differences. Reconcile migration history deliberately before any future schema change. Detailed provider, recovery and MFA steps are in `docs/AUTH_FIX_GITHUB_MFA_RESET.md`.

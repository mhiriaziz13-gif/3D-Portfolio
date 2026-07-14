# Vercel Setup

## Required Environment Variables

Add these in Vercel Project Settings, for Production and any trusted Preview environment:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile
NEXT_PUBLIC_CAPTCHA_SITE_KEY=
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
```

## Secret Handling

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-safe.
- `NEXT_PUBLIC_CAPTCHA_PROVIDER` and `NEXT_PUBLIC_CAPTCHA_SITE_KEY` are browser-visible widget configuration.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- Never expose the service role key as `NEXT_PUBLIC_*`.
- Keep the Turnstile secret in Cloudflare and Supabase Auth. This application does not need it in Vercel.
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

## Turnstile CAPTCHA

This application uses Turnstile only on the email/password login and password-recovery request forms. Set the two public variables above for every Vercel environment where those forms must work, then redeploy because `NEXT_PUBLIC_*` values and the CSP are fixed at build time.

In Cloudflare Turnstile, allow the production hostname. Add trusted Vercel preview hostnames only when preview authentication is required. For local testing, use Cloudflare's documented testing site key or a widget that permits the local hostname; its matching secret must be configured in a non-production Supabase project.

In Supabase project `qflchsmvszbesfnomdeo`, open **Authentication > Bot and Abuse Protection**, select **Turnstile**, enter the Turnstile secret, enable CAPTCHA protection, and save. Do not copy that secret into this repository or a `NEXT_PUBLIC_*` Vercel variable.

GitHub OAuth, MFA verification, password updates after recovery, and logout do not use the CAPTCHA token.

## GitHub Auto Deploy

Connect the GitHub repository to Vercel and keep auto-deploy enabled for the production branch.

After changing environment variables:

1. Save variables.
2. Redeploy from Vercel.
3. Confirm `/`, `/admin/login`, `/admin/forgot-password`, `/auth/callback` and `/api/contact` load.
4. Confirm Turnstile loads on the two password-based entry forms and is absent from the homepage.

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

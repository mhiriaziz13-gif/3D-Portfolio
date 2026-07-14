# Supabase Setup

> **Existing production projects:** do not follow the bootstrap migration steps
> below and do not apply all pending repository migrations. As of 2026-07-14, the
> live migration ledger and repository history are not aligned, and the pending
> `202607100001_clean_reset_and_seed.sql` file is destructive. Reconcile each
> version against live schema first, then apply only individually reviewed files.
> The legacy bootstrap SQL also recreates the function/Storage findings addressed
> by `20260714093312_security_advisor_hardening.sql`, which was applied and verified
> on project `qflchsmvszbesfnomdeo` on 2026-07-14. Do not apply it again. See
> `security-scan-remediation-2026-07.md` for the release gate and verification.

## 1. Bootstrap a new/disposable database

Run the migration in Supabase SQL editor or with Supabase CLI:

- `supabase/migrations/202607080001_cms_auth_security.sql`

The same SQL is also copied to:

- `supabase/schema.sql`

It creates CMS tables, admin security tables, contact messages, uploads, RLS policies, indexes and storage buckets.

## 2. Auth URL Configuration

Set the Supabase Auth Site URL to the production app URL:

```text
https://your-production-domain.vercel.app
```

Add these Redirect URLs, replacing the production domain:

```text
https://your-production-domain.vercel.app/auth/callback
https://your-production-domain.vercel.app/auth/callback/
https://your-production-domain.vercel.app/auth/callback?next=/admin
https://your-production-domain.vercel.app/auth/callback?next=/admin/reset-password
https://your-production-domain.vercel.app/admin/login
https://your-production-domain.vercel.app/admin/login/
https://your-production-domain.vercel.app/admin/reset-password
https://your-production-domain.vercel.app/admin/reset-password/
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/
http://localhost:3000/auth/callback?next=/admin
http://localhost:3000/auth/callback?next=/admin/reset-password
http://localhost:3000/admin/login
http://localhost:3000/admin/login/
http://localhost:3000/admin/reset-password
http://localhost:3000/admin/reset-password/
```

## 3. Email Provider

Enable email/password sign-in in Supabase Auth.

For password recovery, the email template should include:

```html
<a href="{{ .ConfirmationURL }}">Reset password</a>
```

## 4. GitHub OAuth

Create a GitHub OAuth App.

GitHub OAuth App callback URL:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

In Supabase Auth Providers, enable GitHub and paste:

- Client ID
- Client Secret

The portfolio starts GitHub OAuth at `/api/auth/oauth/github` and returns through `/auth/callback?next=/admin`.

Important: GitHub login does not create admin access. If GitHub creates a separate `auth.users` row, manually add that user id to `public.admins`.

## 5. TOTP MFA

In Supabase Auth, enable TOTP MFA if it is not enabled by default.

Admin MFA enrollment is handled from:

```text
/admin/security
```

Google Authenticator can scan the QR code returned by Supabase MFA enrollment.

## 6. Storage Buckets

The migration creates these buckets:

- `public-assets`
- `project-images`
- `resumes`
- `uploads`

The admin upload route validates MIME type, extension, file size and magic bytes. SVG uploads are rejected.

## 7. Manual Admin Creation

1. Create or sign in with Ahmed's admin email through Supabase Auth.
2. Find the user in `auth.users`.
3. Insert the user id into `public.admins`:

```sql
insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'mhiriaziz13@gmail.com'
on conflict do nothing;
```

## 8. Initial CMS Content

The public site works with fallback content if CMS rows do not exist yet.

To seed CMS content, use the admin dashboard after the admin user is configured:

```text
/admin
```

Recommended first rows:

- one `profile` row
- one `hero` row
- one `about` row
- skills grouped by category
- projects and project sections
- experience entries
- resumes
- social links

Do not insert fake clients, fake metrics or old-owner content.
## 2026 CMS/Auth Refinement

Apply `supabase/migrations/202607090001_fix_cms_auth_certifications.sql`, then optionally run `supabase/seed_ahmed_portfolio.sql`. Detailed provider, recovery and MFA steps are in `docs/AUTH_FIX_GITHUB_MFA_RESET.md`.

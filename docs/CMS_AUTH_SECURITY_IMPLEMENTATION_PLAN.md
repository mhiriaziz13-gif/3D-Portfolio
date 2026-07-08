# CMS, Auth and Security Implementation Plan

## Current Structure Summary

- Framework: Next.js App Router (`app/`) with Next.js 16.2.9 and React 19.2.7.
- Styling/motion: Tailwind CSS, Framer Motion, React Three Fiber/Three.js, existing space/3D visual direction.
- Public routes: `/`, `/about`, `/projects`, `/experience`, `/contact`, `/resume`.
- Public data source today: `constants/portfolio.ts` exports profile, nav links, skills, projects, experience and resume assets.
- Public components currently importing static data: `HeroContent`, `DynamicTitle`, `About`, `Skills`, `Projects`, `Experience`, `ResumeSection`, `Contact`, `Navbar`, `Footer`, `AvatarCard`.
- Contact form today: client-only `mailto:` flow in `components/main/contact.tsx`.
- Resume page today: static CV links from `constants/portfolio.ts`.
- Supabase packages are not yet present in `package.json`.
- There is no existing middleware or API backend for admin/CMS/auth.

## Files To Add Or Change

Add:

- `.env.example`
- `data/fallback-portfolio.ts`
- `lib/cms-types.ts`
- `lib/cms.ts`
- `lib/supabase/config.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/security/http.ts`
- `lib/security/rate-limit.ts`
- `lib/security/validation.ts`
- `lib/security/redirects.ts`
- `lib/security/crypto.ts`
- `lib/security/admin-auth.ts`
- `lib/security/headers.ts`
- Admin components under `components/admin/`
- Auth/admin/contact/upload route handlers under `app/api/` and `app/auth/callback/`
- Admin pages under `app/admin/`
- Project detail route under `app/projects/[slug]/`
- Supabase migrations under `supabase/migrations/`
- `supabase/schema.sql`
- Documentation under `docs/`

Change:

- `app/page.tsx` and section pages to load CMS/fallback content.
- Public components to accept content props while keeping their existing visual design.
- `components/main/contact.tsx` to POST to `/api/contact` with mailto as a non-fatal fallback only if needed.
- `next.config.js` to add security headers.
- `package.json` dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `zod`.

## Database Schema Plan

Create public tables:

- `admins`
- `profile`
- `hero`
- `about`
- `skills`
- `projects`
- `project_sections`
- `experience`
- `education`
- `certifications`
- `resumes`
- `social_links`
- `site_settings`
- `contact_messages`
- `uploads`
- `admin_audit_logs`
- `admin_security_preferences`
- `admin_remembered_devices`

Use UUID primary keys where suitable, `created_at`, `updated_at`, `published`, `sort_order`, and structured arrays/json only where appropriate.

## RLS Plan

- Enable RLS on every CMS/admin table.
- Public users can read only published public content.
- Public users can insert contact messages via controlled policy and the server route.
- Admins are users whose `auth.uid()` exists in `public.admins`.
- Admins can manage CMS content, uploads metadata, resumes, messages and their own security preferences/devices.
- Admin-only tables are not readable by anonymous users.
- No service role key in browser code.

## Auth Flow Plan

- Email/password login posts to a server route.
- Server signs in with Supabase Auth, verifies explicit admin membership, then enforces MFA if required.
- GitHub OAuth starts from `/api/auth/oauth/github`, returns through `/auth/callback`, then verifies explicit admin membership.
- Non-admin users are signed out immediately and receive generic errors.
- Safe redirects allow only internal paths.
- Forgot/reset password uses Supabase recovery links through `/auth/callback?next=/admin/reset-password`.

## MFA And Remember Device Plan

- Use Supabase Auth MFA APIs for authenticator enrollment, challenge, verify, factor listing and unenrollment.
- TOTP is only a second factor after password/OAuth.
- `REQUIRE_ADMIN_MFA=true` forces MFA globally.
- Remember device stores a cryptographically random token in an HttpOnly cookie and only its SHA-256 hash in `admin_remembered_devices`.
- Remember device skips only MFA after a valid password/OAuth session.
- Reset password revokes remembered devices.

## Admin Dashboard Plan

- Simple secure dashboard under `/admin`.
- Server-side admin guard on admin pages.
- Sections for profile, hero, about, skills, projects, project sections, experience, education, certifications, resumes, social links, messages, uploads and security.
- Admin editing uses validated API routes and simple forms/JSON editors to stay functional without redesigning the public site.
- Security page handles MFA, admin preference and remembered device management.

## Supabase Setup Plan

- Add migrations and `schema.sql`.
- Document Auth URL configuration, GitHub provider callback, TOTP setup, storage buckets, and manual admin insertion.
- Storage buckets documented: `public-assets`, `project-images`, `resumes`, `uploads`.
- Ahmed manually creates/authenticates the admin user and inserts the `auth.users.id` into `public.admins`.

## Vercel Setup Plan

- Add required env variables to Vercel.
- Use production Vercel URL in `APP_URL` and `NEXT_PUBLIC_SITE_URL`.
- Include production and localhost origins in `ALLOWED_ORIGINS`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` as a public variable.
- Document preview deployment caveats and redeploy steps.

## Security Risks And Mitigations

- Open redirect: use `safeRedirect()` for all `next` parameters.
- CSRF/same-origin abuse: validate `Origin`/`Referer` on mutating routes.
- Brute force: in-memory rate limits for login, recovery, contact and uploads; production can replace with durable Redis/Upstash.
- Service key leakage: isolate service client in server-only module.
- Upload abuse: validate MIME, extension, size, UUID filenames and reject SVG.
- RLS bypass: browser uses anon client only; privileged writes happen only on server after admin verification.
- MFA bypass: GitHub and password login both pass through admin verification and MFA checks.

## Testing Plan

Automated:

- `npm install`
- `npm run type-check`
- `npm run build`
- `npm run lint`

Manual public QA:

- `/`, `/about`, `/projects`, `/projects/[slug]`, `/experience`, `/resume`, `/contact`
- Verify fallback content renders without Supabase env.
- Verify contact route inserts when Supabase is configured.

Manual admin/auth QA:

- `/admin/login`, `/admin`, `/admin/security`
- Email/password login, wrong password, non-admin rejection.
- GitHub OAuth and non-admin GitHub rejection once provider is configured.
- MFA enrollment/verification, wrong TOTP rejection, remember device, revoke device.
- Forgot/reset password, remembered-device revocation.
- CMS CRUD and upload validation.

Manual security QA:

- RLS enabled.
- Public cannot read unpublished or admin-only data.
- Service role key not exposed.
- Unsupported uploads rejected.
- Open redirects blocked.
- No old owner data or old domains remain.
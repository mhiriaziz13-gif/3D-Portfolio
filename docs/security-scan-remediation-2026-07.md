# Security scan remediation — July 2026

## Scope and status

This is a targeted hardening review of the production Next.js 16 portfolio on
Vercel and its Supabase project `qflchsmvszbesfnomdeo`. The evidence baseline was
captured on 2026-07-13. The authentication architecture, OAuth, MFA,
password-reset, CMS authorization, and Bearer-token validation were not changed.
The POST-only logout route received one isolated same-origin check before sign-out.

The repository hardening changes described here were completed locally. The exact
database migration was applied to Supabase project `qflchsmvszbesfnomdeo` and
verified on 2026-07-14. The application changes still require a separate Vercel
deployment; no application deployment was performed as part of this work.

The six classifications used in this report are:

1. Confirmed and actionable
2. Already fixed or contradicted by current evidence
3. Acceptable architectural behavior
4. False positive
5. Requires manual platform configuration
6. Cannot be controlled from application code

## Executive decisions

- Production `unsafe-eval` is removed. Development retains it for Next.js tooling.
- Script `unsafe-inline` remains as a disclosed compatibility exception. The site
  uses App Router hydration and ISR (`revalidate = 60`). A request nonce would make
  the affected pages dynamic, disable static optimization/ISR/CDN caching, and
  increase request cost. Current Next.js guidance documents that trade-off.
- Style `unsafe-inline` remains because Framer Motion and existing React style props
  emit style attributes. Removing it without a broader UI refactor would break
  animations and layout.
- Broad `img-src https:` is replaced by the app origin, `data:`, `blob:`, the exact
  Supabase origin, and exact Google Analytics/Tag Manager image-beacon origins. New
  CMS image hosts must be reviewed and explicitly added.
- Google Analytics is intentional and remains loaded through `next/script`. A static
  integrity hash is not used for Google's mutable, unversioned `gtag.js` response.
- `public.is_admin()` is moved, preserving its PostgreSQL object identity, into an
  unexposed `private` schema. Existing policies therefore keep their exact compiled
  dependency and behavior while public RPC exposure is removed.
- Public buckets stay public. Only policies permitting anonymous enumeration of
  `storage.objects` are removed; known public object URLs remain public.

Relevant current documentation:

- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase public bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [RFC 9116 security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)

## Baseline evidence

### Repository

- Security headers and the only CSP are centralized in `next.config.js`.
- `proxy.ts` delegates to the existing Supabase cookie-refresh proxy. No second
  middleware/proxy exists.
- Google Analytics, Vercel Analytics, and Vercel Speed Insights are intentional and
  active. No other remote script or stylesheet was found.
- Framer Motion and explicit React `style` props require inline style attributes.
- No configured Next.js image `remotePatterns` were found. Current CMS image, resume,
  and upload records do not contain external HTTP(S) asset origins.
- The hydrated contact handler sends `POST` JSON. The HTML form now also declares
  `method="post"` and `/api/contact` as its action, preventing native/pre-hydration
  submission from putting personal data in the browser URL.
- Sensitive API helpers set `Cache-Control: private, no-store, max-age=0`. The
  existing Supabase proxy also makes matched HTML responses private/no-store.
- No application CORS header or generic `OPTIONS` handler was found.
- Logout remains a POST-only route, is invoked by an explicit HTML form, has no
  `/api/auth/logout` link or GET handler, and rejects disallowed origins before
  calling `signOut()` or clearing the remembered-device cookie.

### Production headers before this patch

Read-only checks against `https://ahmedaziz-portfolio.vercel.app` showed:

- `/`: `200`, HSTS present, private/no-store, current CSP present once,
  `X-Powered-By: Next.js` present.
- `/resume`: `200`, HSTS present, private/no-store.
- `/admin`: `307` to login, private/no-store.
- `/admin/login`: `200`, private/no-store.
- `/.well-known/security.txt`: `404` before deployment of this patch.
- A static JavaScript chunk: `200`, immutable one-year cache, HSTS present,
  platform `Access-Control-Allow-Origin: *`.
- A Next.js optimized image: `200`, public cache, HSTS present, platform-managed
  restrictive image CSP, and platform `Access-Control-Allow-Origin: *`.
- Port 80 returns `308` to HTTPS; port 443 serves TLS.

Foreign-origin mutation probes returned no permissive CORS header:

- `/api/admin/content`: `403`
- `/api/admin/messages`: `403`
- `/api/admin/upload`: `403`
- `/api/admin/settings`: `403`
- the contact endpoint: generic `400`, without CORS access

The earlier notes mistakenly named `/api/admin/login`; that is not the real login
endpoint and is not counted as evidence. The actual `/api/auth/login` and
`/api/auth/logout` endpoints are included in the post-patch verification matrix.

### Live Supabase baseline

- `public.set_updated_at()` has no pinned `search_path` and only sets
  `NEW.updated_at = now()`.
- `public.is_admin()` is `STABLE`, `SECURITY DEFINER`, owned by `postgres`, takes no
  parameters, reads `public.admins`, and derives identity from `auth.uid()`.
- `PUBLIC`, `anon`, `authenticated`, and `service_role` currently have EXECUTE on
  `public.is_admin()`.
- The `private` schema does not exist in the reviewed production baseline.
- Existing admin RLS policies depend on the function. There is no repository server
  call to `rpc('is_admin')`.
- `portfolio-assets`, `public-assets`, `project-images`, and `resumes` are public;
  `uploads` is private. All five buckets were empty at the time of inspection.
- The repository contains no use of `portfolio-assets`; the media APIs use the
  existing authenticated/service-role paths and upload metadata.
- The current advisor also reports `site_settings` as RLS-enabled without a policy.
  This informational item was not among the five requested warnings and may be an
  intentional service-role-only table, so it was not changed speculatively.

## Exact CSP before and after

Production before:

```text
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://qflchsmvszbesfnomdeo.supabase.co wss://qflchsmvszbesfnomdeo.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Production after the prepared config is deployed with the current Supabase URL:

```text
default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://qflchsmvszbesfnomdeo.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com; font-src 'self' data:; connect-src 'self' https://qflchsmvszbesfnomdeo.supabase.co wss://qflchsmvszbesfnomdeo.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com; media-src 'self' blob: https://qflchsmvszbesfnomdeo.supabase.co; object-src 'none'; worker-src 'self' blob:; manifest-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
```

Development adds `'unsafe-eval'` to `script-src` and omits
`upgrade-insecure-requests`. Production does not contain `unsafe-eval`.

## Finding register

| Scanner / source | Finding and evidence | Classification | Action and verification | Residual risk |
| --- | --- | --- | --- | --- |
| Pentest-Tools / ZAP | Production `script-src` contained `unsafe-eval`. Confirmed in the live header. | 1 — Confirmed and actionable | The config includes it only when `NODE_ENV === 'development'`. Inspect the production config and deployed header after deployment. | None in production; development intentionally has eval-capable tooling and must not be internet-exposed. |
| Pentest-Tools / ZAP | `script-src 'unsafe-inline'` and no nonce. App Router emits inline bootstrap scripts; the site uses ISR. | 3 — Acceptable architectural behavior for this intermediate policy | Retained and disclosed. Added `script-src-attr 'none'`, restricted remote origins, and did not alter the auth proxy. Browser CSP testing is required after deployment. | An allowed inline script injection could execute. A future nonce rollout requires accepting fully dynamic rendering and testing every public/auth/CMS path. |
| Pentest-Tools / ZAP | `style-src 'unsafe-inline'`. Framer Motion and React style props were found. | 3 — Compatibility exception | Retained after repository inspection. No user-controlled CSS values were introduced. | CSS injection has broader impact than with a nonce/hash-only style policy. Removing it requires a dedicated animation/style refactor. |
| Pentest-Tools / ZAP | `img-src https:` allowed every HTTPS origin. Current CMS data has no external asset origins. | 1 — Confirmed and actionable | Replaced with self/data/blob plus exact Supabase and active GA/GTM image origins. Build and browser-test all images. | Future arbitrary external CMS image URLs will be blocked until approved and allowlisted. The CMS currently accepts HTTPS values, so approval remains operational rather than validation-enforced. |
| Pentest-Tools / ZAP | `object-src` missing and CSP lacked several restrictive directives. | 1 — Confirmed and actionable | Added `object-src 'none'`, `worker-src`, `manifest-src`, `frame-src 'none'`, `script-src-attr 'none'`, and production `upgrade-insecure-requests`. | A future legitimate iframe/worker/remote asset requires a reviewed CSP change. |
| ZAP | `X-Powered-By: Next.js` present in production. | 1 — Confirmed and actionable | Added `poweredByHeader: false`. Verify the preview/deployed header. | `Server: Vercel`, `/_next/` paths, and platform behavior still identify the stack. Security does not rely on obscurity. |
| Pentest-Tools | WordPress, PHP, and MySQL fingerprinting. None exists in the repository or runtime design. | 4 — False positive | No change. Next.js and Vercel fingerprints are real and acceptable. | Automated fingerprinting remains imperfect. |
| ZAP / Pentest-Tools | `/.well-known/security.txt` returned 404. | 1 — Confirmed and actionable | Added an RFC 9116 file with contact, expiry, languages, and canonical URL. Verify 200 and `text/plain` after deployment. | The expiry must be renewed before 2027-06-30. The chosen reporting email is public. |
| ZAP | `Access-Control-Allow-Origin: *` on static chunks/images and referenced public metadata paths. No app CORS header exists. | 3 — Acceptable platform behavior for public resources | Left Vercel/Next static behavior intact. Foreign-origin probes against sensitive mutations returned 403/no ACAO; contact returned no ACAO. | Public assets are readable cross-origin by design. This is not credentialed access to private data. |
| ZAP | No SRI on mutable Google `gtag.js`. Analytics is intentionally configured through `next/script`. | 3 — Accepted technical limitation | Kept GA, restricted its script/connect/image origins, and did not add a brittle integrity hash. | Compromise of the trusted Google origin could affect visitors. Remove GA in a separate product decision to eliminate this dependency. |
| ZAP / UpGuard | ZAP reported missing HSTS on some image optimizer responses; root, static JS, and the current optimized image all return HSTS. UpGuard reports it enabled. | 2 — Contradicted by current evidence | Kept one centralized HSTS header. Recheck the exact optimized image after deployment. | Vercel controls parts of managed asset delivery. A future platform-specific omission may require Vercel support, not an unsafe workaround. |
| ZAP | Cache directive review. Root/admin/auth/API are private/no-store; static chunks are immutable. | 3 — Correct route-sensitive behavior | Did not disable caching globally. Verified admin responses are not shared. | The Supabase cookie-refresh proxy currently also makes anonymous public HTML private/no-store, which is safe but reduces CDN efficiency. Changing it requires auth-cookie regression testing. |
| ZAP | Scanner generated `?company=...&email=...&message=...&name=...`. The hydrated handler used POST JSON, but the HTML form omitted `method`, so native/pre-hydration submission defaulted to GET. | 1 — Confirmed and actionable | Added explicit `method="post"` and `action="/api/contact"`; the existing JSON `fetch` path is unchanged. Verify the browser URL remains unchanged. | Without JavaScript the API returns a generic error because it expects JSON, but personal data is no longer placed in the URL. Process-local rate limiting is not globally durable. |
| Pentest-Tools | Public contact email detected in UI, metadata, and package information. | 3 — Intentional public business contact | Retained by product intent. | Spam/phishing risk remains. A dedicated alias, provider filtering, or contact-form-only product decision can reduce it. |
| UpGuard | DNSSEC disabled for a `vercel.app` hostname. | 6 — Not controllable from application code | No code change. Use a custom domain and a DNS provider supporting DNSSEC for independent control. | DNS policy remains under Vercel for the current subdomain. |
| HostedScan | Ports 80 and 443 open. Port 80 redirects to HTTPS and 443 serves TLS. | 3 — Expected web-service exposure | No change. | Normal internet-facing HTTP/TLS attack surface remains and must be patched/monitored. |
| Supabase Advisor | `public.set_updated_at()` has mutable search path. Exact body only uses `now()`. | 1 — Confirmed and actionable | Migration sets the exact zero-argument function's `search_path` to `pg_catalog`, without recreating it. Verify definition and trigger bindings with the read-only SQL. | The migration is applied; a safe-row trigger mutation test still requires authenticated test data. |
| Supabase Advisor | Public `portfolio-assets` SELECT policy permits object enumeration; a second broad public-bucket listing policy also exists. Buckets are public and empty. | 1 — Confirmed and actionable | Migration removes only the two exact broad listing policies. Bucket visibility and objects are unchanged. | Anyone knowing a public object URL can still fetch it, intentionally. Public filenames should not contain secrets. |
| Supabase Advisor | `anon` can execute exposed `public.is_admin()` SECURITY DEFINER RPC. | 1 — Confirmed and actionable | Migration moves the same function object to `private`, pins its path, revokes PUBLIC/anon/service-role execution, and grants only authenticated execution needed by RLS. | Database role settings show no exposed-schema override; keep `private` out of Dashboard API exposed schemas. |
| Supabase Advisor | Authenticated users can directly RPC `public.is_admin()`. Policies also require authenticated execution. | 1 — Confirmed and actionable with an architectural distinction | Moving the function removes public RPC exposure while keeping minimum authenticated EXECUTE and private-schema USAGE for RLS. Function takes no caller-controlled ID and derives the caller from `auth.uid()`. | An authenticated caller can execute it only where the private schema is available; it returns only the caller's own admin boolean. Do not expose `private` through PostgREST. |
| Supabase Advisor | Leaked-password protection disabled. | 5 — Requires manual Supabase configuration | Enable it in Dashboard and review the auth checklist below. No SQL or login-flow change pretends to enable it. | Remains open until a project owner changes and verifies the setting. |

## HTTP header and CORS implementation

`next.config.js` remains the single application-controlled header source. It now:

- disables `X-Powered-By`;
- retains nosniff, strict referrer policy, frame denial, permissions policy,
  same-origin opener policy, and two-year HSTS;
- emits one environment-aware CSP;
- does not add wildcard CORS, obsolete XSS headers, HPKP, or Expect-CT.

The platform-controlled `Server: Vercel` header is not treated as removable. Static
ACAO is not copied onto APIs. Authenticated responses remain no-store, while hashed
static resources retain immutable caching. The shared JSON helper now emits the
exact `private, no-store, max-age=0` directive. Contact has an explicit HTML POST
fallback, and logout rejects disallowed origins before the existing sign-out flow.

## Supabase migration

Applied migration:

`supabase/migrations/20260714093312_security_advisor_hardening.sql`

Supabase recorded it as remote version
`20260714093312_security_advisor_hardening`. It was applied through the migration
API as the single reviewed file, so none of the older pending repository migrations
were replayed.

It performs no table drop, truncate, reset, reseed, content deletion, administrator
deletion, or auth-user deletion. It:

1. fails before mutation unless the verified public functions exist and the
   destination `private` schema is absent;
2. pins `public.set_updated_at()` to `search_path = pg_catalog`;
3. creates/locks down the `private` schema;
4. moves the existing zero-argument `public.is_admin()` object to
   `private.is_admin()` so PostgreSQL policy dependencies follow the same object;
5. enforces trusted owner `postgres` and pins the helper to an empty search path
   while its body continues to use
   schema-qualified `public.admins` and `auth.uid()`;
6. removes default/public/anon/service-role execution and grants authenticated
   execution plus schema usage only for RLS evaluation;
7. removes the exact broad public storage-listing policies without changing buckets
   or objects.

Read-only post-migration queries are in
`supabase/security_advisor_verification.sql`. They inspect definitions, owners,
security mode, search paths, effective grants, RLS expressions and dependencies,
storage policies, buckets, and updated-at trigger bindings. It now includes a
machine-readable invariant summary and an expected-trigger inventory.

### Live rollout result and remaining history warning

The exact hardening migration was applied and verified on 2026-07-14. The remote
ledger now records `202606270001_security_hardening`,
`202607040001_admin_mfa_recovery`, and
`20260714093312_security_advisor_hardening`.

**Remaining release blocker for general migration tooling:** several older local
files still appear pending, including destructive
`202607100001_clean_reset_and_seed.sql`. Do not run `supabase db push`,
`supabase migration up`, automatic branch/CI migrations, or any apply-all-pending
workflow. Live state also proves `202607130001_dynamic_messages_and_cms_settings`
is not applied, so it must not be marked applied.

Live verification confirmed that the function object IDs and all compiled RLS
dependencies were preserved, `authenticated` can evaluate the private helper,
`anon` and `service_role` cannot execute it, both broad listing policies are gone,
the admin Storage policy and bucket visibility are unchanged, and the public
`is_admin` RPC now returns 404. Supabase Security Advisor no longer reports the
mutable helper path, public-bucket listing, or exposed SECURITY DEFINER function.

Establish a clean remote-derived migration baseline in a separate maintenance
task. Use migration-history repair only for a version whose complete resulting
state is proven present. Legacy bootstrap/reset SQL recreates the findings and is
not production-safe.

### Required post-migration regression matrix

The live migration, metadata invariants, dummy authenticated-role execution,
published public REST read, public RPC removal, and Security Advisor checks passed.
The remaining credential- or test-object-backed matrix is:

- admin can read/write every existing CMS table;
- non-admin authenticated user cannot read private admin/CMS data or mutate it;
- anonymous writes fail and published public reads still work;
- unpublished/private rows remain inaccessible;
- `/rest/v1/rpc/is_admin` does not expose the helper (passed live with 404);
- updated-at triggers still change timestamps on a safe test row;
- anonymous Storage `.list()` cannot enumerate the public buckets;
- a controlled public test object URL still returns the file (all inspected buckets
  were empty, so there is currently no known object to reuse);
- Media Library list/upload/delete continue through their authenticated admin APIs.

### Manual rollback design

If a tested migration regression requires rollback, move the same function object
back to `public`, restore its former search path/grants, reset the trigger function
path, and recreate the two saved policies. This is a schema/privilege rollback; no
data restoration is required. Restoring those definitions also deliberately
restores the advisor warnings, so it should be temporary while the regression is
fixed. The empty `private` schema can safely remain rather than being dropped.

## Manual platform actions

### Supabase Auth

In Supabase Dashboard:

1. Go to **Authentication > Security / Password settings**.
2. Enable leaked-password protection.
3. Review minimum password length and complexity policy.
4. Confirm email-confirmation requirements match the product decision.
5. Confirm refresh-token reuse detection is enabled with an appropriate interval.
6. Consider CAPTCHA for exposed auth/contact endpoints after UX testing.
7. Confirm administrator MFA enforcement, verification, recovery, and remembered
   devices with a real admin and a non-admin account.

Do not change these settings blindly: each affects the already-working login flow.

### Vercel and deployment

1. Create a preview deployment intentionally; this audit does not deploy.
2. Confirm `NEXT_PUBLIC_SUPABASE_URL` is present so the exact HTTPS/WSS CSP origins
   are emitted.
3. Ensure production `ALLOWED_ORIGINS` contains only intended HTTPS deployment
   origins; remove localhost/loopback entries from Vercel production variables.
4. Exercise public pages, email/password login, GitHub OAuth callback, MFA,
   password reset, admin session persistence, CMS save/delete, messages, settings,
   upload/delete, Media Library, and explicit POST logout.
5. Inspect the browser console/network panel for required CSP violations.
6. Repeat the header matrix against the preview, then production after approval.

### DNS

No repository action can enable DNSSEC for `*.vercel.app`. If independent DNSSEC
control is required, attach a custom domain and enable DNSSEC with its authoritative
DNS provider after confirming Vercel's domain setup requirements.

## Dependency and secret audit

- `npm audit --json`: 0 vulnerabilities across 543 dependencies at the audit time.
- Installed Next.js `16.2.9` is newer than the fixed ranges in the reviewed official
  2025 and May 2026 advisories. The official advisory list was reviewed and the npm
  audit reports no affected package. No dependency was changed solely for version
  churn.
- `npm outdated --json` shows routine compatible updates for Supabase libraries,
  PostCSS, types, and other packages, plus some unrelated major releases. These are
  suitable for a separate controlled dependency PR with full auth/CMS regression
  tests, not this targeted patch.
- Repository and tracked-history scans found no real service-role key, GitHub client
  secret, password, access/refresh token, private key, hardcoded administrator
  credential, or committed private `.env` file.
- Service-role references are blank examples/placeholders or server-only environment
  lookups. `NEXT_PUBLIC_SUPABASE_URL` and the anon key are public identifiers, not
  secrets. The service-role key remains server-only.
- `.gitignore` excludes environment/local/Vercel/Node/Next build artifacts.
- No credential rotation was performed. If a future history scan finds a real
  secret, revoke/rotate it at its provider before attempting history cleanup.

## Verification record

Completed locally on 2026-07-14:

- `npm run type-check`: pass.
- `npm run lint`: pass.
- `npm run build`: pass with Next.js 16.2.9; all expected public, admin, auth,
  contact, and API routes were generated.
- `npm test`: not run because no test script is defined.
- `npm audit --json`: pass, 0 vulnerabilities across 543 dependencies.
- Production CSP inspection: exactly one policy; no `unsafe-eval`; `object-src
  'none'`; no broad `img-src https:`; script/style `unsafe-inline` remain exactly as
  disclosed. Development adds `unsafe-eval` and omits `upgrade-insecure-requests`.
- Local production HTTP: `/`, `/about`, `/projects`, `/experience`, `/resume`,
  `/contact`, and `/admin/login` returned 200; `/admin` redirected to login.
- `/.well-known/security.txt`: 200 with `text/plain; charset=UTF-8` and expected
  RFC 9116 body. Local `robots.txt` and `sitemap.xml` returned 404; this is not a
  security remediation and should be handled separately if those metadata routes
  are a product requirement.
- Header matrix: no `X-Powered-By`; CSP present once; nosniff, frame denial,
  referrer policy, opener policy, HSTS, and route-appropriate cache controls present.
  A static chunk retained immutable caching. The optimized image returned 200 with
  HSTS and Next.js's restrictive managed-image CSP.
- API/CORS checks: unauthenticated admin APIs returned 401/private-no-store without
  ACAO. Foreign-origin login and logout returned 403 without ACAO. Foreign-origin
  contact returned a generic 400 without ACAO.
- Logout regression: GET returned 405; foreign POST returned 403; explicit
  same-origin POST returned 303 to `/admin/login`. Source inspection confirms one
  POST handler, no logout Link, and the origin check executes before `signOut()`.
- Contact regression: rendered HTML contains `action="/api/contact" method="post"`;
  the hydrated handler still uses JSON POST. Native form POST returned a generic
  error body and did not place fields in a URL query.
- Headless Chrome rendered the contact page, WebGL canvas, analytics tags, and form;
  no browser CSP violation was detected.
- `git diff --check`: pass. Changed-file trailing-whitespace check: pass.
- The local production test server was stopped after verification.

Pending by design: real email/password and GitHub OAuth login, callback, MFA,
remembered-device, password-reset, authenticated CMS save/delete/messages/settings,
Media Library, updated-at mutation, and known-object Storage retrieval. Those
require real credentials or stored test objects. Live metadata, RLS dependency,
role-execution, public REST, public RPC, and Security Advisor checks passed. All
inspected Storage buckets were empty, so known-object retrieval could not be
exercised. Only the reviewed metadata-only hardening migration was applied; no
application rows or objects were modified.

## Exact file inventory

Modified existing files:

- `app/api/auth/logout/route.ts`
- `components/main/contact.tsx`
- `docs/SUPABASE_SETUP.md`
- `lib/security/headers.ts`
- `next.config.js`
- `supabase/README.md`

New files:

- `docs/security-scan-remediation-2026-07.md`
- `public/.well-known/security.txt`
- `supabase/migrations/20260714093312_security_advisor_hardening.sql`
- `supabase/security_advisor_verification.sql`

Exact `git diff --name-only` output (Git reports tracked modifications only):

```text
app/api/auth/logout/route.ts
components/main/contact.tsx
docs/SUPABASE_SETUP.md
lib/security/headers.ts
next.config.js
supabase/README.md
```

The four new files above appeared separately as untracked in the pre-commit
`git status --short` snapshot. These paths form the requested hardening commit.
The exact Supabase migration was applied and verified; no destructive SQL or
application deployment was performed.

## security.txt maintenance

The file expires at `2027-06-30T23:59:59Z`, less than one year after creation.
Renew the date and reconfirm the reporting mailbox before that deadline. Do not add
a PGP key or policy URL unless it actually exists and is maintained.

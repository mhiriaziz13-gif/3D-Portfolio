# Analytics consent implementation report

## 1–5. Cause, order, storage and defaults

The likely production defect was the `NEXT_PUBLIC_GTM_CONTAINER_ID`/`NEXT_PUBLIC_GTM_ID` contract mismatch, compounded by an unversioned preference and coupled page-view logic. Previously the layout queued default consent and immediately loaded GTM before React; consent and page views were then managed together. The final order is: controlled pre-interactive consent bootstrap → React application/provider → guarded interactive GTM loader → consent-aware page tracker and Clarity loader. Storage is `aam_analytics_consent_v1` with `{version:1, analytics, updatedAt}`. A valid legacy choice is migrated once before GTM and its old key removed. Malformed, unsupported or inaccessible storage maps to unknown, and Google maps unknown to denied.

## 6–9. Accept, reject, revocation and returning users

Accept persists first, immediately sends a Google Consent Mode update, pushes a non-GA diagnostic Data Layer event, updates React state, then lets the tracker emit the current page once. Reject/revoke persists denied, sends the denied update, notifies Clarity Consent V2, blocks typed events, removes only `_ga`, `_ga_*`, `_clck` and `_clsk`, and closes preferences without reload. Returning valid granted users queue granted in the default command before GTM and receive one initial public page view.

## 10–14. GTM, GA, page views, Clarity and cookies

GTM requires `VERCEL_ENV=production`, `NEXT_PUBLIC_GTM_ID`, the exact production hostname and a public route. A DOM/window guard prevents a second load. There is no direct GA4 loader. Search-aware page-view signatures prevent duplicate current-route events. Clarity is dynamically initialized once only after consent, uses Consent V2 with advertising denied, and receives denied on withdrawal. First-party cleanup is deliberately narrow; third-party browser storage cannot always be removed by application JavaScript, while denied consent prevents future permitted use.

## 15–18. Events, PII, CSP and environment

Business events are a TypeScript union with whitelisted parameters. Contact success requires a real non-fallback API success; fallback and errors use fixed metadata only. No name, email, message, token, user ID, auth state or API body is accepted. Contact/auth/admin areas carry Clarity masking. CSP was not weakened: production still excludes `unsafe-eval`, retains `script-src-attr 'none'`, and uses the existing narrow origins. Source now consumes `NEXT_PUBLIC_GTM_ID`; missing GTM or Clarity IDs disable that integration without error. Preview, development, localhost and cloned hostnames are blocked.

## 19–20. Files

Added: consent model, consent bootstrap, analytics provider, GTM loader, page-view tracker, Clarity loader, typed events, static verification script, audit, GTM contract, Clarity checklist, manual plan, privacy-review note and this report.

Modified: root layout, global analytics types, tracked links, consent footer control, Vercel telemetry wrapper, event call sites, sensitive layouts/forms, environment example, README, package scripts and analytics setup documentation. Removed legacy manager, legacy Data Layer utility/routes and legacy Clarity component.

## 21–22. Commands and results

Completed checks: type-check passed; ESLint passed; production build passed and generated all routes; analytics static verification passed; production security verification passed with 74 checks, 0 warnings and 0 failures; local SEO audit passed with 0 warnings and 0 failures; repository searches found no direct GA4 load or source hard-coded production ID. Automated visual verification was unavailable because the `agent-browser` executable is not installed. Browser behavior and Tag Assistant remain subject to the manual plan.

## 23–26. External/manual work and diagnostic limits

Tag Assistant must validate the exact consent timeline and cookies. GTM must be configured/tested per `docs/analytics/gtm-production-configuration.md`; it was not edited or published here. Clarity dashboard Consent Mode and cookie defaults must be checked per its checklist; they were not changed here. The GTM warning is historical, traffic-dependent and asynchronously processed, so it may not disappear immediately.

## 27. Release checklist

- Configure only the documented public runtime IDs in Vercel Production.
- Preview the GTM workspace; confirm `send_page_view=false` and consent requirements.
- Complete Scenarios A–H and record evidence.
- Confirm one GTM and one Clarity initialization.
- Confirm POST-only logout, auth, MFA, hCaptcha, CMS and uploads still work.
- Review the factual privacy text and supply owner-approved legal policy details separately.
- Deploy only after automated and manual acceptance passes.

No commit, push, deployment, GTM publication, analytics-property edit, Clarity-dashboard edit, Vercel environment edit, Supabase mutation or migration was performed.

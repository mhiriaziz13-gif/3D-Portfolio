# Analytics consent audit

## Scope and findings

The audit covered the root layout, consent UI, Data Layer utilities, GTM and Clarity loading, Vercel telemetry, business-event call sites, environment documentation, CSP, sensitive forms, and the POST-only logout route.

- GTM was loaded once in `app/layout.tsx`; no direct `gtag.js` or direct GA4 configuration existed.
- The old default consent ran before GTM, but GTM itself ran `beforeInteractive` and lacked a browser hostname/path guard.
- The runtime used `NEXT_PUBLIC_GTM_CONTAINER_ID`, while the required production contract uses `NEXT_PUBLIC_GTM_ID`. A deployment configured only with the latter would not load GTM.
- Consent used the unversioned `aam_analytics_consent` string. Reads/writes did not catch unavailable storage or validate structured/versioned data.
- `window.gtag` was globally queued, and Accept/Reject sent real Consent Mode updates with all advertising states denied.
- Stored `granted` was restored before GTM, but only from the legacy string model.
- Page views were pushed both from the Accept handler and a consent effect. The ref compared only `pathname`, omitting search and title, so duplicates and missed URL variants were possible.
- Clarity loaded only after consent and used Consent API V2 through the NPM package. It was not installed through GTM.
- Preview was blocked server-side with `VERCEL_ENV`, but unknown production aliases/cloned domains were not blocked in the browser.
- `/admin`, `/auth`, and `/api` were excluded by the shared route predicate. Consent UI did not appear there.
- Event payloads were controlled, but several required enums and contact metadata were absent. No form-entered name, email, message, CAPTCHA token, auth state, or Supabase identifier was sent.
- Vercel Analytics and Speed Insights were coupled to granted Google/Clarity consent through the previous manager.
- CSP already allows only the required Google, Clarity, Vercel, Supabase and conditional hCaptcha origins. Production excludes `unsafe-eval` and keeps `script-src-attr 'none'`.
- `/api/auth/logout` exports POST only; the admin UI uses a POST form.

## Likely cause of the 0% diagnostic

The code did not grant by default, which is correct. The strongest implementation risks were the environment-variable name mismatch and the old consent/page-view coupling. Even after correction, GTM diagnostics may continue to show historical denied-only traffic when traffic is low, recent visitors rejected, or Google processing is delayed. Only Tag Assistant can prove the live container receives the update and its event tags honor `analytics_storage`.

## Consolidation decision

There was one UI but consent responsibilities were spread across the layout, manager and Data Layer utility. They are now consolidated around a versioned model, one provider, one bootstrap, one GTM loader, one page-view tracker, one typed event module and one Clarity loader.

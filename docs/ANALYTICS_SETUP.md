# Analytics Setup

Analytics run only when `VERCEL_ENV === "production"` and the current route is public. `/admin` and `/auth` are always excluded.

- Vercel Web Analytics via `@vercel/analytics/next`
- Vercel Speed Insights via `@vercel/speed-insights/next`
- Google Analytics and custom events via Google Tag Manager
- Microsoft Clarity via `@microsoft/clarity`

Set `NEXT_PUBLIC_GTM_CONTAINER_ID` and `NEXT_PUBLIC_CLARITY_PROJECT_ID` in the Vercel Production environment. There are no hardcoded fallback IDs: a missing variable disables its integration. Preview and Development deployments do not collect analytics even when variables exist.

GA4 must be configured inside GTM. Do not add a direct `gtag.js` script to the application. Clarity remains managed by its NPM package and must not be duplicated in GTM.

All integrations are gated by the visitor's analytics consent. Custom events must use the typed `pushAnalyticsEvent()` helper from `lib/analytics/data-layer.ts`; never send visitor-entered text to the Data Layer.

After deployment, enable Web Analytics and Speed Insights in the Vercel project dashboard. The Content Security Policy permits Google Tag Manager, Google Analytics and Vercel vitals endpoints.

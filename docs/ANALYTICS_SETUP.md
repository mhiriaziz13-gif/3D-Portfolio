# Analytics Setup

The root layout renders each integration once:

- Vercel Web Analytics via `@vercel/analytics/next`
- Vercel Speed Insights via `@vercel/speed-insights/next`
- Google Analytics via `next/script`

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-W7WJF6YR9X` in Vercel for Production, Preview and Development as needed. The same value is present in `.env.example`, and the layout has this ID as its fallback.

After deployment, enable Web Analytics and Speed Insights in the Vercel project dashboard. The Content Security Policy permits Google Tag Manager, Google Analytics and Vercel vitals endpoints.
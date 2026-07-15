# Search-engine submission runbook

After release, verify the production property in Google Search Console using the environment-backed metadata token, submit `/sitemap.xml`, inspect key URLs, and request indexing only after important changes. Review Page Indexing, Core Web Vitals, Enhancements, branded/non-branded queries and crawl errors monthly.

In Bing Webmaster Tools, use the environment-backed verification value, submit the same sitemap, optionally import the verified Search Console property, inspect URLs/crawl errors and monitor links. Do not automate ownership verification.

IndexNow is not implemented: there is no real Insights publishing workflow and owner approval/key lifecycle is absent. Reassess only when canonical content create/update/delete events exist.

Preview and development deployments emit HTML noindex metadata, a global `X-Robots-Tag: noindex, nofollow, noarchive`, and a disallow-all robots file while keeping production canonicals. Vercel Deployment Protection should also remain enabled where available to reduce public preview exposure; it complements these crawler directives but does not replace them.

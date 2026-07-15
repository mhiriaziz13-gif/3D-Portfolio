# SEO measurement plan

Monthly reporting should cover organic sessions, engaged organic sessions, branded and non-branded impressions, clicks, CTR, cautiously interpreted average position, indexed pages, project landing-page traffic, CV view/download actions, contact conversions, referring domains, broken links and identifiable AI-referral traffic.

Approved event names: `project_detail_view`, `resume_page_view`, `cv_pdf_view`, `cv_download`, `outbound_linkedin_click`, `outbound_github_click`, `contact_form_success`, `project_contact_cta`, and `insight_view` only after Insights launches. Never send names, emails, messages, CAPTCHA tokens, Supabase IDs, auth state or private CMS information. Baseline and consent/privacy review are required before enabling additional client events.

Implementation status after the second pass: these events remain documented but are not emitted. The existing analytics loader is deliberately deferred, and adding route-view and link instrumentation would introduce additional client hydration or a broader tracking utility. `contact_form_success` could reuse the existing client form, but it is deferred with the rest so consent, provider behavior and naming are reviewed as one release. No report should claim these events are live.

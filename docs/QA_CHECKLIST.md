# QA Checklist

## Automated

- [ ] `npm install`
- [ ] `npm run type-check`
- [ ] `npm run build`
- [ ] `npm run lint`

## Public QA

- [ ] `/` renders hero, about, skills, projects, experience, CV preview and contact.
- [ ] `/about` renders About with avatar.
- [ ] `/projects` renders project cards.
- [ ] `/projects/[slug]` renders project detail.
- [ ] `/experience` renders timeline and company logos.
- [ ] `/resume` renders PDF/DOCX links and disables missing files.
- [ ] `/contact` submits to `/api/contact`.
- [ ] Public site works without Supabase env by using fallback content.
- [ ] No old-owner names, domains, thumbnails or broken image paths are visible.

## CMS QA

- [ ] `/admin/login` loads.
- [ ] `/admin` is protected server-side.
- [ ] Admin can edit profile JSON and save.
- [ ] Admin can edit hero JSON and save.
- [ ] Admin can edit about JSON and save.
- [ ] Admin can add/edit/delete skill.
- [ ] Admin can add/edit/delete project.
- [ ] Admin can add/edit/delete experience.
- [ ] Admin can add/edit/delete resume.
- [ ] Admin can upload image.
- [ ] Admin can upload CV.
- [ ] Admin can view contact messages.
- [ ] Admin can logout.

## Auth QA

- [ ] Email/password login works.
- [ ] Wrong password is rejected generically.
- [ ] Non-admin user is rejected and signed out.
- [ ] GitHub login works when provider is configured.
- [ ] Non-admin GitHub user is rejected.
- [ ] MFA enrollment works.
- [ ] TOTP verification works.
- [ ] Wrong TOTP is rejected.
- [ ] Remember device works for 10 days.
- [ ] Revoke remembered device works.
- [ ] Forgot password sends recovery.
- [ ] Reset password works.
- [ ] Remembered devices are revoked after password reset.
- [ ] Safe redirects work.
- [ ] Open redirects are blocked.

## Security QA

- [ ] Service role key is not exposed to the browser.
- [ ] RLS is enabled on all tables.
- [ ] Public users cannot read unpublished content.
- [ ] Public users cannot read admin tables.
- [ ] Public users cannot update CMS tables.
- [ ] Uploads reject unsupported files.
- [ ] SVG uploads are rejected.
- [ ] Contact rate limits work.
- [ ] Auth rate limits work.
- [ ] No secrets appear in logs.
- [ ] TOTP-only login is not available.
- [ ] GitHub does not auto-create admin access.
- [ ] Old domains are not hardcoded.
## CMS and Analytics Refinement

- [ ] Admin dashboard contains no raw JSON editor.
- [ ] Prefilled Profile, Hero and About forms load.
- [ ] Skills, Projects, Experience, Education, Certifications, Resumes and Social Links support CRUD.
- [ ] Google certificate opens the supplied Drive credential URL.
- [ ] GitHub callback rejects users absent from `public.admins`.
- [ ] Recovery email reaches `/admin/reset-password` and remembered devices are revoked.
- [ ] TOTP enrollment, verification, required-login challenge and revocation work.
- [ ] LinkedIn icon is visible in the footer.
- [ ] Vercel Analytics, Speed Insights and one GA tag appear in production.
# Design Mix Implementation

## Technical Base

The public portfolio uses `space-portfolio` as the technical base. The app keeps Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber, Drei, and the space background direction.

## Section Sources

- About: based on the `space-portfolio` glass, gradient, motion and space visual language.
- Skills: based on the `space-portfolio` skills section structure, with text-based glass skill pills to avoid broken logos.
- Projects: based on the `space-portfolio` project card direction, with Ahmed's project names, descriptions and tags.
- Work Experience: visually adapted from `reactjs18-3d-portfolio` using a vertical timeline, animated dark cards, dates and company initials.
- Contact: visually adapted from `reactjs18-3d-portfolio` using a dark animated contact form and Earth canvas.

## Ahmed Branding

All public portfolio content has been rewritten for Ahmed Aziz Mhiri:

- Positioning: Data-Driven Marketing & Commercial Analytics.
- Tagline: Turning Data into Commercial Growth.
- Profile axis: data, business intelligence, marketing analytics and automation.
- Contact: Sousse, Tunisia, `mhiriaziz13@gmail.com`, and LinkedIn profile.
- Projects, skills and experience now reflect Ahmed's analytics, digital marketing, automation and BI background.

## Dynamic Title

The rotating role line is implemented in `components/sub/dynamic-title.tsx` and used by `components/sub/hero-content.tsx`. It respects reduced-motion preferences by rendering a stable title when reduced motion is enabled.

## Avatar

No local avatar image was available. The About section uses a safe initials-based avatar placeholder in `components/sub/avatar-card.tsx`, configured from `profile.initials` in `constants/portfolio.ts`.

## CV Files

CV download paths are configured in `constants/portfolio.ts`. Expected files should be placed in `public/cv`:

- `Ahmed_Aziz_Mhiri_CV_English.pdf`
- `Ahmed_Aziz_Mhiri_CV_English.docx`
- `Ahmed_Aziz_Mhiri_CV_Francais.pdf`
- `Ahmed_Aziz_Mhiri_CV_Francais.docx`
- `Ahmed_Aziz_Mhiri_CV_ATS.pdf`
- `Ahmed_Aziz_Mhiri_CV_ATS.docx`
- `Ahmed_Aziz_Mhiri_CV_Canada.pdf`
- `Ahmed_Aziz_Mhiri_CV_Canada.docx`

The current UI keeps download buttons disabled because these files are not present yet.

## Test Results

- `npm install`: passed. npm reported 8 audit vulnerabilities from the template dependency set.
- `npm run type-check`: passed.
- `npm run build`: passed. The sandboxed build hit a Windows worker `spawn EPERM`, then passed when run with normal worker spawning permission.
- `npm run lint`: passed.

## Remaining Placeholders

- CV PDF/DOCX files are not present yet.
- About uses an initials avatar placeholder until Ahmed provides a real local avatar image.
- Project images are neutral visual placeholders from the base template and are labeled as placeholders in the UI.

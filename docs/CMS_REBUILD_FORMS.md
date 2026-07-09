# CMS Forms

The admin dashboard at `/admin` uses prefilled content forms. Raw JSON editing is not part of the CMS workflow.

## Sections

- Overview
- Profile
- Hero
- About
- Skills
- Projects and project sections
- Experience
- Education
- Certifications
- Resumes
- Social links
- Contact messages
- Uploads
- Security (linked page)

Each content manager supports named fields and create, edit and delete actions. Lists such as skills, tags, achievements and dynamic titles are entered one item per line. Mutations are validated with a table-specific Zod schema and require an authenticated `public.admins` user with the configured MFA policy satisfied.

## Initial content

Run `supabase/seed_ahmed_portfolio.sql` in the Supabase SQL editor after migrations. It is idempotent and includes Ahmed's profile, hero, about, skills, CV files, social links and Google certification. When CMS tables are empty, the forms are still prefilled from `data/fallback-portfolio.ts`.

## Certificate link

Open **Admin > Certifications**, edit **Fundamentals of Digital Marketing**, paste the credential URL and save. The current seed and fallback already use:

`https://drive.google.com/file/d/10v7Z86IzuUwwvhTYdKfZji24-2-K00JN/view`
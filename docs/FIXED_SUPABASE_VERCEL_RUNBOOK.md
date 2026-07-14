# Fixed Supabase / Vercel Runbook

This project revision fixes three broken flows:

1. CMS/front-end Supabase connection
2. GitHub OAuth login
3. Forgot/reset password callback handling
4. TOTP MFA setup/verify callback handling

## 1. Install and run locally

```powershell
cd "C:\Users\Client\Desktop\Portfolio"
npm config set registry https://registry.npmjs.org/
npm install
npm run type-check
npm run lint
npm run build
npm run dev
```

## 2. Vercel environment variables

Production values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_OR_SECRET_KEY

NEXT_PUBLIC_SITE_URL=https://ahmedaziz-portfolio.vercel.app
APP_URL=https://ahmedaziz-portfolio.vercel.app
ALLOWED_ORIGINS=https://ahmedaziz-portfolio.vercel.app,http://localhost:3000,http://127.0.0.1:3000

REQUIRE_ADMIN_MFA=false
ADMIN_MFA_REMEMBER_DAYS=10

NEXT_PUBLIC_GITHUB_USERNAME=mhiriaziz13-gif
GITHUB_TOKEN=
NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile
NEXT_PUBLIC_CAPTCHA_SITE_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-W7WJF6YR9X
```

Keep `REQUIRE_ADMIN_MFA=false` until `/admin/security` enrollment works.

The CAPTCHA site key is public. Keep the matching Turnstile secret only in Cloudflare and Supabase **Authentication > Bot and Abuse Protection**; do not add it to Vercel or the repository. Redeploy after changing either `NEXT_PUBLIC_CAPTCHA_*` value.

## 3. Supabase SQL

Because the old database mixed legacy and new column names, use this single clean reset file:

```text
supabase/00_CLEAN_RESET_AND_SEED.sql
```

Run it once in Supabase SQL Editor. Do not run the older seed after it. The file resets only the portfolio CMS tables in `public`; it does not delete `auth.users`.

After running it, verify counts:

```sql
select 'profile' as table_name, count(*) from public.profile
union all select 'hero', count(*) from public.hero
union all select 'about', count(*) from public.about
union all select 'skills', count(*) from public.skills
union all select 'projects', count(*) from public.projects
union all select 'experience', count(*) from public.experience
union all select 'education', count(*) from public.education
union all select 'certifications', count(*) from public.certifications
union all select 'resumes', count(*) from public.resumes
union all select 'social_links', count(*) from public.social_links
union all select 'admins', count(*) from public.admins;
```

Expected approximate result:

```text
profile          1
hero             1
about            1
skills           39
projects         5
experience       6
education        2
certifications   1
resumes          4
social_links     3
admins           0 or 1
```

If `admins = 0`, create the user in Supabase Auth first, then run:

```sql
insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'mhiriaziz13@gmail.com'
on conflict do nothing;
```

## 4. Supabase URL configuration

Supabase → Authentication → URL Configuration:

Site URL:

```text
https://ahmedaziz-portfolio.vercel.app
```

Redirect URLs:

```text
https://ahmedaziz-portfolio.vercel.app/auth/callback
https://ahmedaziz-portfolio.vercel.app/auth/callback/
https://ahmedaziz-portfolio.vercel.app/auth/callback?next=/admin
https://ahmedaziz-portfolio.vercel.app/auth/callback?next=/admin/reset-password
https://ahmedaziz-portfolio.vercel.app/admin/login
https://ahmedaziz-portfolio.vercel.app/admin/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/
http://localhost:3000/auth/callback?next=/admin
http://localhost:3000/auth/callback?next=/admin/reset-password
http://localhost:3000/admin/login
http://localhost:3000/admin/reset-password
```

## 5. Password reset

The code now sends reset emails with:

```text
APP_URL/auth/callback?next=/admin/reset-password
```

Supabase Email Template → Reset Password must keep:

```html
<a href="{{ .ConfirmationURL }}">Reset password</a>
```

Do not hardcode `/admin/reset-password` directly in the email template.

## 6. GitHub OAuth

GitHub Developer Settings → OAuth Apps:

Homepage URL:

```text
https://ahmedaziz-portfolio.vercel.app
```

Authorization callback URL:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Supabase → Authentication → Providers → GitHub:

- Enable GitHub
- Paste GitHub Client ID
- Paste GitHub Client Secret

The Login form now includes the Supabase JS client call:

```ts
supabase.auth.signInWithOAuth({
  provider: "github",
  options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
})
```

After the first GitHub login, check Supabase Auth Users. If GitHub creates a different `auth.users.id`, add that user ID to `public.admins`.

## 7. MFA / 2FA

Supabase → Authentication → Multi-Factor Authentication:

- TOTP must be enabled.

Workflow:

1. Keep `REQUIRE_ADMIN_MFA=false`.
2. Login with email/password.
3. Open `/admin/security`.
4. Click `Enroll authenticator`.
5. Scan QR code in Google Authenticator.
6. Enter the 6-digit code.
7. Click `Require MFA` only after successful verification.
8. Test logout/login again.
9. Only after everything works, optionally set `REQUIRE_ADMIN_MFA=true` and redeploy.

## 8. Redeploy

After environment variables change:

```text
Vercel → Deployments → Redeploy
```

Prefer a clean redeploy without old build cache if Vercel offers that option.

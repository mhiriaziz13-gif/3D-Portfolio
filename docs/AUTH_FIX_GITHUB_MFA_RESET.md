# GitHub, Password Reset and MFA

## GitHub OAuth

1. Create a GitHub OAuth App.
2. Set its callback URL to `https://PROJECT_REF.supabase.co/auth/v1/callback`.
3. Enable GitHub in Supabase **Authentication > Providers** and paste the Client ID and Client Secret.
4. Add these Supabase redirect URLs for local and production:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=/admin`
   - `http://localhost:3000/auth/callback?next=/admin/reset-password`
   - `https://ahmedaziz-portfolio.vercel.app/auth/callback`
   - `https://ahmedaziz-portfolio.vercel.app/auth/callback?next=/admin`
   - `https://ahmedaziz-portfolio.vercel.app/auth/callback?next=/admin/reset-password`
5. Add the exact GitHub-created Supabase Auth user UUID to `public.admins`. No admin is created automatically.

The app exchanges the OAuth code server-side, verifies `public.admins`, enforces the user's MFA preference and rejects unauthorized users.

## Password reset

Set the Supabase Site URL to the production URL and include all callback URLs above. Keep the recovery email link as:

```html
<a href="{{ .ConfirmationURL }}">Reset password</a>
```

The app requests recovery with `/auth/callback?next=/admin/reset-password`, validates a strong password, revokes remembered devices, signs out globally and returns to login.

## TOTP and remembered devices

Keep `REQUIRE_ADMIN_MFA=false` during initial setup. Sign in, open `/admin/security`, enroll Google Authenticator, scan the QR code and verify a six-digit code. Then enable the per-admin MFA requirement. Only after this succeeds should the global environment switch be considered.

Remembered devices last `ADMIN_MFA_REMEMBER_DAYS` (10 by default). The raw random token exists only in an HttpOnly SameSite cookie; Supabase stores its SHA-256 hash. Password reset and security controls can revoke devices.
## Troubleshooting the three common production errors

### `requested path is invalid` after a password-reset email

In Supabase **Authentication > URL Configuration**:

- Site URL: `https://ahmedaziz-portfolio.vercel.app`
- Redirect URLs:
  - `https://ahmedaziz-portfolio.vercel.app/auth/callback`
  - `https://ahmedaziz-portfolio.vercel.app/auth/callback**`
  - `http://localhost:3000/auth/callback**`

In Vercel Production variables, both `APP_URL` and `NEXT_PUBLIC_SITE_URL` must be `https://ahmedaziz-portfolio.vercel.app`. Redeploy after changing them. The application now builds reset redirects from the real request origin, so an accidentally stale `APP_URL` cannot send production recovery emails to localhost.

### `Could not enroll authenticator`

The application now clears stale unverified TOTP factors before creating a new enrollment. In Supabase Auth MFA settings, make sure TOTP enrollment and TOTP verification are enabled. Sign out, sign in with the first factor, then open `/admin/security?setup=mfa` and enroll again.

### `Unsupported provider: provider is not enabled`

In Supabase **Authentication > Sign In / Providers > GitHub**, enable GitHub and save the GitHub Client ID and Client Secret. The GitHub OAuth App callback must be:

`https://uxtbwzynksuxhvyajznr.supabase.co/auth/v1/callback`

Its homepage URL should be `https://ahmedaziz-portfolio.vercel.app`. The GitHub-created Supabase Auth user must also be present in `public.admins`.
## Required recovery email template

In Supabase **Authentication > Email Templates > Reset password**, use this link:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
```

Add these redirect URLs in **Authentication > URL Configuration**:

- `https://ahmedaziz-portfolio.vercel.app/auth/confirm`
- `http://localhost:3000/auth/confirm`

The `/auth/confirm` route verifies the recovery token server-side, creates the cookie session and redirects to `/admin/reset-password`. Request a new email after saving this template; existing messages keep their old link.

The recovery callback accepts both Supabase's default PKCE code response and the custom 	oken_hash template. This keeps existing/default recovery templates compatible.

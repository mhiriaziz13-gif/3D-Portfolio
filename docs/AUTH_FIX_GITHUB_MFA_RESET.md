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
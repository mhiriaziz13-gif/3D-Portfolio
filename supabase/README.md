# Supabase setup for this project

> **Production safety blocker (2026-07-14):** the live migration ledger is behind
> this repository. Do not run `supabase db push`, `supabase migration up`, CI/branch
> auto-migrations, or any command that applies every pending file. The pending
> `202607100001_clean_reset_and_seed.sql` migration drops and reseeds CMS tables.
> Reconcile migration history against live schema first. The reviewed July 2026
> Security Advisor hardening was applied and verified as remote version
> `20260714093312_security_advisor_hardening`; do not apply it again. See
> `docs/security-scan-remediation-2026-07.md`.

The reset instructions below are only for a brand-new/disposable database. They
must never be used on an existing production database, and the legacy reset/schema
files recreate pre-hardening function and Storage policies unless the dedicated
Security Advisor migration is subsequently reviewed and applied.

Use `00_CLEAN_RESET_AND_SEED.sql` only for a disposable database with old/broken
CMS tables or mixed column names.

Do **not** execute `seed_ahmed_portfolio.sql` after `00_CLEAN_RESET_AND_SEED.sql`, because the clean reset file already creates and seeds the CMS tables.

Recommended order:

1. Create / confirm the Supabase Auth user `mhiriaziz13@gmail.com`.
2. Run `00_CLEAN_RESET_AND_SEED.sql` once in Supabase SQL Editor.
3. If the final diagnostic shows `admins = 0`, run:

```sql
insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'mhiriaziz13@gmail.com'
on conflict do nothing;
```

4. Configure Auth Redirect URLs and GitHub provider as documented in `docs/FIXED_SUPABASE_VERCEL_RUNBOOK.md`.

# Supabase setup for this project

Use `00_CLEAN_RESET_AND_SEED.sql` if your database has old/broken CMS tables or mixed column names.

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

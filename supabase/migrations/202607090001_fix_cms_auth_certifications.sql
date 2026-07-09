-- Additive CMS/auth refinement. Safe for existing deployments.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

alter table if exists public.certifications add column if not exists credential_id text;
alter table if exists public.certifications add column if not exists image_url text;
alter table if exists public.certifications add column if not exists description text;
alter table if exists public.certifications add column if not exists tags text[] not null default '{}';
alter table if exists public.certifications enable row level security;
create index if not exists idx_certifications_published_sort on public.certifications(published, sort_order);
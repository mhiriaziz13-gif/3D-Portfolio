create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.profile (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  initials text,
  headline text,
  secondary_line text,
  tagline text,
  location text,
  email text,
  linkedin_url text,
  linkedin_label text,
  github_url text,
  github_label text,
  avatar_url text,
  availability text,
  short_bio text,
  about_text text,
  about_focus text[] default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  title text,
  subtitle text,
  tagline text,
  dynamic_titles text[] default '{}',
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.about (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text,
  highlights text[] default '{}',
  avatar_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  icon_key text,
  description text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type text,
  summary text,
  description text,
  cover_image_url text,
  placeholder_image_url text,
  tags text[] default '{}',
  tools text[] default '{}',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  body text,
  bullets text[] default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  location text,
  start_date text,
  end_date text,
  date_label text,
  icon_bg text,
  logo_url text,
  logo_alt text,
  points text[] default '{}',
  tools text[] default '{}',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text not null,
  start_date text,
  end_date text,
  status text,
  location text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuer text,
  date text,
  credential_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  variant text not null,
  pdf_url text,
  docx_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  icon_key text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  source text,
  user_agent_hash text,
  ip_hash text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  public_url text,
  mime_type text,
  size_bytes integer,
  original_name text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_security_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mfa_required boolean not null default false,
  remember_device_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_remembered_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  user_agent_hash text,
  ip_hash text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create or replace trigger set_profile_updated_at before update on public.profile for each row execute function public.set_updated_at();
create or replace trigger set_hero_updated_at before update on public.hero for each row execute function public.set_updated_at();
create or replace trigger set_about_updated_at before update on public.about for each row execute function public.set_updated_at();
create or replace trigger set_skills_updated_at before update on public.skills for each row execute function public.set_updated_at();
create or replace trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create or replace trigger set_project_sections_updated_at before update on public.project_sections for each row execute function public.set_updated_at();
create or replace trigger set_experience_updated_at before update on public.experience for each row execute function public.set_updated_at();
create or replace trigger set_education_updated_at before update on public.education for each row execute function public.set_updated_at();
create or replace trigger set_certifications_updated_at before update on public.certifications for each row execute function public.set_updated_at();
create or replace trigger set_resumes_updated_at before update on public.resumes for each row execute function public.set_updated_at();
create or replace trigger set_social_links_updated_at before update on public.social_links for each row execute function public.set_updated_at();
create or replace trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create or replace trigger set_admin_security_preferences_updated_at before update on public.admin_security_preferences for each row execute function public.set_updated_at();

alter table public.admins enable row level security;
alter table public.profile enable row level security;
alter table public.hero enable row level security;
alter table public.about enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.project_sections enable row level security;
alter table public.experience enable row level security;
alter table public.education enable row level security;
alter table public.certifications enable row level security;
alter table public.resumes enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.uploads enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_security_preferences enable row level security;
alter table public.admin_remembered_devices enable row level security;

create policy "Admins can read admins" on public.admins for select to authenticated using (public.is_admin());
create policy "Admins can manage admins" on public.admins for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Published profile is readable" on public.profile for select to anon, authenticated using (published = true);
create policy "Published hero is readable" on public.hero for select to anon, authenticated using (published = true);
create policy "Published about is readable" on public.about for select to anon, authenticated using (published = true);
create policy "Published skills are readable" on public.skills for select to anon, authenticated using (published = true);
create policy "Published projects are readable" on public.projects for select to anon, authenticated using (published = true);
create policy "Published project sections are readable" on public.project_sections for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and p.published = true)
);
create policy "Published experience is readable" on public.experience for select to anon, authenticated using (published = true);
create policy "Published education is readable" on public.education for select to anon, authenticated using (published = true);
create policy "Published certifications are readable" on public.certifications for select to anon, authenticated using (published = true);
create policy "Published resumes are readable" on public.resumes for select to anon, authenticated using (published = true);
create policy "Published social links are readable" on public.social_links for select to anon, authenticated using (published = true);
create policy "Public site settings are readable" on public.site_settings for select to anon, authenticated using (coalesce((value->>'public')::boolean, false) = true);

create policy "Admins manage profile" on public.profile for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage hero" on public.hero for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage about" on public.about for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage skills" on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage projects" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage project sections" on public.project_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage experience" on public.experience for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage education" on public.education for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage certifications" on public.certifications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage resumes" on public.resumes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage social links" on public.social_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage site settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read contact messages" on public.contact_messages for select to authenticated using (public.is_admin());
create policy "Admins update contact messages" on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage uploads" on public.uploads for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read audit logs" on public.admin_audit_logs for select to authenticated using (public.is_admin());
create policy "Admins insert audit logs" on public.admin_audit_logs for insert to authenticated with check (public.is_admin());
create policy "Admins read own security preferences" on public.admin_security_preferences for select to authenticated using (user_id = auth.uid() and public.is_admin());
create policy "Admins manage own security preferences" on public.admin_security_preferences for all to authenticated using (user_id = auth.uid() and public.is_admin()) with check (user_id = auth.uid() and public.is_admin());
create policy "Admins read own remembered devices" on public.admin_remembered_devices for select to authenticated using (user_id = auth.uid() and public.is_admin());
create policy "Admins revoke own remembered devices" on public.admin_remembered_devices for update to authenticated using (user_id = auth.uid() and public.is_admin()) with check (user_id = auth.uid() and public.is_admin());

create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_published_sort on public.projects(published, sort_order);
create index if not exists idx_project_sections_project_order on public.project_sections(project_id, sort_order);
create index if not exists idx_skills_category_order on public.skills(category, sort_order);
create index if not exists idx_experience_published_order on public.experience(published, sort_order);
create index if not exists idx_experience_date on public.experience(start_date, end_date);
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_remembered_devices_user_active on public.admin_remembered_devices(user_id, expires_at) where revoked_at is null;
create index if not exists idx_resumes_published_order on public.resumes(published, sort_order);
create index if not exists idx_social_links_published_order on public.social_links(published, sort_order);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('project-images', 'project-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('resumes', 'resumes', true, 10485760, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('uploads', 'uploads', false, 10485760, array['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "Public can read public portfolio storage" on storage.objects for select to anon, authenticated using (
  bucket_id in ('public-assets', 'project-images', 'resumes')
);

create policy "Admins manage portfolio storage" on storage.objects for all to authenticated using (
  public.is_admin() and bucket_id in ('public-assets', 'project-images', 'resumes', 'uploads')
) with check (
  public.is_admin() and bucket_id in ('public-assets', 'project-images', 'resumes', 'uploads')
);
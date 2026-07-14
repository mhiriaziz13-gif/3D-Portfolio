-- Optimize the existing qfl RLS policies without changing authorization.
--
-- Current semantics preserved:
--   anon                -> published public content only
--   authenticated       -> published content; no CMS mutations unless admin
--   authenticated admin -> all CMS content and CMS mutations
--   service_role        -> unchanged BYPASSRLS behavior
--
-- This migration intentionally changes policies only. It does not alter tables,
-- rows, grants, the admin helper, storage, Auth, or Realtime configuration.
--
-- IMPORTANT: qfl's remote migration ledger is divergent from this local folder.
-- Do not run `supabase db push` until `supabase migration list` has been reviewed
-- and reconciled. Apply this file only through an explicitly reviewed workflow.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $migration_preflight$
declare
  v_drift text;
begin
  -- The secured helper must still be the exact class of function this migration
  -- was reviewed against.
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'is_admin'
      and p.pronargs = 0
      and p.prosecdef
      and p.provolatile = 's'
      and coalesce(p.proconfig, '{}'::text[])
            @> array['search_path=""']::text[]
      and pg_get_function_result(p.oid) = 'boolean'
      and pg_get_functiondef(p.oid) like
            '%from public.admins a where a.user_id = auth.uid()%'
  ) then
    raise exception
      'RLS optimization aborted: private.is_admin() definition drifted';
  end if;

  if not has_schema_privilege('authenticated', 'private', 'USAGE')
     or not has_function_privilege(
       'authenticated',
       'private.is_admin()',
       'EXECUTE'
     )
     or has_function_privilege('anon', 'private.is_admin()', 'EXECUTE')
     or has_function_privilege(
       'service_role',
       'private.is_admin()',
       'EXECUTE'
     )
  then
    raise exception
      'RLS optimization aborted: private.is_admin() grants drifted';
  end if;

  -- An authenticated request must not inherit policies granted only to anon.
  if pg_has_role('authenticated', 'anon', 'MEMBER') then
    raise exception
      'RLS optimization aborted: authenticated unexpectedly inherits anon';
  end if;

  -- Every affected relation must continue to exist with RLS enabled.
  with expected(table_name) as (
    values
      ('about'),
      ('admin_remembered_devices'),
      ('admin_security_preferences'),
      ('admins'),
      ('certifications'),
      ('education'),
      ('experience'),
      ('hero'),
      ('profile'),
      ('project_sections'),
      ('projects'),
      ('resumes'),
      ('skills'),
      ('social_links')
  )
  select string_agg(e.table_name, ', ' order by e.table_name)
  into v_drift
  from expected e
  left join pg_namespace n
    on n.nspname = 'public'
  left join pg_class c
    on c.relnamespace = n.oid
   and c.relname = e.table_name
   and c.relkind in ('r', 'p')
  where c.oid is null
     or not c.relrowsecurity;

  if v_drift is not null then
    raise exception
      'RLS optimization aborted: missing/RLS-disabled tables: %',
      v_drift;
  end if;

  -- Verify the eleven public-content tables still have exactly the two
  -- policies observed during the live audit.
  with expected(
    table_name,
    manage_policy,
    read_policy
  ) as (
    values
      (
        'about',
        'Admins manage about',
        'Published about is readable'
      ),
      (
        'certifications',
        'Admins manage certifications',
        'Published certifications are readable'
      ),
      (
        'education',
        'Admins manage education',
        'Published education is readable'
      ),
      (
        'experience',
        'Admins manage experience',
        'Published experience is readable'
      ),
      (
        'hero',
        'Admins manage hero',
        'Published hero is readable'
      ),
      (
        'profile',
        'Admins manage profile',
        'Published profile is readable'
      ),
      (
        'project_sections',
        'Admins manage project sections',
        'Published project sections are readable'
      ),
      (
        'projects',
        'Admins manage projects',
        'Published projects are readable'
      ),
      (
        'resumes',
        'Admins manage resumes',
        'Published resumes are readable'
      ),
      (
        'skills',
        'Admins manage skills',
        'Published skills are readable'
      ),
      (
        'social_links',
        'Admins manage social links',
        'Published social links are readable'
      )
  )
  select string_agg(e.table_name, ', ' order by e.table_name)
  into v_drift
  from expected e
  where (
    select count(*)
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename::text = e.table_name
  ) <> 2
  or not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename::text = e.table_name
      and p.policyname::text = e.manage_policy
      and p.permissive = 'PERMISSIVE'
      and p.cmd = 'ALL'
      and cardinality(p.roles) = 1
      and p.roles @> array['authenticated']::name[]
      and p.qual = 'private.is_admin()'
      and p.with_check = 'private.is_admin()'
  )
  or not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename::text = e.table_name
      and p.policyname::text = e.read_policy
      and p.permissive = 'PERMISSIVE'
      and p.cmd = 'SELECT'
      and cardinality(p.roles) = 2
      and p.roles @> array['anon', 'authenticated']::name[]
      and p.with_check is null
      and (
        (
          e.table_name <> 'project_sections'
          and p.qual = '(published = true)'
        )
        or (
          e.table_name = 'project_sections'
          and regexp_replace(
            p.qual,
            '[[:space:]]+',
            '',
            'g'
          ) =
          '(EXISTS(SELECT1FROMprojectspWHERE((p.id=project_sections.project_id)AND(p.published=true))))'
        )
      )
  );

  if v_drift is not null then
    raise exception
      'RLS optimization aborted: public-content policy drift on: %',
      v_drift;
  end if;

  -- Verify the exact ownership-policy baseline.
  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_security_preferences'
  ) <> 2
  or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_security_preferences'
      and policyname = 'Admins manage own security preferences'
      and permissive = 'PERMISSIVE'
      and cmd = 'ALL'
      and roles = array['authenticated']::name[]
      and regexp_replace(
        coalesce(qual, ''),
        '[[:space:]]+',
        '',
        'g'
      ) = '((user_id=auth.uid())ANDprivate.is_admin())'
      and regexp_replace(
        coalesce(with_check, ''),
        '[[:space:]]+',
        '',
        'g'
      ) = '((user_id=auth.uid())ANDprivate.is_admin())'
  )
  or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_security_preferences'
      and policyname = 'Admins read own security preferences'
      and permissive = 'PERMISSIVE'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and regexp_replace(
        coalesce(qual, ''),
        '[[:space:]]+',
        '',
        'g'
      ) = '((user_id=auth.uid())ANDprivate.is_admin())'
      and with_check is null
  )
  then
    raise exception
      'RLS optimization aborted: admin_security_preferences policy drift';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_remembered_devices'
  ) <> 2
  or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_remembered_devices'
      and policyname = 'Admins read own remembered devices'
      and permissive = 'PERMISSIVE'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and regexp_replace(
        coalesce(qual, ''),
        '[[:space:]]+',
        '',
        'g'
      ) = '((user_id=auth.uid())ANDprivate.is_admin())'
      and with_check is null
  )
  or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_remembered_devices'
      and policyname = 'Admins revoke own remembered devices'
      and permissive = 'PERMISSIVE'
      and cmd = 'UPDATE'
      and roles = array['authenticated']::name[]
      and regexp_replace(
        coalesce(qual, ''),
        '[[:space:]]+',
        '',
        'g'
      ) = '((user_id=auth.uid())ANDprivate.is_admin())'
      and regexp_replace(
        coalesce(with_check, ''),
        '[[:space:]]+',
        '',
        'g'
      ) = '((user_id=auth.uid())ANDprivate.is_admin())'
  )
  then
    raise exception
      'RLS optimization aborted: admin_remembered_devices policy drift';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admins'
  ) <> 2
  or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admins'
      and policyname = 'Admins can manage admins'
      and permissive = 'PERMISSIVE'
      and cmd = 'ALL'
      and roles = array['authenticated']::name[]
      and qual = 'private.is_admin()'
      and with_check = 'private.is_admin()'
  )
  or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admins'
      and policyname = 'Admins can read admins'
      and permissive = 'PERMISSIVE'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual = 'private.is_admin()'
      and with_check is null
  )
  then
    raise exception
      'RLS optimization aborted: admins policy drift';
  end if;
end;
$migration_preflight$;

-- Ownership tables: remove only logically redundant SELECT policies and
-- evaluate auth/helper functions once per statement.

alter policy "Admins manage own security preferences"
  on public.admin_security_preferences
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_admin())
  )
  with check (
    user_id = (select auth.uid())
    and (select private.is_admin())
  );

drop policy "Admins read own security preferences"
  on public.admin_security_preferences;

alter policy "Admins read own remembered devices"
  on public.admin_remembered_devices
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_admin())
  );

alter policy "Admins revoke own remembered devices"
  on public.admin_remembered_devices
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_admin())
  )
  with check (
    user_id = (select auth.uid())
    and (select private.is_admin())
  );

alter policy "Admins can manage admins"
  on public.admins
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy "Admins can read admins"
  on public.admins;

-- Public content:
--   existing published policy becomes anon-only;
--   authenticated SELECT combines published visibility and administrator access;
--   administrator mutations use separate command-specific policies.

-- about
alter policy "Published about is readable"
  on public.about
  to anon;

drop policy "Admins manage about"
  on public.about;

create policy "Authenticated read about"
  on public.about
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert about"
  on public.about
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update about"
  on public.about
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete about"
  on public.about
  for delete
  to authenticated
  using ((select private.is_admin()));

-- certifications
alter policy "Published certifications are readable"
  on public.certifications
  to anon;

drop policy "Admins manage certifications"
  on public.certifications;

create policy "Authenticated read certifications"
  on public.certifications
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert certifications"
  on public.certifications
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update certifications"
  on public.certifications
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete certifications"
  on public.certifications
  for delete
  to authenticated
  using ((select private.is_admin()));

-- education
alter policy "Published education is readable"
  on public.education
  to anon;

drop policy "Admins manage education"
  on public.education;

create policy "Authenticated read education"
  on public.education
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert education"
  on public.education
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update education"
  on public.education
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete education"
  on public.education
  for delete
  to authenticated
  using ((select private.is_admin()));

-- experience
alter policy "Published experience is readable"
  on public.experience
  to anon;

drop policy "Admins manage experience"
  on public.experience;

create policy "Authenticated read experience"
  on public.experience
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert experience"
  on public.experience
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update experience"
  on public.experience
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete experience"
  on public.experience
  for delete
  to authenticated
  using ((select private.is_admin()));

-- hero
alter policy "Published hero is readable"
  on public.hero
  to anon;

drop policy "Admins manage hero"
  on public.hero;

create policy "Authenticated read hero"
  on public.hero
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert hero"
  on public.hero
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update hero"
  on public.hero
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete hero"
  on public.hero
  for delete
  to authenticated
  using ((select private.is_admin()));

-- profile
alter policy "Published profile is readable"
  on public.profile
  to anon;

drop policy "Admins manage profile"
  on public.profile;

create policy "Authenticated read profile"
  on public.profile
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert profile"
  on public.profile
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update profile"
  on public.profile
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete profile"
  on public.profile
  for delete
  to authenticated
  using ((select private.is_admin()));

-- project_sections
alter policy "Published project sections are readable"
  on public.project_sections
  to anon;

drop policy "Admins manage project sections"
  on public.project_sections;

create policy "Authenticated read project sections"
  on public.project_sections
  for select
  to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.projects as p
      where p.id = project_sections.project_id
        and p.published = true
    )
  );

create policy "Admins insert project sections"
  on public.project_sections
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update project sections"
  on public.project_sections
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete project sections"
  on public.project_sections
  for delete
  to authenticated
  using ((select private.is_admin()));

-- projects
alter policy "Published projects are readable"
  on public.projects
  to anon;

drop policy "Admins manage projects"
  on public.projects;

create policy "Authenticated read projects"
  on public.projects
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert projects"
  on public.projects
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update projects"
  on public.projects
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete projects"
  on public.projects
  for delete
  to authenticated
  using ((select private.is_admin()));

-- resumes
alter policy "Published resumes are readable"
  on public.resumes
  to anon;

drop policy "Admins manage resumes"
  on public.resumes;

create policy "Authenticated read resumes"
  on public.resumes
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert resumes"
  on public.resumes
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update resumes"
  on public.resumes
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete resumes"
  on public.resumes
  for delete
  to authenticated
  using ((select private.is_admin()));

-- skills
alter policy "Published skills are readable"
  on public.skills
  to anon;

drop policy "Admins manage skills"
  on public.skills;

create policy "Authenticated read skills"
  on public.skills
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert skills"
  on public.skills
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update skills"
  on public.skills
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete skills"
  on public.skills
  for delete
  to authenticated
  using ((select private.is_admin()));

-- social_links
alter policy "Published social links are readable"
  on public.social_links
  to anon;

drop policy "Admins manage social links"
  on public.social_links;

create policy "Authenticated read social links"
  on public.social_links
  for select
  to authenticated
  using ((published = true) or (select private.is_admin()));

create policy "Admins insert social links"
  on public.social_links
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update social links"
  on public.social_links
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete social links"
  on public.social_links
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Refuse to commit if the resulting affected-policy set still contains two
-- permissive policies for the same explicit role and command.
do $migration_postflight$
declare
  v_duplicates text;
begin
  with expanded as (
    select
      p.tablename::text as table_name,
      r.role_name::text as role_name,
      a.action,
      p.policyname::text as policy_name
    from pg_policies p
    cross join lateral unnest(p.roles) as r(role_name)
    cross join lateral unnest(
      case p.cmd
        when 'ALL'
          then array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]
        else array[p.cmd]::text[]
      end
    ) as a(action)
    where p.schemaname = 'public'
      and p.permissive = 'PERMISSIVE'
      and p.tablename = any (
        array[
          'about',
          'admin_remembered_devices',
          'admin_security_preferences',
          'admins',
          'certifications',
          'education',
          'experience',
          'hero',
          'profile',
          'project_sections',
          'projects',
          'resumes',
          'skills',
          'social_links'
        ]::name[]
      )
  ),
  duplicates as (
    select
      table_name,
      role_name,
      action,
      count(*) as policy_count,
      array_agg(policy_name order by policy_name) as policies
    from expanded
    group by table_name, role_name, action
    having count(*) > 1
  )
  select string_agg(
    format(
      '%s role=%s action=%s policies=%s',
      table_name,
      role_name,
      action,
      policies
    ),
    '; '
    order by table_name, role_name, action
  )
  into v_duplicates
  from duplicates;

  if v_duplicates is not null then
    raise exception
      'RLS optimization postflight found duplicate permissive policies: %',
      v_duplicates;
  end if;
end;
$migration_postflight$;

commit;

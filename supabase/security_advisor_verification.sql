-- Read-only post-migration verification for 20260714093312_security_advisor_hardening.sql.
-- Run this in the Supabase SQL Editor only after reviewing and applying the migration.
begin;
set transaction read only;

-- Function location, owner, security mode, pinned configuration, and exact body.
select
  n.nspname as function_schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  p.proconfig as function_config,
  pg_get_functiondef(p.oid) as definition
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where (n.nspname, p.proname) in (
  ('public', 'set_updated_at'),
  ('public', 'is_admin'),
  ('private', 'is_admin')
)
order by n.nspname, p.proname;

-- Machine-readable hardening summary. Every column should return true after the
-- migration, except behavioral tests that are deliberately listed separately in
-- the remediation report.
select
  to_regprocedure('public.is_admin()') is null as public_is_admin_absent,
  exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'is_admin'
      and pg_get_function_identity_arguments(p.oid) = ''
      and p.prosecdef
      and pg_get_userbyid(p.proowner) = 'postgres'
      and 'search_path=""' = any(coalesce(p.proconfig, array[]::text[]))
  ) as private_is_admin_hardened,
  exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
      and pg_get_function_identity_arguments(p.oid) = ''
      and 'search_path=pg_catalog' = any(coalesce(p.proconfig, array[]::text[]))
  ) as set_updated_at_path_pinned,
  not coalesce(
    has_function_privilege('anon', to_regprocedure('private.is_admin()'), 'execute'),
    false
  ) as anon_cannot_execute_private_is_admin,
  coalesce(
    has_function_privilege('authenticated', to_regprocedure('private.is_admin()'), 'execute'),
    false
  ) as authenticated_can_execute_private_is_admin,
  not coalesce(
    has_function_privilege('service_role', to_regprocedure('private.is_admin()'), 'execute'),
    false
  ) as service_role_cannot_execute_private_is_admin,
  not exists (
    select 1
    from pg_policies
    where coalesce(qual, '') ilike '%public.is_admin%'
       or coalesce(with_check, '') ilike '%public.is_admin%'
  ) as no_policy_references_public_is_admin,
  exists (
    select 1
    from pg_policies
    where coalesce(qual, '') ilike '%private.is_admin%'
       or coalesce(with_check, '') ilike '%private.is_admin%'
  ) as policies_reference_private_is_admin,
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Public can read portfolio assets',
        'Public can read public portfolio storage'
      )
  ) as broad_storage_listing_policies_absent;

-- Effective function execution privileges. public.is_admin should return no row;
-- private.is_admin should be false/true/false for anon/authenticated/service_role.
select
  n.nspname as function_schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_can_execute
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where p.proname in ('is_admin', 'set_updated_at')
  and n.nspname in ('public', 'private')
order by n.nspname, p.proname;

-- Raw function ACLs, including grants inherited through PUBLIC.
select
  n.nspname as function_schema,
  p.proname as function_name,
  case
    when acl.grantee = 0 then 'PUBLIC'
    else pg_get_userbyid(acl.grantee)
  end as grantee,
  acl.privilege_type,
  acl.is_grantable
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
cross join lateral aclexplode(
  coalesce(p.proacl, acldefault('f'::"char", p.proowner))
) as acl
where p.proname in ('is_admin', 'set_updated_at')
  and n.nspname in ('public', 'private')
order by n.nspname, p.proname, grantee, acl.privilege_type;

-- The authenticated role needs private-schema USAGE for RLS evaluation; anon does not.
select
  n.nspname as schema_name,
  has_schema_privilege('anon', n.oid, 'usage') as anon_has_usage,
  has_schema_privilege('authenticated', n.oid, 'usage') as authenticated_has_usage,
  has_schema_privilege('service_role', n.oid, 'usage') as service_role_has_usage
from pg_namespace as n
where n.nspname = 'private';

-- Every RLS dependency should now deparse as private.is_admin(), with the original
-- commands, roles, USING clauses, and WITH CHECK clauses otherwise unchanged.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where coalesce(qual, '') ilike '%is_admin%'
   or coalesce(with_check, '') ilike '%is_admin%'
order by schemaname, tablename, policyname;

-- Direct catalog dependencies from policies to the moved helper.
select
  policy_namespace.nspname as policy_schema,
  policy_table.relname as policy_table,
  policy.polname as policy_name,
  function_namespace.nspname as function_schema,
  function_proc.proname as function_name
from pg_depend as dependency
join pg_policy as policy
  on dependency.classid = 'pg_policy'::regclass
 and dependency.objid = policy.oid
join pg_class as policy_table on policy_table.oid = policy.polrelid
join pg_namespace as policy_namespace on policy_namespace.oid = policy_table.relnamespace
join pg_proc as function_proc
  on dependency.refclassid = 'pg_proc'::regclass
 and dependency.refobjid = function_proc.oid
join pg_namespace as function_namespace on function_namespace.oid = function_proc.pronamespace
where function_proc.proname = 'is_admin'
  and function_namespace.nspname = 'private'
order by policy_namespace.nspname, policy_table.relname, policy.polname;

-- Inspect all storage.object policies. The two broad public-listing policy names
-- removed by the migration should be absent; the admin policy should remain.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- Bucket visibility is intentionally unchanged. Known public object URLs continue
-- to work even though anonymous storage.objects enumeration policies are removed.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id in ('portfolio-assets', 'public-assets', 'project-images', 'resumes', 'uploads')
order by id;

-- Trigger bindings should still point to the same public.set_updated_at() object.
-- The expected inventory also exposes pre-existing missing-trigger drift instead
-- of silently omitting missing bindings.
with expected(table_name, trigger_name) as (
  values
    ('profile', 'set_profile_updated_at'),
    ('hero', 'set_hero_updated_at'),
    ('about', 'set_about_updated_at'),
    ('skills', 'set_skills_updated_at'),
    ('projects', 'set_projects_updated_at'),
    ('project_sections', 'set_project_sections_updated_at'),
    ('experience', 'set_experience_updated_at'),
    ('education', 'set_education_updated_at'),
    ('certifications', 'set_certifications_updated_at'),
    ('resumes', 'set_resumes_updated_at'),
    ('social_links', 'set_social_links_updated_at'),
    ('site_settings', 'set_site_settings_updated_at'),
    ('admin_security_preferences', 'set_admin_security_preferences_updated_at'),
    ('contact_messages', 'set_contact_messages_updated_at')
)
select
  expected.table_name,
  expected.trigger_name,
  trigger_row.oid is not null
    and table_namespace.nspname = 'public'
    and function_namespace.nspname = 'public'
    and function_proc.proname = 'set_updated_at' as correctly_bound
from expected
left join pg_namespace as table_namespace
  on table_namespace.nspname = 'public'
left join pg_class as table_relation
  on table_relation.relnamespace = table_namespace.oid
 and table_relation.relname = expected.table_name
left join pg_trigger as trigger_row
  on trigger_row.tgrelid = table_relation.oid
 and trigger_row.tgname = expected.trigger_name
 and not trigger_row.tgisinternal
left join pg_proc as function_proc on function_proc.oid = trigger_row.tgfoid
left join pg_namespace as function_namespace on function_namespace.oid = function_proc.pronamespace
order by expected.table_name;

-- Full actual binding inventory for diagnosis.
select
  table_namespace.nspname as table_schema,
  table_relation.relname as table_name,
  trigger_row.tgname as trigger_name,
  function_namespace.nspname as function_schema,
  function_proc.proname as function_name
from pg_trigger as trigger_row
join pg_class as table_relation on table_relation.oid = trigger_row.tgrelid
join pg_namespace as table_namespace on table_namespace.oid = table_relation.relnamespace
join pg_proc as function_proc on function_proc.oid = trigger_row.tgfoid
join pg_namespace as function_namespace on function_namespace.oid = function_proc.pronamespace
where not trigger_row.tgisinternal
  and function_namespace.nspname = 'public'
  and function_proc.proname = 'set_updated_at'
order by table_namespace.nspname, table_relation.relname, trigger_row.tgname;

-- This may be null in a direct SQL session. Also verify in Dashboard > API that
-- private is not included in Exposed schemas before applying the migration.
select current_setting('pgrst.db_schemas', true) as postgrest_exposed_schemas;

rollback;

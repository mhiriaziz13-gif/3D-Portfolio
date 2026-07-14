-- Security Advisor hardening only. This migration does not modify application data.
--
-- Applied to production project qflchsmvszbesfnomdeo through the Supabase
-- migration API as version 20260714093312 on 2026-07-14.
--
-- LEGACY HISTORY WARNING: the production migration ledger remains behind older
-- repository files. Do not apply this migration directory with db push/migration
-- up; the exact hardening migration above has already been applied and verified.

-- This is intentionally a one-shot migration. Fail before changing anything when
-- the verified baseline is missing or the destination namespace already exists.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Expected function public.set_updated_at() is missing';
  end if;

  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Expected function public.is_admin() is missing';
  end if;

  if to_regnamespace('private') is not null then
    raise exception 'Schema private already exists; inspect it before applying this migration';
  end if;
end;
$$;

-- Pin the trigger helper to the system catalog so caller-controlled schemas cannot
-- shadow functions used by the trigger body.
alter function public.set_updated_at() set search_path = pg_catalog;

-- Keep authorization helpers outside the Data API's exposed public schema. Moving
-- the existing function preserves its object identity, so dependent RLS policies
-- retain their exact expressions and behavior.
create schema private authorization postgres;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;

alter function public.is_admin() set schema private;
alter function private.is_admin() owner to postgres;
alter function private.is_admin() set search_path = '';

revoke all on function private.is_admin() from public;
revoke all on function private.is_admin() from anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

-- These buckets are public, so known-object public URLs continue to work without
-- SELECT policies that also expose bucket enumeration through storage.objects.
drop policy if exists "Public can read portfolio assets" on storage.objects;
drop policy if exists "Public can read public portfolio storage" on storage.objects;

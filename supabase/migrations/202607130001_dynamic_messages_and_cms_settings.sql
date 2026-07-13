alter table public.contact_messages
  add column if not exists updated_at timestamptz default now(),
  add column if not exists read_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.contact_messages
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.contact_messages
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column status set default 'new';

update public.contact_messages
set status = case lower(trim(status))
  when 'new' then 'new'
  when 'read' then 'read'
  when 'archived' then 'archived'
  else 'new'
end
where status is distinct from case lower(trim(status))
  when 'new' then 'new'
  when 'read' then 'read'
  when 'archived' then 'archived'
  else 'new'
end;

alter table public.contact_messages
  alter column status set not null;

update public.contact_messages
set
  read_at = case
    when status = 'new' then null
    else coalesce(read_at, updated_at, created_at, now())
  end,
  archived_at = case
    when status = 'archived' then coalesce(archived_at, updated_at, created_at, now())
    else null
  end
where
  (status = 'new' and (read_at is not null or archived_at is not null))
  or (status = 'read' and (read_at is null or archived_at is not null))
  or (status = 'archived' and (read_at is null or archived_at is null));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_status_check'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_status_check
      check (status in ('new', 'read', 'archived'));
  end if;
end;
$$;

create or replace function public.set_contact_message_status_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'new' then
    new.read_at = null;
    new.archived_at = null;
  elsif new.status = 'read' then
    if tg_op = 'INSERT' then
      new.read_at = now();
    elsif old.status is distinct from new.status then
      new.read_at = now();
    else
      new.read_at = coalesce(new.read_at, now());
    end if;
    new.archived_at = null;
  elsif new.status = 'archived' then
    if tg_op = 'INSERT' then
      new.read_at = coalesce(new.read_at, now());
      new.archived_at = now();
    else
      new.read_at = coalesce(new.read_at, old.read_at, now());
      if old.status is distinct from new.status then
        new.archived_at = now();
      else
        new.archived_at = coalesce(new.archived_at, now());
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace trigger set_contact_message_status_timestamps
before insert or update of status on public.contact_messages
for each row execute function public.set_contact_message_status_timestamps();

create or replace trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create index if not exists idx_contact_messages_status_created_at
  on public.contact_messages(status, created_at desc);

grant select on table public.contact_messages to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contact_messages'
  ) then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end;
$$;

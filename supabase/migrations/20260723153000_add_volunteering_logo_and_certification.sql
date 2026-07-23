alter table public.volunteering
  add column if not exists logo_url text,
  add column if not exists logo_alt text,
  add column if not exists certification_id uuid
    references public.certifications(id) on delete set null;

create index if not exists volunteering_certification_id_idx
  on public.volunteering (certification_id);

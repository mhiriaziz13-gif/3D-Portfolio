-- Project detail content is managed exclusively through project_sections.
-- Add any missing standard case-study blocks without overwriting CMS content.
insert into public.project_sections (project_id, title, body, bullets, sort_order)
select
  project.id,
  template.title,
  '',
  '{}'::text[],
  template.sort_order
from public.projects as project
cross join (
  values
    ('Business and operational context', 10),
    ('The problem', 20),
    ('Ahmed''s contribution', 30),
    ('Approach', 40),
    ('Workflow or architecture', 50),
    ('Tools and technologies', 60),
    ('Deliverables', 70),
    ('Validation and safeguards', 80),
    ('Qualitative outcome', 90),
    ('What I learned', 100),
    ('Related expertise', 110),
    ('Related experience', 120)
) as template(title, sort_order)
where not exists (
  select 1
  from public.project_sections as existing
  where existing.project_id = project.id
    and lower(existing.title) = lower(template.title)
);

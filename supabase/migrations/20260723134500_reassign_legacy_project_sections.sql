with project_mapping(old_slug, new_slug) as (
  values
    ('rpa-invoice-control-booking-reconciliation', 'sunshine-rpa-commercial-rules-automation'),
    ('digital-transformation-mens-barbershop', 'chic-chac-digital-transformation'),
    ('ai-ready-elearning-platform', 'vermeg-ai-ready-e-learning-platform'),
    ('library-management-application', 'library-management-full-stack-application')
)
update public.project_sections section
set project_id = replacement.id,
    updated_at = now()
from project_mapping mapping
join public.projects legacy on legacy.slug = mapping.old_slug
join public.projects replacement on replacement.slug = mapping.new_slug
where section.project_id = legacy.id;

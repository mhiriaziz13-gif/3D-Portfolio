create index if not exists idx_page_section_items_section_order
  on public.page_section_items(page_section_id, is_visible, display_order);

create index if not exists idx_project_section_items_section_order
  on public.project_section_items(project_section_id, is_visible, display_order);

create index if not exists idx_project_media_project_order
  on public.project_media(project_id, is_visible, display_order);

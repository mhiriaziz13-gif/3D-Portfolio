-- Flexible, relational CMS content and approved portfolio positioning.
-- Idempotent and additive: existing records are updated by stable keys/slugs.

alter table public.projects add column if not exists status text not null default 'published';
alter table public.projects add column if not exists project_group text not null default 'Additional Projects';
alter table public.projects add column if not exists organisation text;
alter table public.projects add column if not exists demo_url text;
alter table public.projects add column if not exists case_study_url text;
alter table public.projects add column if not exists card_image_url text;
alter table public.projects add column if not exists open_graph_image text;
alter table public.projects add column if not exists seo_title text;
alter table public.projects add column if not exists seo_description text;
alter table public.projects add column if not exists home_featured_order integer;
alter table public.projects add column if not exists projects_page_order integer not null default 0;
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('draft','preparation','published','archived'));

alter table public.project_sections add column if not exists section_type text not null default 'rich_text';
alter table public.project_sections add column if not exists is_visible boolean not null default true;
alter table public.project_sections add column if not exists is_archived boolean not null default false;

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text not null,
  slug text not null unique,
  seo_title text,
  seo_description text,
  open_graph_title text,
  open_graph_description text,
  open_graph_image text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text,
  subtitle text,
  description text,
  cta_label text,
  cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_archived boolean not null default false,
  layout_variant text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id, section_key)
);

create table if not exists public.page_section_items (
  id uuid primary key default gen_random_uuid(),
  page_section_id uuid not null references public.page_sections(id) on delete cascade,
  title text,
  subtitle text,
  description text,
  link_label text,
  link_url text,
  media_url text,
  media_alt text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_section_items (
  id uuid primary key default gen_random_uuid(),
  project_section_id uuid not null references public.project_sections(id) on delete cascade,
  label text,
  value text,
  description text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_url text not null,
  alt_text text not null,
  caption text,
  media_type text not null default 'image',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.volunteering (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null unique,
  role text not null,
  organisation text not null,
  start_date text,
  end_date text,
  date_label text,
  domain text,
  summary text,
  description_items text[] not null default '{}',
  focus_areas text[] not null default '{}',
  sort_order integer not null default 0,
  published boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.pages add constraint pages_slug_check check (slug ~ '^/?[a-z0-9/-]*$');
exception when duplicate_object then null; end $$;

create index if not exists idx_page_sections_page_order on public.page_sections(page_id, is_visible, is_archived, display_order);
create index if not exists idx_projects_public_order on public.projects(status, published, projects_page_order);
create index if not exists idx_projects_home_featured on public.projects(featured, home_featured_order) where status = 'published' and published;
create index if not exists idx_volunteering_public_order on public.volunteering(published, archived, sort_order);

alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.page_section_items enable row level security;
alter table public.project_section_items enable row level security;
alter table public.project_media enable row level security;
alter table public.volunteering enable row level security;

grant select on public.pages, public.page_sections, public.page_section_items,
  public.project_section_items, public.project_media, public.volunteering to anon, authenticated;
grant insert, update, delete on public.pages, public.page_sections, public.page_section_items,
  public.project_section_items, public.project_media, public.volunteering to authenticated;

drop policy if exists "Published pages are readable" on public.pages;
create policy "Published pages are readable" on public.pages for select to anon, authenticated using (is_published);
drop policy if exists "Published page sections are readable" on public.page_sections;
create policy "Published page sections are readable" on public.page_sections for select to anon, authenticated using (
  is_visible and not is_archived and exists (select 1 from public.pages p where p.id = page_id and p.is_published)
);
drop policy if exists "Published page section items are readable" on public.page_section_items;
create policy "Published page section items are readable" on public.page_section_items for select to anon, authenticated using (
  is_visible and exists (select 1 from public.page_sections s join public.pages p on p.id=s.page_id
  where s.id=page_section_id and s.is_visible and not s.is_archived and p.is_published)
);
drop policy if exists "Published project section items are readable" on public.project_section_items;
create policy "Published project section items are readable" on public.project_section_items for select to anon, authenticated using (
  is_visible and exists (select 1 from public.project_sections s join public.projects p on p.id=s.project_id
  where s.id=project_section_id and s.is_visible and not s.is_archived and p.published and p.status='published')
);
drop policy if exists "Published project media are readable" on public.project_media;
create policy "Published project media are readable" on public.project_media for select to anon, authenticated using (
  is_visible and exists (select 1 from public.projects p where p.id=project_id and p.published and p.status='published')
);
drop policy if exists "Published volunteering is readable" on public.volunteering;
create policy "Published volunteering is readable" on public.volunteering for select to anon, authenticated using (published and not archived);

drop policy if exists "Admins manage pages" on public.pages;
create policy "Admins manage pages" on public.pages for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage page sections" on public.page_sections;
create policy "Admins manage page sections" on public.page_sections for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage page section items" on public.page_section_items;
create policy "Admins manage page section items" on public.page_section_items for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage project section items" on public.project_section_items;
create policy "Admins manage project section items" on public.project_section_items for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage project media" on public.project_media;
create policy "Admins manage project media" on public.project_media for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins manage volunteering" on public.volunteering;
create policy "Admins manage volunteering" on public.volunteering for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Tighten the legacy project policies to respect the explicit lifecycle.
drop policy if exists "Published projects are readable" on public.projects;
create policy "Published projects are readable" on public.projects for select to anon, authenticated using (published and status='published');
drop policy if exists "Published project sections are readable" on public.project_sections;
create policy "Published project sections are readable" on public.project_sections for select to anon, authenticated using (
  is_visible and not is_archived and exists (select 1 from public.projects p where p.id=project_id and p.published and p.status='published')
);

do $$ declare t text; begin
  foreach t in array array['pages','page_sections','page_section_items','project_section_items','project_media','volunteering']
  loop execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
       execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

insert into public.pages(page_key,title,slug,seo_title,seo_description,open_graph_title,open_graph_description,is_published)
values
('home','Home','/','Turning Data into Commercial Growth','Data-driven marketing, commercial analytics, business intelligence and process automation by Ahmed Aziz Mhiri.','Turning Data into Commercial Growth','Ahmed combines business understanding, analytics, automation and AI to improve commercial decisions and operational reliability.',true),
('about','About','/about','About Ahmed Aziz Mhiri','Ahmed works at the intersection of data, business, marketing and automation.','About Ahmed Aziz Mhiri','Data, business, marketing and automation applied to real commercial needs.',true),
('projects','Projects','/projects','Commercial Analytics, Automation and Digital Projects','Projects across commercial analytics, customer journeys, automation, AI and tourism operations.','Projects by Ahmed Aziz Mhiri','Evidence of data-driven marketing, analytics and process automation.',true),
('experience','Experience','/experience','Professional Experience','Experience across tourism operations, digital marketing, hospitality management control, analytics and automation.','Professional Experience','Ahmed Aziz Mhiri''s professional timeline.',true),
('certifications','Certifications','/certifications','Certifications','Published professional certifications.','Certifications','Professional certifications earned by Ahmed Aziz Mhiri.',true),
('resume','Resume','/resume','Resume','Download verified resume versions.','Ahmed Aziz Mhiri Resume','Resume and CV versions.',true)
on conflict(page_key) do update set title=excluded.title,slug=excluded.slug,seo_title=excluded.seo_title,seo_description=excluded.seo_description,
open_graph_title=excluded.open_graph_title,open_graph_description=excluded.open_graph_description,is_published=excluded.is_published,updated_at=now();

with h as (select id from public.pages where page_key='home')
insert into public.page_sections(page_id,section_key,section_type,title,subtitle,description,cta_label,cta_href,secondary_cta_label,secondary_cta_href,display_order,is_visible)
select h.id,v.* from h cross join (values
('hero','hero','Turning Data into Commercial Growth','Data-Driven Marketing · Commercial Analytics · Business Intelligence','I combine business understanding, analytics, automation and AI to improve commercial decisions, customer journeys and operational reliability.','Explore Projects','/projects','View Resume','/resume',0,true),
('featured-projects','featured_projects','Featured Projects','Selected evidence of commercial impact','Three current proofs selected and ordered in the CMS.',null,null,null,null,10,true),
('experience','experience_list','Work Experience','Business, analytics and automation in practice',null,null,null,null,null,20,true),
('skills','skills','Skills','Business-first technical capability',null,null,null,null,null,30,true),
('certifications','certifications_grid','Certifications','Supporting professional learning',null,null,null,null,null,40,true),
('volunteering','volunteering','Volunteering','Campaign coordination and participant journeys',null,null,null,null,null,50,true),
('cta','cta','Let''s turn data into clearer commercial decisions',null,'Open to relevant European opportunities from Summer 2027.','Contact Ahmed','/contact','View Resume','/resume',60,true)
) v(section_key,section_type,title,subtitle,description,cta_label,cta_href,secondary_cta_label,secondary_cta_href,display_order,is_visible)
on conflict(page_id,section_key) do update set section_type=excluded.section_type,title=excluded.title,subtitle=excluded.subtitle,description=excluded.description,
cta_label=excluded.cta_label,cta_href=excluded.cta_href,secondary_cta_label=excluded.secondary_cta_label,secondary_cta_href=excluded.secondary_cta_href,
display_order=excluded.display_order,is_visible=excluded.is_visible,is_archived=false,updated_at=now();

update public.profile set headline='Data-Driven Marketing · Commercial Analytics · Business Intelligence',
 secondary_line='Data-Driven Marketing · Commercial Analytics · Business Intelligence',
 tagline='Turning Data into Commercial Growth',
 availability='Based in Tunisia · Open to European opportunities from Summer 2027',
 short_bio='I combine business understanding, analytics, automation and AI to improve commercial decisions, customer journeys and operational reliability.',
 updated_at=now();
update public.hero set eyebrow='Data-Driven Marketing · Commercial Analytics · Business Intelligence',
 title='Turning Data into Commercial Growth', subtitle='Data-Driven Marketing · Commercial Analytics · Business Intelligence',
 tagline='Turning Data into Commercial Growth', primary_cta_label='Explore Projects',primary_cta_href='/projects',
 secondary_cta_label='View Resume',secondary_cta_href='/resume',updated_at=now();
update public.about set title='I work at the intersection of data, business, marketing and automation.',
 body='My experience spans tourism operations, process automation, commercial development, digital marketing, hospitality management control and the development of technical solutions designed around real business needs.

At Sunshine Holiday Group, I support business systems and automation for workflows involving reservations, invoices, vouchers and hotel commercial conditions. This work has strengthened my ability to translate operational rules into structured, controlled and reviewable processes.

My digital-marketing and commercial experiences have developed my understanding of customer journeys, campaign coordination, customer acquisition, booking flows and business development.

My hospitality background includes two distinct management-control experiences. At El Mouradi Palace, a five-star hotel, I supported expense analysis, KPI reporting, cost control and profitability-focused management support. At El Mouradi Club Kantaoui, a four-star hotel, I developed practical experience in daily reporting, budget preparation, variance analysis and cross-department operational coverage.

I also build technical solutions when they support a clear user or business objective, including RPA workflows, tourism booking platforms, administrative dashboards, AI-ready applications, chatbots and full-stack systems.

I am completing a Master''s in Big Data Analytics & E-Commerce at IHEC Carthage, with graduation planned for 2027. My current major academic project is an LLM interface for launching and managing a multi-agent system.

My target roles include Data-Driven Marketing, Commercial Analytics, Business Intelligence, Revenue Operations, CRM and Marketing Automation, Customer Insights and Process Automation.',
 highlights=array['Business understanding and commercial analytics','Customer journeys, marketing and hospitality','Automation, AI and technical implementation'],updated_at=now();

insert into public.projects(slug,title,type,summary,description,cover_image_url,tags,tools,featured,published,sort_order,status,project_group,home_featured_order,projects_page_order)
values
('sunshine-rpa-commercial-rules-automation','Sunshine RPA and Commercial Rules Automation','Process Automation · Business Analysis · Tourism Operations','Automation and business-rule structuring for tourism operations involving reservations, invoices, vouchers and hotel commercial conditions.','Automation and business-rule structuring for tourism operations involving reservations, invoices, vouchers and hotel commercial conditions.','/projects/project-1.png',array['Process Automation','Business Analysis','Tourism Operations'],array['UiPath','Business Rules','Reporting'],true,true,1,'published','Featured Projects',1,1),
('chic-chac-digital-transformation','Chic-Chac Digital Transformation','Data-Driven Marketing · Customer Journey · Automation','A customer-journey and digital-transformation engagement connecting marketing activities, booking touchpoints and recurring operational workflows.','A customer-journey and digital-transformation engagement connecting marketing activities, booking touchpoints and recurring operational workflows.','/projects/project-2.png',array['Data-Driven Marketing','Customer Journey','Automation'],array['Digital Marketing','Booking Workflows'],true,true,2,'published','Featured Projects',2,2),
('tunisia-excursion-booking-platform','Tunisia Excursion Booking Platform','Digital Tourism · Booking Journey · Firebase','A freelance tourism-booking platform with a customer-facing excursion journey and an administrative interface for booking, status and KPI management.','A freelance tourism-booking platform with a customer-facing excursion journey and an administrative interface for booking, status and KPI management.','/projects/project-3.png',array['Digital Tourism','Booking Journey','Firebase'],array['Firebase','Dashboard','KPI Management'],true,true,3,'published','Featured Projects',3,3),
('vermeg-ai-ready-e-learning-platform','VERMEG AI-Ready E-Learning Platform','AI Applications · Full-Stack · System Architecture','An AI-ready e-learning environment combining full-stack development, secure access, microservices, observability and retrieval-augmented AI concepts.','An AI-ready e-learning environment combining full-stack development, secure access, microservices, observability and retrieval-augmented AI concepts.','/projects/project-1.png',array['AI Applications','Full-Stack','System Architecture'],array['Microservices','RAG','Observability'],false,true,4,'published','Professional Projects',null,4),
('personal-portfolio-platform','Personal Portfolio Platform','Professional Platform · Next.js · Supabase','A professional portfolio platform designed to connect experience, projects, evidence, CV access and cross-platform professional positioning.','A professional portfolio platform designed to connect experience, projects, evidence, CV access and cross-platform professional positioning.','/projects/project-2.png',array['Professional Platform','Next.js','Supabase'],array['Next.js','Supabase','TypeScript'],false,true,5,'published','Professional Projects',null,5),
('university-chatbot-student-services','University Chatbot for Student Services','Chatbot · NLP · Data Security','A university-hackathon chatbot designed to improve access to student-service information while considering data protection and local deployment.','A university-hackathon chatbot designed to improve access to student-service information while considering data protection and local deployment.','/projects/project-3.png',array['Chatbot','NLP','Data Security'],array['NLP','Local Deployment'],false,true,6,'published','Additional Projects',null,6),
('library-management-full-stack-application','Library Management Full-Stack Application','Technical Foundations','An Angular and Spring Boot application with REST APIs, search, CRUD operations and borrowing tracking.','An Angular and Spring Boot application with REST APIs, search, CRUD operations and borrowing tracking.','/projects/project-1.png',array['Angular','Spring Boot','REST APIs'],array['Angular','Spring Boot'],false,true,7,'published','Technical Foundations',null,7),
('master-multi-agent-llm-project','Master Multi-Agent LLM Project','Preparation','An LLM interface for launching and managing a multi-agent system.','Major academic project currently in preparation.','/projects/project-2.png',array['LLM','Multi-Agent Systems'],array['LLM'],false,false,8,'preparation','Preparation',null,8)
on conflict(slug) do update set title=excluded.title,type=excluded.type,summary=excluded.summary,description=excluded.description,tags=excluded.tags,tools=excluded.tools,
featured=excluded.featured,published=excluded.published,sort_order=excluded.sort_order,status=excluded.status,project_group=excluded.project_group,
home_featured_order=excluded.home_featured_order,projects_page_order=excluded.projects_page_order,updated_at=now();

update public.projects set status='archived',published=false,featured=false,home_featured_order=null,project_group='Archived',updated_at=now()
where slug in ('hotel-kpi-cost-control-analysis','hotel-costs-kpi') or lower(title) in ('hotel kpi & cost control analysis','hotel costs & kpi');
update public.projects set status='archived',published=false,featured=false,home_featured_order=null,project_group='Archived',updated_at=now()
where slug in ('rpa-invoice-control-booking-reconciliation','digital-transformation-mens-barbershop','ai-ready-elearning-platform','library-management-application');

update public.experience set company='Sunshine Holiday Group',sort_order=1,
points=array['Business systems and process-automation work across tourism operations, commercial rules, reservations, invoices and operational validation workflows.'],updated_at=now()
where company ilike 'Sunshine%';
update public.experience set sort_order=2,
points=array['Commercial development and digital-marketing coordination focused on visibility, partnerships, customer acquisition and business growth.'],updated_at=now()
where company='Maison Salina';
update public.experience set company='Chic-Chac',sort_order=3,
points=array['Digital-transformation and marketing engagement focused on customer journeys, booking-related touchpoints, visibility and recurring operational workflows.'],updated_at=now()
where company ilike '%Barbershop%' or company ilike '%Chic%';
update public.experience set sort_order=4,
points=array['AI and full-stack development internship involving an AI-ready e-learning platform, secure architecture, microservices, observability and RAG-related capabilities.'],updated_at=now()
where company ilike 'VERMEG%';
update public.experience set sort_order=5,
points=array['Full-stack development internship involving an Angular and Spring Boot library-management application with REST APIs, search, CRUD operations and borrowing tracking.'],updated_at=now()
where company ilike 'ArabSoft%';
update public.experience set company='El Mouradi Club Kantaoui',sort_order=6,
points=array['Daily management-control and operational reporting experience covering all operational departments, budget monitoring, variance analysis and cost-control decision support.'],updated_at=now()
where company='El Mouradi Hotels';
insert into public.experience(company,role,location,start_date,end_date,date_label,logo_url,logo_alt,points,sort_order,published)
select 'El Mouradi Palace','Management Control Intern','Sousse, Tunisia','','','', '/companies/el-mouradi.png','El Mouradi Palace logo',
array['Management-control internship in a five-star hospitality environment involving expense analysis, KPI reporting, cost control, budget variances and management decision support.'],7,true
where not exists(select 1 from public.experience where company='El Mouradi Palace');

update public.certifications set issuer='Google Digital Garage',date='September 2022',credential_url='',credential_id='',
description='Supporting certification in digital-marketing fundamentals.',sort_order=10,published=true,updated_at=now()
where name='Fundamentals of Digital Marketing';
insert into public.certifications(name,issuer,date,credential_url,credential_id,description,tags,sort_order,published)
select 'Fundamentals of Digital Marketing','Google Digital Garage','September 2022','','','Supporting certification in digital-marketing fundamentals.',array['Digital Marketing'],10,true
where not exists(select 1 from public.certifications where name='Fundamentals of Digital Marketing');

insert into public.volunteering(stable_key,role,organisation,start_date,end_date,date_label,domain,summary,description_items,focus_areas,sort_order,published,archived)
values('aiesec-ogv-member','Outgoing Global Volunteer (OGV) Member','AIESEC Tunisia','February 2022','May 2022','February 2022 – May 2022','Social Services',
'Supported AIESEC''s Outgoing Global Volunteer programme by promoting international volunteering opportunities and guiding students through the participant journey.',
array['Promoted volunteering programmes through university outreach, information sessions, events and online campaigns.','Followed candidates from registration to final approval, supporting a smoother participant flow and conversion process.','Provided participant support and coordinated with international partners to ensure a quality volunteering experience.','Collaborated with Marketing and Public Relations teams on campaigns to increase programme visibility and engagement.','Contributed to local strategies aimed at identifying participation barriers and improving student outreach.'],
array['Campaign Coordination','Participant Journey','International Relations','Intercultural Communication','Youth Engagement'],1,true,false)
on conflict(stable_key) do update set role=excluded.role,organisation=excluded.organisation,start_date=excluded.start_date,end_date=excluded.end_date,
date_label=excluded.date_label,domain=excluded.domain,summary=excluded.summary,description_items=excluded.description_items,focus_areas=excluded.focus_areas,
sort_order=excluded.sort_order,published=true,archived=false,updated_at=now();

update public.profile
set headline = 'Data-Driven Marketing · Commercial Analytics · Business Intelligence',
    secondary_line = 'Data-Driven Marketing · Commercial Analytics · Business Intelligence',
    availability = 'Based in Tunisia · Open to European opportunities from Summer 2027',
    updated_at = now();

update public.hero
set eyebrow = 'Data-Driven Marketing · Commercial Analytics · Business Intelligence',
    subtitle = 'Data-Driven Marketing · Commercial Analytics · Business Intelligence',
    updated_at = now();

update public.pages
set seo_description = case page_key
  when 'home' then 'Data-driven marketing, commercial analytics, business intelligence and process automation by Ahmed Aziz Mhiri.'
  when 'about' then 'Ahmed works at the intersection of data, business, marketing and automation.'
  when 'projects' then 'Projects across commercial analytics, customer journeys, automation, AI and tourism operations.'
  when 'experience' then 'Experience across tourism operations, digital marketing, hospitality management control, analytics and automation.'
  else seo_description
end,
updated_at = now();

update public.projects
set type = case slug
  when 'sunshine-rpa-commercial-rules-automation' then 'Process Automation · Business Analysis · Tourism Operations'
  when 'chic-chac-digital-transformation' then 'Data-Driven Marketing · Customer Journey · Automation'
  when 'tunisia-excursion-booking-platform' then 'Digital Tourism · Booking Journey · Firebase'
  when 'vermeg-ai-ready-e-learning-platform' then 'AI Applications · Full-Stack · System Architecture'
  when 'personal-portfolio-platform' then 'Professional Platform · Next.js · Supabase'
  when 'university-chatbot-student-services' then 'Chatbot · NLP · Data Security'
  else type
end,
updated_at = now()
where slug in (
  'sunshine-rpa-commercial-rules-automation',
  'chic-chac-digital-transformation',
  'tunisia-excursion-booking-platform',
  'vermeg-ai-ready-e-learning-platform',
  'personal-portfolio-platform',
  'university-chatbot-student-services'
);

update public.volunteering
set date_label = 'February 2022 – May 2022',
    summary = 'Supported AIESEC''s Outgoing Global Volunteer programme by promoting international volunteering opportunities and guiding students through the participant journey.',
    updated_at = now()
where stable_key = 'aiesec-ogv-member';

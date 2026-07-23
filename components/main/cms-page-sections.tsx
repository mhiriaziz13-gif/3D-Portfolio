import Link from "next/link";
import { About } from "@/components/main/about";
import { CertificationsSection } from "@/components/main/certifications-section";
import { Experience } from "@/components/main/experience";
import { Hero } from "@/components/main/hero";
import { Projects } from "@/components/main/projects";
import { Skills } from "@/components/main/skills";
import { VolunteeringSection } from "@/components/main/volunteering-section";
import type { PageSectionContent, PortfolioContent } from "@/lib/cms-types";

export function CmsPageSections({ content, pageKey }: { content: PortfolioContent; pageKey: string }) {
  const page = content.pages.find((item) => item.pageKey === pageKey);
  if (!page?.sections.length) return null;

  return page.sections.map((section) => <CmsSection key={section.id} section={section} content={content} />);
}

function CmsSection({ section, content }: { section: PageSectionContent; content: PortfolioContent }) {
  switch (section.sectionType) {
    case "hero":
      return <Hero profile={{ ...content.profile, shortProfile: section.description || content.profile.shortProfile }} hero={{ ...content.hero, title: section.title || content.hero.title, eyebrow: section.subtitle || content.hero.eyebrow, tagline: section.title || content.hero.tagline, primaryCtaLabel: section.ctaLabel, primaryCtaHref: section.ctaHref, secondaryCtaLabel: section.secondaryCtaLabel, secondaryCtaHref: section.secondaryCtaHref }} />;
    case "featured_projects":
      return <Projects title={section.title} subtitle={section.subtitle} projects={content.projects.filter((project) => project.featured).sort((a,b) => (a.homeFeaturedOrder ?? 999) - (b.homeFeaturedOrder ?? 999)).slice(0, 3)} cardLocation="homepage" />;
    case "projects_grid":
      return <Projects title={section.title} subtitle={section.subtitle} projects={content.projects} cardLocation="projects_page" />;
    case "experience_list":
      return <Experience title={section.title} subtitle={section.subtitle} experience={content.experience} />;
    case "certifications_grid":
      return <CertificationsSection certifications={content.certifications} />;
    case "volunteering":
      return <VolunteeringSection title={section.title} subtitle={section.subtitle} entries={content.volunteering} />;
    case "skills":
      return <Skills skillCategories={content.skillCategories} />;
    case "rich_text":
      return <section className="relative z-20 mx-auto max-w-5xl px-6 py-20"><h2 className="text-3xl font-bold text-white">{section.title}</h2>{section.subtitle && <p className="mt-3 text-cyan-100">{section.subtitle}</p>}<div className="mt-6 whitespace-pre-line leading-8 text-gray-300">{section.description}</div></section>;
    case "cta":
      return <section className="relative z-20 mx-auto max-w-5xl px-6 py-20 text-center"><h2 className="text-3xl font-bold text-white">{section.title}</h2><p className="mx-auto mt-4 max-w-2xl text-gray-300">{section.description}</p><div className="mt-7 flex justify-center gap-3">{section.ctaHref && <Link className="button-primary rounded-lg px-5 py-3 font-semibold text-white" href={section.ctaHref}>{section.ctaLabel}</Link>}{section.secondaryCtaHref && <Link className="button-secondary rounded-lg px-5 py-3" href={section.secondaryCtaHref}>{section.secondaryCtaLabel}</Link>}</div></section>;
    default:
      return null;
  }
}

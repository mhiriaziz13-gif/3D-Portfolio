export const revalidate = 60;

import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackedLink } from "@/components/analytics/tracked-link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProjectSocialLinks } from "@/components/sub/project-social-links";
import { getPortfolioContent, getProjectBySlug } from "@/lib/cms";
import type { ProjectContent } from "@/lib/cms-types";
import { createPageMetadata } from "@/lib/seo/metadata";
import { projectSchema } from "@/lib/seo/schema";
import { isHttpsUrl } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return createPageMetadata({ title: "Project not found", description: "This project is not available.", path: `/projects/${slug}`, noindex: true });
  return createPageMetadata({ title: project.title, description: project.description.slice(0, 160), path: `/projects/${project.slug}`, image: project.image });
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return notFound();
  }
  const content = await getPortfolioContent();
  const related = getRelatedProjects(project, content.projects);

  return (
    <main className="min-h-screen px-6 py-28">
      <article className="relative z-[20] mx-auto flex w-full max-w-5xl flex-col gap-8">
        <JsonLd data={projectSchema(project)} />
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Projects", href: "/projects" }, { name: project.title, href: `/projects/${project.slug}` }]} />
        <Link href="/projects" className="button-secondary inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
          <span aria-hidden="true">←</span> Back to projects
        </Link>

        <div>
          <p className="Welcome-text mb-4 text-sm">Project</p>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{project.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300">{project.description}</p>
          <ProjectSocialLinks githubUrl={project.githubUrl} linkedinUrl={project.linkedinUrl} projectTitle={project.title} className="mt-5" />
        </div>

        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#2A0E61] bg-[#08021c]/70 shadow-lg shadow-[#2A0E61]/20">
          <Image src={project.image} alt={`Project visual for ${project.title}`} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover opacity-90" unoptimized={isHttpsUrl(project.image)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{tag}</span>
          ))}
        </div>

        {(project.sections ?? []).length > 0 && <div className="grid gap-5">
          {(project.sections ?? []).map((section) => (
            <CaseStudySection key={section.id ?? `${project.slug}-${section.title}`} title={section.title} body={section.body} bullets={section.bullets} />
          ))}
        </div>}
        {related.length > 0 && (
          <section className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6">
            <h2 className="text-2xl font-bold text-white">Related work</h2>
            <div className="mt-4 flex flex-col gap-3">
              {related.map((item) => <Link key={item.slug} href={`/projects/${item.slug}`} className="action-link w-fit">View the {item.title} case study</Link>)}
            </div>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/expertise" className="button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold">Explore relevant expertise</Link><Link href="/experience" className="button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold">Review professional experience</Link><TrackedLink href="/contact" analyticsEvent={{ event: "contact_cta_click", cta_location: "project_page", cta_label: "project_contact" }} className="button-primary rounded-lg px-4 py-2.5 text-sm font-semibold text-white">Discuss a related opportunity</TrackedLink></div>
          </section>
        )}
      </article>
    </main>
  );
}

function getRelatedProjects(current: ProjectContent, projects: ProjectContent[]) {
  const currentTerms = new Set([...current.tags, ...(current.tools ?? [])].map((term) => term.toLowerCase()));

  return projects
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate) => {
      const candidateTerms = [...candidate.tags, ...(candidate.tools ?? [])].map((term) => term.toLowerCase());
      const sharedTerms = candidateTerms.filter((term) => currentTerms.has(term)).length;
      const sameType = Boolean(current.type && candidate.type === current.type);
      return { candidate, score: sharedTerms * 2 + Number(sameType) };
    })
    .sort((left, right) => right.score - left.score || (left.candidate.sortOrder ?? 0) - (right.candidate.sortOrder ?? 0))
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

function CaseStudySection({ title, body, bullets = [] }: { title: string; body?: string; bullets?: string[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6 shadow-xl shadow-[#2A0E61]/20 backdrop-blur-md">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {body && <p className="mt-4 text-sm leading-7 text-gray-300">{body}</p>}
      {bullets.length > 0 && <ul className="mt-4 ml-4 list-disc space-y-2 text-sm leading-6 text-gray-300">{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
    </section>
  );
}

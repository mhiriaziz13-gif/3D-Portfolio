export const revalidate = 60;

import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackedLink } from "@/components/analytics/tracked-link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { verifiedCaseStudies } from "@/data/verified-case-studies";
import { getPortfolioContent, getProjectBySlug } from "@/lib/cms";
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
  const caseStudy = verifiedCaseStudies[project.title];
  const preferredRelated = caseStudy ? content.projects.find((item) => item.title === caseStudy.relatedTitle) : undefined;
  const related = [preferredRelated, ...content.projects.filter((item) => item.slug !== project.slug && item.slug !== preferredRelated?.slug)].filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 3);

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
        </div>

        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#2A0E61] bg-[#08021c]/70 shadow-lg shadow-[#2A0E61]/20">
          <Image src={project.image} alt={`Project visual for ${project.title}`} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover opacity-90" unoptimized={isHttpsUrl(project.image)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{tag}</span>
          ))}
        </div>

        {caseStudy && (
          <div className="grid gap-5">
            <CaseStudySection title="Business and operational context" body={caseStudy.context} />
            <CaseStudySection title="The problem" body={caseStudy.problem} />
            <CaseStudySection title="Ahmed's contribution" body={caseStudy.contribution} />
            <CaseStudySection title="Approach" bullets={caseStudy.approach} />
            <CaseStudySection title="Workflow or architecture" body={caseStudy.workflow} />
            <CaseStudySection title="Tools and technologies" bullets={caseStudy.tools} />
            <CaseStudySection title="Deliverables" bullets={caseStudy.deliverables} />
            <CaseStudySection title="Validation and safeguards" bullets={caseStudy.safeguards} />
            <CaseStudySection title="Qualitative outcome" body={caseStudy.outcome} />
            <CaseStudySection title="What I learned" body={caseStudy.lessons} />
            <CaseStudySection title="Related expertise" bullets={caseStudy.expertise} />
            <CaseStudySection title="Related experience" body={caseStudy.experience} />
            <section className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6">
              <h2 className="text-2xl font-bold text-white">Frequently asked questions</h2>
              <dl className="mt-5 space-y-5">{caseStudy.faq.map((item) => <div key={item.question}><dt className="font-semibold text-cyan-100">{item.question}</dt><dd className="mt-2 text-sm leading-7 text-gray-300">{item.answer}</dd></div>)}</dl>
            </section>
          </div>
        )}

        {(project.sections ?? []).length > 0 && <div className="grid gap-5">
          <h2 className="text-2xl font-bold text-white">Additional published project detail</h2>
          {(project.sections ?? []).map((section) => (
            <section key={`${project.slug}-${section.title}`} className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6 shadow-xl shadow-[#2A0E61]/20 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              {section.body && <p className="mt-4 text-sm leading-7 text-gray-300">{section.body}</p>}
              {!!section.bullets.length && (
                <ul className="mt-4 ml-4 list-disc space-y-2 text-sm leading-6 text-gray-300">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>}
        <section className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6"><h2 className="text-2xl font-bold text-white">Related work</h2><div className="mt-4 flex flex-col gap-3">{related.map((item) => <Link key={item.slug} href={`/projects/${item.slug}`} className="action-link w-fit">View the {item.title} case study</Link>)}</div><div className="mt-7 flex flex-wrap gap-3"><Link href="/expertise" className="button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold">Explore relevant expertise</Link><Link href="/experience" className="button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold">Review professional experience</Link><TrackedLink href="/contact" analyticsEvent={{ event: "contact_cta_click", cta_location: "project_page", cta_label: "project_contact" }} className="button-primary rounded-lg px-4 py-2.5 text-sm font-semibold text-white">Discuss a related opportunity</TrackedLink></div></section>
      </article>
    </main>
  );
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

export const revalidate = 60;
import type { Metadata } from "next";
import { Projects } from "@/components/main/projects";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Projects", description: "Public-safe case studies by Ahmed Aziz Mhiri across commercial analytics, business intelligence, marketing transformation and process automation.", path: "/projects" });

export default async function ProjectsPage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Projects", href: "/projects" }]} /></div>
      <PageIntro eyebrow="Selected evidence" title="Analytics, automation and digital-growth case studies" description="These public-safe case studies explain the operating problem, Ahmed's contribution, the workflow or architecture, the deliverables and the safeguards used. Confidential figures and unsupported outcome claims are deliberately excluded." links={[{ href: "/expertise", label: "See supporting expertise" }, { href: "/experience", label: "Review related experience" }, { href: "/contact", label: "Discuss an opportunity" }]} />
      <Projects projects={content.projects} cardLocation="projects_page" />
    </main>
  );
}

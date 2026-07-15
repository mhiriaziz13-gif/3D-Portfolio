export const revalidate = 60;
import type { Metadata } from "next";
import Link from "next/link";
import { Skills } from "@/components/main/skills";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
export const metadata: Metadata = createPageMetadata({ title: "Expertise", description: "How Ahmed Aziz Mhiri applies business intelligence, marketing analytics, customer insight and process automation to commercial and operational questions.", path: "/expertise" });
const explanations: Record<string,string> = { "Data & Business Intelligence": "Turns operational, financial and commercial data into KPI views, variance analysis and decision-ready reporting.", "Marketing & Customer Growth": "Connects customer journeys, digital visibility and campaign activity with commercial questions and measurable evidence.", "Automation & Operations": "Translates business rules into reviewable workflows, structured outputs and exception handling.", "Technical Stack": "Uses web, database and AI tooling to build maintainable interfaces, integrations and data-supported workflows." };
const projectLinks: Record<string, { title: string; label: string }[]> = {
  "Data & Business Intelligence": [{ title: "Hotel KPI & Cost Control Analysis", label: "hotel KPI and cost-control analysis" }],
  "Marketing & Customer Growth": [{ title: "Digital Transformation for a Men's Barbershop", label: "barbershop digital transformation" }],
  "Automation & Operations": [{ title: "RPA for Invoice Control & Booking Reconciliation", label: "invoice and booking reconciliation" }],
  "Technical Stack": [{ title: "AI-Ready E-Learning Platform", label: "AI-ready e-learning platform" }, { title: "Library Management Application", label: "library application" }],
};

export default async function ExpertisePage() {
  const content = await getPortfolioContent();
  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Expertise", href: "/expertise" }]} /></div>
      <PageIntro eyebrow="Capabilities in context" title="Analytics, marketing and automation expertise" description="Ahmed groups tools around the business decisions and workflows they support. The emphasis is on useful deliverables, validation and auditability—not unsupported proficiency scores or expert labels." links={[{ href: "/projects", label: "View case studies" }, { href: "/experience", label: "Review experience" }, { href: "/contact", label: "Discuss a role" }]} />
      <div className="relative z-20 mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-2">
        {content.skillCategories.map((category) => (
          <section key={category.title} className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6">
            <h2 className="text-2xl font-bold text-white">{category.title}</h2>
            <p className="mt-3 leading-7 text-gray-300">{explanations[category.title] || "Skills used to support practical business and technical deliverables."}</p>
            <p className="mt-3 text-sm text-gray-300"><strong className="text-white">Deliverables:</strong> analysis, reports, workflows, interfaces or integrations appropriate to the problem.</p>
            <p className="mt-3 text-sm text-cyan-100">Tools and methods: {category.skills.join(", ")}</p>
            <div className="mt-4 flex flex-col gap-2">{(projectLinks[category.title] || []).map((project) => { const published = content.projects.find((item) => item.title === project.title); return published ? <Link key={published.slug} href={`/projects/${published.slug}`} className="text-sm text-purple-200 hover:text-cyan-100">See the {project.label} case study</Link> : null; })}</div>
          </section>
        ))}
      </div>
      <Skills skillCategories={content.skillCategories} />
    </main>
  );
}

export const revalidate = 60;
import type { Metadata } from "next";
import Link from "next/link";
import { Experience } from "@/components/main/experience";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Experience", description: "Ahmed Aziz Mhiri's professional timeline across analytics, commercial operations, digital marketing, business systems and automation.", path: "/experience" });

export default async function ExperiencePage() {
  const content = await getPortfolioContent();
  const projectHref = (title: string) => `/projects/${content.projects.find((project) => project.title === title)?.slug || ""}`;

  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Experience", href: "/experience" }]} /></div>
      <PageIntro eyebrow="Professional timeline" title="Experience across analytics, commercial work and automation" description="Ahmed's experience spans employment, consulting and internships in hospitality, tourism, digital marketing and software. The timeline preserves the verified roles and dates while the linked case studies show the public-safe deliverables behind selected entries." links={[{ href: "/projects", label: "View associated case studies" }, { href: "/resume", label: "Open the resume page" }, { href: "/contact", label: "Contact Ahmed" }]} />
      <Experience experience={content.experience} />
      <section className="relative z-20 mx-auto max-w-5xl px-6 pb-24 text-gray-300"><h2 className="text-2xl font-bold text-white">Experience connected to published work</h2><ul className="mt-5 space-y-3"><li><Link href={projectHref("RPA for Invoice Control & Booking Reconciliation")} className="text-cyan-100">Invoice-control and booking-reconciliation automation</Link> relates to tourism operations and business systems.</li><li><Link href={projectHref("Digital Transformation for a Men's Barbershop")} className="text-cyan-100">The barbershop digital-transformation case study</Link> relates to consulting across booking, local SEO and customer communication.</li><li><Link href={projectHref("AI-Ready E-Learning Platform")} className="text-cyan-100">The e-learning platform contribution</Link> and <Link href={projectHref("Library Management Application")} className="text-cyan-100">library application</Link> relate to verified internships.</li><li><Link href={projectHref("Hotel KPI & Cost Control Analysis")} className="text-cyan-100">Hotel KPI and cost-control analysis</Link> relates to management-control experience.</li></ul></section>
    </main>
  );
}

export const revalidate = 60;

import type { Metadata } from "next";
import { EducationSection } from "@/components/main/education-section";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Education", description: "Verified education supporting Ahmed Aziz Mhiri's work in business intelligence, big data analytics, e-commerce and commercial decision-making.", path: "/education" });

export default async function EducationPage() {
  const content = await getPortfolioContent();
  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Education", href: "/education" }]} /></div>
      <PageIntro eyebrow="Academic foundation" title="Business Intelligence, Big Data Analytics and E-Commerce education" description="Ahmed's completed Business Intelligence degree established the data and decision-support foundation for his work. His current Master's adds a Big Data Analytics and E-Commerce direction without replacing the practical commercial and operational context of his portfolio." links={[{ href: "/expertise", label: "See applied expertise" }, { href: "/projects", label: "View project evidence" }, { href: "/certifications", label: "Review credentials" }]} />
      <EducationSection education={content.education} />
    </main>
  );
}

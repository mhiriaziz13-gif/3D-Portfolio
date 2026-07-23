export const revalidate = 60;
import type { Metadata } from "next";
import { Experience } from "@/components/main/experience";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Experience", description: "Ahmed Aziz Mhiri's professional timeline across analytics, commercial operations, digital marketing, business systems and automation.", path: "/experience" });

export default async function ExperiencePage() {
  const content = await getPortfolioContent();
  const page = content.pages.find((item) => item.pageKey === "experience");

  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Experience", href: "/experience" }]} /></div>
      <PageIntro eyebrow="Professional timeline" title={page?.title || "Professional Experience"} description={page?.seoDescription || "Professional experience across business, analytics and automation."} links={[{ href: "/projects", label: "View associated case studies" }, { href: "/resume", label: "Open the resume page" }, { href: "/contact", label: "Contact Ahmed" }]} />
      <Experience experience={content.experience} />
    </main>
  );
}

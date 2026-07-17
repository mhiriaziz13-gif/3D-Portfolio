export const revalidate = 60;
import type { Metadata } from "next";
import { CertificationsSection } from "@/components/main/certifications-section";
import { EducationSection } from "@/components/main/education-section";
import { ResumeSection } from "@/components/main/resume-section";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Resume", description: "View Ahmed Aziz Mhiri's resume formats and supporting education and certification information.", path: "/resume" });

export default async function ResumePage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Resume", href: "/resume" }]} /></div>
      <PageIntro eyebrow="CV and supporting evidence" title="Resume options for Ahmed Aziz Mhiri" description="Choose the English professional CV for general applications, the French version for French-language review, the ATS version for structured recruitment systems, or the Canadian format where that convention is requested. Each option remains available to view as PDF or download in its published formats." links={[{ href: "/projects", label: "Review project evidence" }, { href: "/experience", label: "See the full timeline" }, { href: "/contact", label: "Contact Ahmed", analyticsEvent: { event: "contact_cta_click", cta_location: "resume_page" } }]} />
      <ResumeSection resumes={content.resumes} />
      <EducationSection education={content.education} />
      <CertificationsSection certifications={content.certifications} />
    </main>
  );
}

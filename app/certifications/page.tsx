export const revalidate = 60;

import type { Metadata } from "next";
import { CertificationsSection } from "@/components/main/certifications-section";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Certifications", description: "Verified professional credentials held by Ahmed Aziz Mhiri across digital marketing, analytics and related disciplines.", path: "/certifications" });

export default async function CertificationsPage() {
  const content = await getPortfolioContent();
  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Certifications", href: "/certifications" }]} /></div>
      <PageIntro eyebrow="Verified learning" title="Professional certifications" description="This page lists only credentials available through the published CMS or the verified repository record. Dates and credential IDs are omitted when they have not been confirmed." links={[{ href: "/education", label: "View education" }, { href: "/expertise", label: "Explore expertise" }, { href: "/resume", label: "Open resume options" }]} />
      <CertificationsSection certifications={content.certifications} />
    </main>
  );
}

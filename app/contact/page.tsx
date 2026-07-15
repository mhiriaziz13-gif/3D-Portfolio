export const revalidate = 60;
import type { Metadata } from "next";
import { Contact } from "@/components/main/contact";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "Contact", description: "Contact Ahmed Aziz Mhiri about marketing analytics, commercial analytics, business intelligence and process automation opportunities.", path: "/contact" });

export default async function ContactPage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }]} /></div>
      <PageIntro eyebrow="Start a conversation" title="Contact Ahmed Aziz Mhiri" description="Contact Ahmed about marketing or commercial analytics, Business Intelligence, customer insight, revenue operations, data operations or process-automation opportunities. He is based in Sousse, Tunisia and available for Europe-based opportunities from Summer 2027." links={[{ href: "/projects", label: "View selected proof" }, { href: "/expertise", label: "Explore relevant capabilities" }, { href: "/resume", label: "Open resume options" }]} />
      <Contact profile={content.profile} />
    </main>
  );
}

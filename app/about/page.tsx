export const revalidate = 60;
import type { Metadata } from "next";
import Link from "next/link";
import { About } from "@/components/main/about";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { PageIntro } from "@/components/seo/page-intro";
import { getPortfolioContent } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({ title: "About", description: "How Ahmed Aziz Mhiri combines marketing and commercial analytics, business intelligence, customer insight and process automation.", path: "/about" });

export default async function AboutPage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-24">
      <div className="relative z-20 mx-auto max-w-7xl px-6"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About", href: "/about" }]} /></div>
      <PageIntro eyebrow="Professional profile" title="About Ahmed Aziz Mhiri" description="Ahmed connects Business Intelligence, marketing and commercial analysis with process automation. His work focuses on decision-ready reporting, customer and operational insight, and workflows that remain reviewable by the people using them." links={[{ href: "/expertise", label: "Explore expertise" }, { href: "/projects", label: "View case studies" }, { href: "/resume", label: "View resume" }]} />
      <About profile={content.profile} about={content.about} />
      <section className="relative z-20 mx-auto max-w-5xl space-y-8 px-6 pb-24 text-gray-300">
        <div><h2 className="text-2xl font-bold text-white">How do education and business context connect?</h2><p className="mt-3 leading-7">Ahmed completed a Licence / Bachelor&apos;s degree in Business Intelligence at IHEC Carthage with Mention Excellent — 19.5/20. He is currently pursuing a Master&apos;s in Big Data Analytics &amp; E-Commerce at the same institution, combining a data foundation with commercial and marketing questions.</p></div>
        <div><h2 className="text-2xl font-bold text-white">Which operating contexts shape his work?</h2><p className="mt-3 leading-7">His verified experience includes hospitality and tourism operations, commercial and digital marketing work, business applications and automation. That context supports an approach built around business rules, data quality, exception review and clear deliverables.</p></div>
        <div><h2 className="text-2xl font-bold text-white">What opportunities is Ahmed targeting?</h2><p className="mt-3 leading-7">He is targeting marketing, commercial and Business Intelligence analyst roles, customer and revenue operations, and process-automation work. Based in Sousse, Tunisia, he is available for Europe-based opportunities from Summer 2027.</p></div>
        <p>Review the <Link href="/experience" className="text-cyan-100">professional timeline</Link>, <Link href="/education" className="text-cyan-100">verified education</Link>, or <Link href="/contact" className="text-cyan-100">contact Ahmed about a relevant opportunity</Link>.</p>
      </section>
    </main>
  );
}

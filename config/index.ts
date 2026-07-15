import type { Metadata } from "next";
import { isProductionDeployment, siteSeo } from "@/lib/seo/config";
import { absoluteUrl } from "@/lib/seo/urls";

export const siteConfig: Metadata = {
  metadataBase: new URL(siteSeo.url),
  title: { default: siteSeo.siteName, template: siteSeo.titleTemplate },
  description: siteSeo.description,
  keywords: [
    "Ahmed Aziz Mhiri",
    "Marketing Analytics",
    "Commercial Analytics",
    "Business Intelligence",
    "Process Automation",
    "Data Analyst",
    "BI Analyst",
    "Revenue Operations",
    "CRM Automation",
    "Digital Marketing Analyst",
  ],
  authors: {
    name: "Ahmed Aziz Mhiri",
    url: "https://linkedin.com/in/ahmed-aziz-mhiri",
  },
  creator: "Ahmed Aziz Mhiri",
  publisher: "Ahmed Aziz Mhiri",
  alternates: { canonical: absoluteUrl("/") },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.ico", apple: "/apple-icon.png" },
  robots: { index: isProductionDeployment, follow: isProductionDeployment, nocache: !isProductionDeployment },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "" } },
  openGraph: {
    title: "Ahmed Aziz Mhiri | Data-Driven Marketing & Commercial Analytics",
    description:
      "Marketing analytics, commercial analytics, business intelligence, process automation and digital growth portfolio.",
    type: "website",
    url: absoluteUrl("/"),
    siteName: siteSeo.siteName,
    locale: siteSeo.locale,
    images: [{ url: absoluteUrl(siteSeo.socialImage), width: 1200, height: 630, alt: siteSeo.siteName }],
  },
  twitter: { card: "summary_large_image", title: siteSeo.siteName, description: siteSeo.description, images: [absoluteUrl(siteSeo.socialImage)] },
} as const;

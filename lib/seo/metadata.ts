import type { Metadata } from "next";
import { isProductionDeployment, siteSeo } from "@/lib/seo/config";
import { absoluteUrl, resolveMediaUrl } from "@/lib/seo/urls";

type PageMetadata = { title: string; description: string; path: string; image?: string; noindex?: boolean };

export const createPageMetadata = ({ title, description, path, image = siteSeo.socialImage, noindex = false }: PageMetadata): Metadata => {
  const canonical = absoluteUrl(path);
  const shouldIndex = isProductionDeployment && !noindex;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: shouldIndex, follow: shouldIndex, nocache: !shouldIndex },
    openGraph: { title, description, url: canonical, siteName: siteSeo.siteName, locale: siteSeo.locale, type: "website", images: [{ url: resolveMediaUrl(image), width: 1200, height: 630, alt: `${title} — Ahmed Aziz Mhiri` }] },
    twitter: { card: "summary_large_image", title, description, images: [resolveMediaUrl(image)] },
  };
};

import type { MetadataRoute } from "next";
import { getPortfolioContent } from "@/lib/cms";
import { absoluteUrl } from "@/lib/seo/urls";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getPortfolioContent();
  const paths = ["/", "/about", "/expertise", "/projects", "/experience", "/education", "/certifications", "/resume", "/contact"];
  return [...paths, ...content.projects.map((project) => `/projects/${project.slug}`)].map((path) => ({ url: absoluteUrl(path) }));
}

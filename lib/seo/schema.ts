import type { ProfileContent, ProjectContent } from "@/lib/cms-types";
import { siteSeo } from "@/lib/seo/config";
import { absoluteUrl } from "@/lib/seo/urls";

export const personSchema = (profile: ProfileContent) => ({
  "@type": "Person", "@id": `${siteSeo.url}/#person`, name: profile.name, url: siteSeo.url,
  image: absoluteUrl(profile.avatarPath), description: profile.shortProfile, jobTitle: profile.mainTitle,
  sameAs: [profile.linkedIn, profile.github], homeLocation: { "@type": "Place", name: profile.location },
  knowsAbout: ["Marketing analytics", "Commercial analytics", "Business intelligence", "Customer insights", "Process automation"],
  alumniOf: { "@type": "CollegeOrUniversity", name: "Institut des Hautes Études Commerciales de Carthage — IHEC Carthage" },
});

export const websiteSchema = () => ({ "@type": "WebSite", "@id": `${siteSeo.url}/#website`, url: siteSeo.url, name: siteSeo.siteName, inLanguage: "en", publisher: { "@id": `${siteSeo.url}/#person` } });
export const breadcrumbSchema = (items: { name: string; href: string }[]) => ({ "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.href) })) });
export const projectSchema = (project: ProjectContent) => ({ "@type": "CreativeWork", "@id": `${absoluteUrl(`/projects/${project.slug}`)}#project`, name: project.title, headline: project.title, description: project.description, url: absoluteUrl(`/projects/${project.slug}`), image: absoluteUrl(project.image), creator: { "@id": `${siteSeo.url}/#person` }, author: { "@id": `${siteSeo.url}/#person` }, keywords: project.tags, isPartOf: { "@id": `${siteSeo.url}/#website` }, mainEntityOfPage: absoluteUrl(`/projects/${project.slug}`) });

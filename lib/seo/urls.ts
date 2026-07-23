import { siteSeo } from "@/lib/seo/config";

export const absoluteUrl = (path = "/") => new URL(path.startsWith("/") ? path : `/${path}`, `${siteSeo.url}/`).toString();

export const resolveMediaUrl = (value?: string | null, fallback = siteSeo.socialImage) => {
  const media = value?.trim() || fallback;
  if (/^https?:\/\//i.test(media)) return media;
  return absoluteUrl(media);
};

import { siteSeo } from "@/lib/seo/config";

export const absoluteUrl = (path = "/") => new URL(path.startsWith("/") ? path : `/${path}`, `${siteSeo.url}/`).toString();

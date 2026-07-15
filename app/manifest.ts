import type { MetadataRoute } from "next";
import { siteSeo } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return { name: siteSeo.siteName, short_name: siteSeo.name, description: siteSeo.description, start_url: "/", display: "standalone", background_color: "#030014", theme_color: "#030014", icons: [{ src: "/icon1.png", sizes: "192x192", type: "image/png" }, { src: "/icon2.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}

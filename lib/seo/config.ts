const FALLBACK_SITE_URL = "https://ahmedaziz-portfolio.vercel.app";

const normalizeSiteUrl = (value: string | undefined) => {
  try {
    const url = new URL(value || FALLBACK_SITE_URL);
    if (url.protocol !== "https:" || url.hostname.endsWith(".vercel.app") && url.hostname !== "ahmedaziz-portfolio.vercel.app") {
      return FALLBACK_SITE_URL;
    }
    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
};

export const siteSeo = {
  name: "Ahmed Aziz Mhiri",
  siteName: "Ahmed Aziz Mhiri — Data-Driven Marketing & Commercial Analytics",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "en_US",
  titleTemplate: "%s | Ahmed Aziz Mhiri",
  description: "Ahmed Aziz Mhiri connects marketing and commercial analytics, business intelligence, customer insight and auditable process automation.",
  creator: "Ahmed Aziz Mhiri",
  socialImage: "/opengraph-image",
  sameAs: ["https://linkedin.com/in/ahmed-aziz-mhiri", "https://github.com/mhiriaziz13-gif"],
} as const;

export const isProductionDeployment = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";

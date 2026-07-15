/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === "development";
const isNonProductionDeployment = isDevelopment || Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const captchaProvider = (
  process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER || ""
).trim().toLowerCase();
const hcaptchaSources =
  captchaProvider === "hcaptcha"
    ? ["https://hcaptcha.com", "https://*.hcaptcha.com"]
    : [];
const supabaseOrigin = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    return "";
  }
})();

const supabaseRealtimeOrigin = supabaseOrigin
  .replace(/^https:/, "wss:")
  .replace(/^http:/, "ws:");

const connectSources = [
  "'self'",
  supabaseOrigin,
  supabaseRealtimeOrigin,
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
  "https://vitals.vercel-insights.com",
  ...hcaptchaSources,
].filter(Boolean).join(" ");

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  "https://www.googletagmanager.com",
  "https://va.vercel-scripts.com",
  ...hcaptchaSources,
].filter(Boolean).join(" ");

const frameSources = hcaptchaSources.length > 0
  ? ["'self'", ...hcaptchaSources].join(" ")
  : "'none'";

const styleSources = [
  "'self'",
  "'unsafe-inline'",
  ...hcaptchaSources,
].join(" ");

const imageSources = [
  "'self'",
  "data:",
  "blob:",
  supabaseOrigin,
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
]
  .filter(Boolean)
  .join(" ");

const mediaSources = ["'self'", "blob:", supabaseOrigin]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  `script-src ${scriptSources}`,
  "script-src-attr 'none'",
  `style-src ${styleSources}`,
  `img-src ${imageSources}`,
  "font-src 'self' data:",
  `connect-src ${connectSources}`,
  `media-src ${mediaSources}`,
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `frame-src ${frameSources}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const noindexHeader = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };

const nextConfig = {
  poweredByHeader: false,
  images: {
    // The portfolio's fill images top out near 405px. Adding a 384px device
    // candidate prevents small cards/avatars from jumping straight to 640px.
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  outputFileTracingIncludes: {
    "/api/admin/upload": [
      "./public/**/*.jpg",
      "./public/**/*.jpeg",
      "./public/**/*.png",
      "./public/**/*.webp",
      "./public/**/*.pdf",
      "./public/**/*.docx",
      "./public/**/*.JPG",
      "./public/**/*.JPEG",
      "./public/**/*.PNG",
      "./public/**/*.WEBP",
      "./public/**/*.PDF",
      "./public/**/*.DOCX",
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: isNonProductionDeployment ? [...securityHeaders, noindexHeader] : securityHeaders },
      { source: "/admin/:path*", headers: [noindexHeader] },
      { source: "/auth/:path*", headers: [noindexHeader] },
      { source: "/api/:path*", headers: [noindexHeader] },
      { source: "/cv/:path*.pdf", headers: [noindexHeader] },
      { source: "/cv/:path*.docx", headers: [noindexHeader] },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
].filter(Boolean).join(" ");

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  "https://www.googletagmanager.com",
  "https://va.vercel-scripts.com",
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
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imageSources}`,
  "font-src 'self' data:",
  `connect-src ${connectSources}`,
  `media-src ${mediaSources}`,
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
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

const nextConfig = {
  poweredByHeader: false,
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
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;

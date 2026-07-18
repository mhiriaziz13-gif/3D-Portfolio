export type AnalyticsConsentValue = "unknown" | "granted" | "denied";

type StoredAnalyticsConsent = {
  version: 1;
  analytics: Exclude<AnalyticsConsentValue, "unknown">;
  updatedAt: string;
};

export const ANALYTICS_CONSENT_STORAGE_KEY = "aam_analytics_consent_v1";
export const PRODUCTION_ANALYTICS_HOSTNAME = "ahmedaziz-portfolio.vercel.app";

export const isPublicAnalyticsPath = (pathname: string) =>
  !["/admin", "/auth", "/api"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const isProductionAnalyticsLocation = () =>
  typeof window !== "undefined" &&
  window.location.hostname === PRODUCTION_ANALYTICS_HOSTNAME;

export const readStoredAnalyticsConsent = (): AnalyticsConsentValue => {
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (!raw) return "unknown";
    const stored: unknown = JSON.parse(raw);
    if (
      typeof stored !== "object" ||
      stored === null ||
      !("version" in stored) ||
      stored.version !== 1 ||
      !("analytics" in stored) ||
      (stored.analytics !== "granted" && stored.analytics !== "denied") ||
      !("updatedAt" in stored) ||
      typeof stored.updatedAt !== "string" ||
      Number.isNaN(Date.parse(stored.updatedAt))
    ) {
      return "unknown";
    }
    return stored.analytics;
  } catch {
    return "unknown";
  }
};

export const writeStoredAnalyticsConsent = (
  analytics: Exclude<AnalyticsConsentValue, "unknown">,
) => {
  const value: StoredAnalyticsConsent = {
    version: 1,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(
      ANALYTICS_CONSENT_STORAGE_KEY,
      JSON.stringify(value),
    );
    return true;
  } catch {
    return false;
  }
};

export const clearStoredAnalyticsConsent = () => {
  try {
    window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
};

export const isAnalyticsConsentGranted = () =>
  readStoredAnalyticsConsent() === "granted";

const expireCookie = (name: string, domain?: string) => {
  const domainAttribute = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domainAttribute}`;
};

export const clearAnalyticsCookies = () => {
  if (typeof document === "undefined") return;
  const analyticsCookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(
      (name) =>
        name === "_ga" ||
        name.startsWith("_ga_") ||
        name === "_clck" ||
        name === "_clsk",
    );
  const hostname = window.location.hostname;
  const domainVariants = [undefined, hostname, `.${hostname}`];
  for (const name of new Set(analyticsCookieNames)) {
    for (const domain of domainVariants) expireCookie(name, domain);
  }
};

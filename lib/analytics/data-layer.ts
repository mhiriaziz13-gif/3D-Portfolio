export type AnalyticsEvent =
  | {
      event: "cv_download";
      cv_variant: "english" | "french" | "canada" | "ats";
      file_format: "pdf" | "docx";
      cta_location: "hero" | "navbar" | "resume_page";
    }
  | {
      event: "contact_cta_click";
      cta_location: "hero" | "footer" | "contact_page" | "project_page";
    };

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    analyticsCollectionEnabled?: boolean;
  }
}

const CONSENT_STORAGE_KEY = "analytics-consent";

export const setAnalyticsCollectionEnabled = (enabled: boolean) => {
  window.analyticsCollectionEnabled = enabled;
};

export const updateGoogleConsent = (
  analyticsStorage: "granted" | "denied",
) => {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
  window.gtag("consent", "update", {
    analytics_storage: analyticsStorage,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
};

export const pushAnalyticsEvent = (analyticsEvent: AnalyticsEvent) => {
  if (
    typeof window === "undefined" ||
    !window.analyticsCollectionEnabled ||
    window.localStorage.getItem(CONSENT_STORAGE_KEY) !== "accepted"
  ) {
    return false;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(analyticsEvent);
  return true;
};

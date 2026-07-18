export type AnalyticsEvent =
  | {
      event: "virtual_page_view";
      page_path: string;
      page_location?: string;
      page_title?: string;
    }
  | {
      event: "project_card_click";
      project_slug: string;
      project_title: string;
      card_location: "home" | "projects_page" | "related_projects";
    }
  | {
      event: "cv_download";
      cv_variant: "english" | "french" | "canada" | "ats";
      file_format: "pdf" | "docx";
      cta_location: "home" | "resume_page";
    }
  | {
      event: "contact_submit_success";
    }
  | {
      event: "contact_fallback_mailto";
    }
  | {
      event: "contact_submit_error";
      error_type: "api_error" | "network_error";
    }
  | {
      event: "profile_link_click";
      platform: "linkedin" | "github";
      link_location: "navbar" | "footer" | "contact" | "about";
    }
  | {
      event: "email_contact_click";
      link_location: "footer" | "contact";
    }
  | {
      event: "contact_cta_click";
      cta_location: "hero" | "project_page" | "resume_page" | "footer";
    };

const CONSENT_STORAGE_KEY = "aam_analytics_consent";

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
    window.localStorage.getItem(CONSENT_STORAGE_KEY) !== "granted"
  ) {
    return false;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(analyticsEvent);
  return true;
};

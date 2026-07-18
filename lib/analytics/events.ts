import {
  isAnalyticsConsentGranted,
  isProductionAnalyticsLocation,
  isPublicAnalyticsPath,
} from "@/lib/analytics/consent";

export type AnalyticsEvent =
  | {
      event: "project_card_click";
      project_slug: string;
      project_title: string;
      card_location: "homepage" | "projects_page" | "related_projects";
    }
  | {
      event: "cv_download";
      cv_variant: "english" | "french" | "ats" | "canadian";
      file_format: "pdf" | "docx";
      cta_location: "resume_page" | "homepage" | "contact_section";
    }
  | {
      event: "contact_submit_success";
      form_name: "portfolio_contact";
      contact_method: "api";
      cta_location: "contact_page";
    }
  | {
      event: "contact_fallback_mailto";
      form_name: "portfolio_contact";
      contact_method: "mailto_fallback";
      cta_location: "contact_page";
    }
  | {
      event: "contact_submit_error";
      form_name: "portfolio_contact";
      error_type: "api_error" | "network_error";
    }
  | {
      event: "profile_link_click";
      platform: "linkedin" | "github";
      link_location: "navbar" | "footer" | "contact" | "about";
    }
  | {
      event: "email_contact_click";
      link_location: "contact" | "footer";
    }
  | {
      event: "contact_cta_click";
      cta_location: "hero" | "project_page" | "resume_page" | "footer";
      cta_label: string;
    };

export const pushAnalyticsEvent = (event: AnalyticsEvent) => {
  if (
    typeof window === "undefined" ||
    !isProductionAnalyticsLocation() ||
    !isPublicAnalyticsPath(window.location.pathname) ||
    !isAnalyticsConsentGranted()
  ) {
    return false;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
  return true;
};

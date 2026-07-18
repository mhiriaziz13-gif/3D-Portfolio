"use client";

import { useAnalyticsConsent } from "@/components/analytics/analytics-consent-provider";

export const CookiePreferencesButton = () => {
  const consent = useAnalyticsConsent();

  if (!consent.isAvailable) return null;

  return (
    <button
      type="button"
      onClick={consent.openPreferences}
      className="transition hover:text-cyan-100"
    >
      Analytics preferences
    </button>
  );
};

"use client";

import { useConsent } from "@/components/consent/consent-manager";

export const CookiePreferencesButton = () => {
  const consent = useConsent();

  if (!consent?.isAvailable) return null;

  return (
    <button
      type="button"
      onClick={consent.openPreferences}
      className="transition hover:text-cyan-100"
    >
      Cookie preferences
    </button>
  );
};

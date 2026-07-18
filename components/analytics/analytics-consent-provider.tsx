"use client";

import {
  createContext,
  Suspense,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

import { ClarityLoader } from "@/components/analytics/clarity-loader";
import { GoogleTagManagerLoader } from "@/components/analytics/google-tag-manager-loader";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  type AnalyticsConsentValue,
  clearAnalyticsCookies,
  isProductionAnalyticsLocation,
  isPublicAnalyticsPath,
  readStoredAnalyticsConsent,
  writeStoredAnalyticsConsent,
} from "@/lib/analytics/consent";

type AnalyticsConsentContextValue = {
  consent: AnalyticsConsentValue;
  isAvailable: boolean;
  isPreferencesOpen: boolean;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | null>(null);
const CONSENT_CHANGE_EVENT = "analytics-consent-change";

const subscribeToConsent = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
};

const updateGoogleConsent = (value: "granted" | "denied") => {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
  window.gtag("consent", "update", {
    analytics_storage: value,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.dataLayer.push({
    event: "analytics_consent_updated",
    analytics_consent: value,
  });
};

export const AnalyticsConsentProvider = ({
  children,
  analyticsEnabled,
  gtmId,
  clarityProjectId,
}: {
  children: React.ReactNode;
  analyticsEnabled: boolean;
  gtmId?: string;
  clarityProjectId?: string;
}) => {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    readStoredAnalyticsConsent,
    (): AnalyticsConsentValue => "unknown",
  );
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const isAvailable =
    hydrated &&
    analyticsEnabled &&
    isPublicAnalyticsPath(pathname) &&
    isProductionAnalyticsLocation();

  const saveConsent = (value: "granted" | "denied") => {
    if (consent === value) {
      setIsPreferencesOpen(false);
      return;
    }
    writeStoredAnalyticsConsent(value);
    updateGoogleConsent(value);
    if (value === "denied") {
      window.clarity?.("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: "denied",
      });
      clearAnalyticsCookies();
    }
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    setIsPreferencesOpen(false);
  };

  const contextValue: AnalyticsConsentContextValue = {
    consent,
    isAvailable,
    isPreferencesOpen,
    acceptAnalytics: () => saveConsent("granted"),
    rejectAnalytics: () => saveConsent("denied"),
    openPreferences: () => {
      if (isAvailable) setIsPreferencesOpen(true);
    },
    closePreferences: () => setIsPreferencesOpen(false),
  };

  const showBanner =
    hydrated && isAvailable && consent === "unknown" && !isPreferencesOpen;

  return (
    <AnalyticsConsentContext.Provider value={contextValue}>
      {children}
      <GoogleTagManagerLoader
        enabled={analyticsEnabled}
        containerId={gtmId}
      />
      <Suspense fallback={null}>
        <PageViewTracker enabled={analyticsEnabled} />
      </Suspense>
      <ClarityLoader
        enabled={analyticsEnabled}
        projectId={clarityProjectId}
      />

      {showBanner && (
        <section
          aria-label="Analytics consent"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-4xl rounded-2xl border border-white/15 bg-[#0b0920]/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <h2 className="text-lg font-semibold">Your privacy choices</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
            Optional analytics help measure aggregate visits and improve the portfolio. Advertising storage and personalization remain disabled.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => saveConsent("granted")} className="rounded-lg border border-cyan-200/60 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#030014] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">
              Accept analytics
            </button>
            <button type="button" onClick={() => saveConsent("denied")} className="rounded-lg border border-cyan-200/60 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">
              Reject analytics
            </button>
            <button type="button" onClick={() => setIsPreferencesOpen(true)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-200 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">
              Manage preferences
            </button>
          </div>
        </section>
      )}

      {hydrated && isAvailable && isPreferencesOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <section role="dialog" aria-modal="true" aria-labelledby="analytics-preferences-title" className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b0920] p-6 text-white shadow-2xl">
            <h2 id="analytics-preferences-title" className="text-xl font-semibold">Analytics preferences</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">Essential security and authentication remain active. Choose whether Google Analytics and Microsoft Clarity may measure this public visit.</p>
            <p className="mt-4 text-sm text-gray-400" role="status">Current choice: {consent}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => saveConsent("granted")} className="rounded-lg border border-cyan-200/60 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#030014] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">Accept analytics</button>
              <button type="button" onClick={() => saveConsent("denied")} className="rounded-lg border border-cyan-200/60 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">Reject analytics</button>
              <button type="button" onClick={() => setIsPreferencesOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-300 sm:col-span-2">Cancel</button>
            </div>
          </section>
        </div>
      )}
    </AnalyticsConsentContext.Provider>
  );
};

export const useAnalyticsConsent = () => {
  const context = useContext(AnalyticsConsentContext);
  if (!context) throw new Error("useAnalyticsConsent must be used within AnalyticsConsentProvider");
  return context;
};

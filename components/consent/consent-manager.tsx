"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

import { GoogleTagManager } from "@/components/analytics/google-tag-manager";
import { DeferredAnalytics } from "@/components/main/deferred-analytics";
import { MicrosoftClarity } from "@/components/main/microsoft-clarity";
import {
  setAnalyticsCollectionEnabled,
  updateGoogleConsent,
} from "@/lib/analytics/data-layer";
import { isPublicAnalyticsRoute } from "@/lib/analytics/routes";

type ConsentPreference = "accepted" | "rejected";

type ConsentContextValue = {
  isAvailable: boolean;
  openPreferences: () => void;
};

const CONSENT_STORAGE_KEY = "analytics-consent";
const CONSENT_CHANGE_EVENT = "analytics-consent-change";
const ConsentContext = createContext<ConsentContextValue | null>(null);

const getStoredPreference = (): ConsentPreference | null => {
  const storedPreference = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return storedPreference === "accepted" || storedPreference === "rejected"
    ? storedPreference
    : null;
};

const subscribeToPreference = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
};

export const ConsentManager = ({
  children,
  analyticsEnabled,
  gtmContainerId,
  clarityProjectId,
}: {
  children: React.ReactNode;
  analyticsEnabled: boolean;
  gtmContainerId?: string;
  clarityProjectId?: string;
}) => {
  const pathname = usePathname();
  const isCollectionRoute =
    analyticsEnabled && isPublicAnalyticsRoute(pathname);
  const preference = useSyncExternalStore(
    subscribeToPreference,
    getStoredPreference,
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [isManaging, setIsManaging] = useState(false);
  const [statisticsEnabled, setStatisticsEnabled] = useState(false);

  useEffect(() => {
    const hasAnalyticsConsent =
      isCollectionRoute && preference === "accepted";
    setAnalyticsCollectionEnabled(hasAnalyticsConsent);
    updateGoogleConsent(hasAnalyticsConsent ? "granted" : "denied");

    return () => setAnalyticsCollectionEnabled(false);
  }, [isCollectionRoute, preference]);

  const savePreference = (nextPreference: ConsentPreference) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nextPreference);
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    setStatisticsEnabled(nextPreference === "accepted");
    setIsManaging(false);
  };

  const contextValue = useMemo(
    () => ({
      isAvailable: isCollectionRoute,
      openPreferences: () => {
        if (!isCollectionRoute) return;
        setStatisticsEnabled(preference === "accepted");
        setIsManaging(true);
      },
    }),
    [isCollectionRoute, preference],
  );

  const showBanner =
    isHydrated && isCollectionRoute && preference === null && !isManaging;

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}

      {isCollectionRoute && gtmContainerId && (
        <GoogleTagManager containerId={gtmContainerId} />
      )}

      {isCollectionRoute && preference === "accepted" && (
        <>
          {clarityProjectId && <MicrosoftClarity projectId={clarityProjectId} />}
          <DeferredAnalytics />
        </>
      )}

      {showBanner && (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-4xl rounded-2xl border border-white/15 bg-[#0b0920]/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <h2 className="text-lg font-semibold">Your privacy choices</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
            We use optional analytics cookies to understand how the portfolio is used. You can accept or reject statistics with the same ease.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => savePreference("accepted")}
              className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#030014] transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            >
              Accepter les statistiques
            </button>
            <button
              type="button"
              onClick={() => savePreference("rejected")}
              className="rounded-lg border border-cyan-200/60 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            >
              Refuser les statistiques
            </button>
            <button
              type="button"
              onClick={() => setIsManaging(true)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-200 underline decoration-white/40 underline-offset-4 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            >
              Gérer mes préférences
            </button>
          </div>
        </section>
      )}

      {isCollectionRoute && isManaging && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b0920] p-6 text-white shadow-2xl"
          >
            <h2 id="cookie-preferences-title" className="text-xl font-semibold">
              Cookie preferences
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Essential storage is always active. Analytics is optional and can be changed at any time.
            </p>
            <label className="mt-6 flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-white/10 p-4">
              <span>
                <span className="block font-medium">Analytics</span>
                <span className="mt-1 block text-sm leading-5 text-gray-400">
                  Allows Google Analytics and Microsoft Clarity to measure visits and usage.
                </span>
              </span>
              <input
                type="checkbox"
                checked={statisticsEnabled}
                onChange={(event) => setStatisticsEnabled(event.target.checked)}
                className="mt-1 h-5 w-5 accent-cyan-300"
              />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {preference !== null && (
                <button
                  type="button"
                  onClick={() => setIsManaging(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => savePreference(statisticsEnabled ? "accepted" : "rejected")}
                className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#030014] transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              >
                Save preferences
              </button>
            </div>
          </section>
        </div>
      )}
    </ConsentContext.Provider>
  );
};

export const useConsent = () => useContext(ConsentContext);

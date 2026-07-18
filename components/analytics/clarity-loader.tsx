"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAnalyticsConsent } from "@/components/analytics/analytics-consent-provider";
import {
  isProductionAnalyticsLocation,
  isPublicAnalyticsPath,
} from "@/lib/analytics/consent";

export const ClarityLoader = ({
  enabled,
  projectId,
}: {
  enabled: boolean;
  projectId?: string;
}) => {
  const pathname = usePathname();
  const { consent } = useAnalyticsConsent();

  useEffect(() => {
    const canCollect =
      consent === "granted" &&
      enabled &&
      Boolean(projectId) &&
      isProductionAnalyticsLocation() &&
      isPublicAnalyticsPath(pathname);
    if (!canCollect) {
      window.clarity?.("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: "denied",
      });
      return;
    }
    if (!projectId) return;

    window.clarity =
      window.clarity ||
      function clarity(...args: unknown[]) {
        (window.clarity!.q = window.clarity!.q || []).push(args);
      };

    let cancelled = false;
    void import("@microsoft/clarity").then(({ default: Clarity }) => {
      if (cancelled) return;
      if (!window.microsoftClarityInitialized) {
        Clarity.init(projectId);
        window.microsoftClarityInitialized = true;
      }
      Clarity.consentV2({
        ad_Storage: "denied",
        analytics_Storage: "granted",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [consent, enabled, pathname, projectId]);

  return null;
};

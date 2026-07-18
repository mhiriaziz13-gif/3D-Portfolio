"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useAnalyticsConsent } from "@/components/analytics/analytics-consent-provider";
import {
  isProductionAnalyticsLocation,
  isPublicAnalyticsPath,
} from "@/lib/analytics/consent";

export const PageViewTracker = ({ enabled }: { enabled: boolean }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent } = useAnalyticsConsent();
  const lastPageViewSignature = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (consent !== "granted") {
      lastPageViewSignature.current = null;
      return;
    }
    if (
      !enabled ||
      !isProductionAnalyticsLocation() ||
      !isPublicAnalyticsPath(pathname) ||
      !window.dataLayer
    ) {
      return;
    }
    const pagePath = `${pathname}${search ? `?${search}` : ""}`;
    const signature = `${pagePath}|${document.title}`;
    if (lastPageViewSignature.current === signature) return;

    window.dataLayer.push({
      event: "virtual_page_view",
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
    lastPageViewSignature.current = signature;
  }, [consent, enabled, pathname, search]);

  return null;
};

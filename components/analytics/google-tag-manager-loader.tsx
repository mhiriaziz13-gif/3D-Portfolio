"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  isProductionAnalyticsLocation,
  isPublicAnalyticsPath,
} from "@/lib/analytics/consent";

const GTM_SCRIPT_ID = "google-tag-manager";

export const GoogleTagManagerLoader = ({
  enabled,
  containerId,
}: {
  enabled: boolean;
  containerId?: string;
}) => {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !enabled ||
      !containerId ||
      !/^GTM-[A-Z0-9]+$/.test(containerId) ||
      !isProductionAnalyticsLocation() ||
      !isPublicAnalyticsPath(pathname) ||
      window.googleTagManagerLoaded ||
      document.getElementById(GTM_SCRIPT_ID)
    ) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.id = GTM_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    document.head.appendChild(script);
    window.googleTagManagerLoaded = true;
  }, [containerId, enabled, pathname]);

  return null;
};

"use client";

import dynamic from "next/dynamic";
import Script from "next/script";
import { useEffect, useState } from "react";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((module) => module.Analytics),
  { ssr: false },
);
const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then(
      (module) => module.SpeedInsights,
    ),
  { ssr: false },
);

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const ANALYTICS_DEFER_MS = 12000;

export const DeferredAnalytics = ({
  gaMeasurementId,
}: {
  gaMeasurementId?: string;
}) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idleWindow = window as WindowWithIdleCallback;
    let idleHandle: number | undefined;
    let timer: number | undefined;
    let cancelled = false;

    const activate = () => {
      if (!cancelled) setReady(true);
    };

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (idleWindow.requestIdleCallback) {
          idleHandle = idleWindow.requestIdleCallback(activate, {
            timeout: 3000,
          });
        } else {
          activate();
        }
      }, ANALYTICS_DEFER_MS);
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];

    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, activate, {
        once: true,
        passive: true,
      }),
    );

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, activate),
      );
      if (timer !== undefined) window.clearTimeout(timer);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');`}
          </Script>
        </>
      )}
    </>
  );
};

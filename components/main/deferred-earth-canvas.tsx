"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const EarthCanvas = dynamic(
  () =>
    import("@/components/canvas/earth-canvas").then(
      (module) => module.EarthCanvas,
    ),
  { ssr: false },
);

type NavigatorWithDeviceHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

const getDeviceMode = () => {
  if (typeof window === "undefined") {
    return { staticOnly: true, lowPower: true };
  }

  const hintedNavigator = navigator as NavigatorWithDeviceHints;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const saveData = Boolean(hintedNavigator.connection?.saveData);
  const lowPower =
    window.innerWidth < 1024 ||
    (hintedNavigator.deviceMemory ?? 8) <= 4 ||
    (hintedNavigator.hardwareConcurrency ?? 8) <= 4;

  return { staticOnly: reducedMotion || saveData, lowPower };
};

export const DeferredEarthCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const [{ staticOnly, lowPower }] = useState(getDeviceMode);

  useEffect(() => {
    const handleVisibility = () => {
      setPageVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isNear = entry.isIntersecting;
        setNearViewport(isNear);
        if (isNear && !staticOnly) setHasLoaded(true);
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [staticOnly]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[320px] w-full">
      <div className="earth-static-fallback absolute inset-0" />
      {hasLoaded && (
        <div className="absolute inset-0">
          <EarthCanvas
            active={nearViewport && pageVisible}
            lowPower={lowPower}
          />
        </div>
      )}
    </div>
  );
};

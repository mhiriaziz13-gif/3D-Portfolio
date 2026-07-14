"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const StarsCanvas = dynamic(
  () =>
    import("@/components/main/star-background").then(
      (module) => module.StarsCanvas,
    ),
  { ssr: false },
);

type NavigatorWithDeviceHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const DEFER_AFTER_LOAD_MS = 12000;

const getLowPowerHint = () => {
  if (typeof window === "undefined") return false;
  const hintedNavigator = navigator as NavigatorWithDeviceHints;

  return (
    window.innerWidth < 1024 ||
    (hintedNavigator.deviceMemory ?? 8) <= 4 ||
    (hintedNavigator.hardwareConcurrency ?? 8) <= 4
  );
};

export const DeferredStarBackground = () => {
  const pathname = usePathname();
  const skipThree =
    pathname.startsWith("/admin") || pathname.startsWith("/auth");
  const [shouldLoad, setShouldLoad] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const [lowPower] = useState(getLowPowerHint);

  useEffect(() => {
    if (skipThree) return;

    const hintedNavigator = navigator as NavigatorWithDeviceHints;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const saveData = Boolean(hintedNavigator.connection?.saveData);
    if (reducedMotion || saveData) {
      return;
    }

    const idleWindow = window as WindowWithIdleCallback;
    let delayTimer: number | undefined;
    let idleHandle: number | undefined;
    let cancelled = false;

    const activate = () => {
      if (!cancelled) {
        setShouldLoad(true);
      }
    };

    const scheduleAfterLoad = () => {
      delayTimer = window.setTimeout(() => {
        if (idleWindow.requestIdleCallback) {
          idleHandle = idleWindow.requestIdleCallback(activate, {
            timeout: 2000,
          });
        } else {
          activate();
        }
      }, DEFER_AFTER_LOAD_MS);
    };

    const handleVisibility = () => {
      setPageVisible(document.visibilityState === "visible");
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
    document.addEventListener("visibilitychange", handleVisibility);

    if (document.readyState === "complete") {
      scheduleAfterLoad();
    } else {
      window.addEventListener("load", scheduleAfterLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleAfterLoad);
      document.removeEventListener("visibilitychange", handleVisibility);
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, activate),
      );
      if (delayTimer !== undefined) window.clearTimeout(delayTimer);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
    };
  }, [skipThree]);

  return (
    <div
      className="deferred-stars-fallback fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    >
      {!skipThree && shouldLoad && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${canvasReady ? "opacity-100" : "opacity-0"}`}
        >
          <StarsCanvas
            active={pageVisible}
            lowPower={lowPower}
            onReady={() => setCanvasReady(true)}
          />
        </div>
      )}
    </div>
  );
};

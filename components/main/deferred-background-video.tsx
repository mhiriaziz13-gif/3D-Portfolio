"use client";

import { useEffect, useRef, useState } from "react";

type NavigatorWithSaveData = Navigator & {
  connection?: { saveData?: boolean };
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type DeferredBackgroundVideoProps = {
  src: string;
  className: string;
  rootMargin?: string;
  deferAfterLoadMs?: number;
};

const getVideoCapability = () => {
  if (typeof window === "undefined") return false;
  const hintedNavigator = navigator as NavigatorWithSaveData;

  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(max-width: 767px)").matches &&
    !hintedNavigator.connection?.saveData
  );
};

export const DeferredBackgroundVideo = ({
  src,
  className,
  rootMargin = "320px 0px",
  deferAfterLoadMs = 12000,
}: DeferredBackgroundVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canUseVideo] = useState(getVideoCapability);
  const [nearViewport, setNearViewport] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    const handleVisibility = () => {
      setPageVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (!canUseVideo) return;

    const idleWindow = window as WindowWithIdleCallback;
    let delayTimer: number | undefined;
    let idleHandle: number | undefined;

    const markReady = () => setIdleReady(true);
    const markIdle = () => {
      delayTimer = window.setTimeout(() => {
        if (idleWindow.requestIdleCallback) {
          idleHandle = idleWindow.requestIdleCallback(
            markReady,
            { timeout: 2000 },
          );
        } else {
          markReady();
        }
      }, deferAfterLoadMs);
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "wheel",
    ];

    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, markReady, {
        once: true,
        passive: true,
      }),
    );

    if (document.readyState === "complete") {
      markIdle();
    } else {
      window.addEventListener("load", markIdle, { once: true });
    }

    return () => {
      window.removeEventListener("load", markIdle);
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, markReady),
      );
      if (delayTimer !== undefined) window.clearTimeout(delayTimer);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
    };
  }, [canUseVideo, deferAfterLoadMs]);

  useEffect(() => {
    if (canUseVideo && nearViewport && idleReady) {
      const timer = window.setTimeout(() => setHasActivated(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [canUseVideo, idleReady, nearViewport]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasActivated) return;

    if (nearViewport && pageVisible) {
      void video.play().catch(() => {
        // Autoplay can be blocked by browser policy; the static background remains.
      });
    } else {
      video.pause();
    }
  }, [hasActivated, nearViewport, pageVisible]);

  return (
    <video
      ref={videoRef}
      src={hasActivated ? src : undefined}
      className={className}
      preload="none"
      muted
      loop
      playsInline
      tabIndex={-1}
      aria-hidden="true"
    />
  );
};

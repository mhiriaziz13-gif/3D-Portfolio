"use client";

import { useEffect } from "react";

const revealFallback = (image: HTMLImageElement) => {
  const container = image.closest<HTMLElement>(
    "[data-image-fallback-container]",
  );
  const fallback = container?.querySelector<HTMLElement>(
    "[data-image-fallback-content]",
  );

  image.classList.add("hidden");
  image.setAttribute("aria-hidden", "true");
  fallback?.classList.remove("hidden");

  const fallbackBackground = container?.dataset.fallbackBackground;
  if (container && fallbackBackground) {
    container.style.backgroundColor = fallbackBackground;
  }
};

const handleFailedImage = (image: HTMLImageElement) => {
  if (!image.dataset.imageFallback) return;

  const fallbackSrc = image.dataset.fallbackSrc;
  if (fallbackSrc && image.dataset.fallbackAttempted !== "true") {
    image.dataset.fallbackAttempted = "true";
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.src = fallbackSrc;
    return;
  }

  revealFallback(image);
};

export const ImageFallbackController = () => {
  useEffect(() => {
    const handleError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        handleFailedImage(event.target);
      }
    };

    document.addEventListener("error", handleError, true);

    document
      .querySelectorAll<HTMLImageElement>("img[data-image-fallback]")
      .forEach((image) => {
        if (image.complete && image.naturalWidth === 0) {
          handleFailedImage(image);
        }
      });

    return () => document.removeEventListener("error", handleError, true);
  }, []);

  return null;
};

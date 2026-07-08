"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { fallbackPortfolioContent } from "@/data/fallback-portfolio";

const ROTATION_INTERVAL = 2600;

export const DynamicTitle = ({ titles = fallbackPortfolioContent.hero.dynamicTitles }: { titles?: readonly string[] }) => {
  const shouldReduceMotion = useReducedMotion();
  const safeTitles = titles.length ? [...titles] : fallbackPortfolioContent.hero.dynamicTitles;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion || safeTitles.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeTitles.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(interval);
  }, [safeTitles.length, shouldReduceMotion]);

  const title = safeTitles[activeIndex] ?? safeTitles[0];

  return (
    <span
      className="inline-grid min-h-[1.75rem] min-w-full sm:min-w-[29rem]"
      aria-live="polite"
      aria-atomic="true"
    >
      {shouldReduceMotion ? (
        <span className="text-white">{title}</span>
      ) : (
        <motion.span
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-white"
        >
          {title}
        </motion.span>
      )}
    </span>
  );
};
"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

import {
  pushAnalyticsEvent,
  type AnalyticsEvent,
} from "@/lib/analytics/data-layer";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  analyticsEvent: AnalyticsEvent | AnalyticsEvent[];
};

export const TrackedLink = ({
  analyticsEvent,
  onClick,
  ...linkProps
}: TrackedLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const analyticsEvents = Array.isArray(analyticsEvent)
      ? analyticsEvent
      : [analyticsEvent];
    analyticsEvents.forEach(pushAnalyticsEvent);
    onClick?.(event);
  };

  return <Link {...linkProps} onClick={handleClick} />;
};

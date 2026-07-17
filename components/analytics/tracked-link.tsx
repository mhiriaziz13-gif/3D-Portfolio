"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

import {
  pushAnalyticsEvent,
  type AnalyticsEvent,
} from "@/lib/analytics/data-layer";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  analyticsEvent: AnalyticsEvent;
};

export const TrackedLink = ({
  analyticsEvent,
  onClick,
  ...linkProps
}: TrackedLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    pushAnalyticsEvent(analyticsEvent);
    onClick?.(event);
  };

  return <Link {...linkProps} onClick={handleClick} />;
};

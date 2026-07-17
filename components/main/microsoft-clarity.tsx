"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

export const MicrosoftClarity = ({ projectId }: { projectId: string }) => {
  useEffect(() => {
    Clarity.init(projectId);
    Clarity.consentV2({ ad_Storage: "denied", analytics_Storage: "granted" });

    return () => {
      Clarity.consentV2({ ad_Storage: "denied", analytics_Storage: "denied" });
    };
  }, [projectId]);

  return null;
};

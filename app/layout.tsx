export const revalidate = 60;

import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";

import { DeferredAnalytics } from "@/components/main/deferred-analytics";
import { DeferredStarBackground } from "@/components/main/deferred-star-background";
import { Footer } from "@/components/main/footer";
import { ImageFallbackController } from "@/components/main/image-fallback-controller";
import { MicrosoftClarity } from "@/components/main/microsoft-clarity";
import { Navbar } from "@/components/main/navbar";
import { siteConfig } from "@/config";
import { getPortfolioContent } from "@/lib/cms";
import { cn } from "@/lib/utils";

import "./globals.css";

export const viewport: Viewport = { themeColor: "#030014" };
export const metadata: Metadata = siteConfig;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-W7WJF6YR9X";
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "xmuct2445j";

export default async function RootLayout({ children }: PropsWithChildren) {
  const content = await getPortfolioContent();

  return (
    <html lang="en">
      <body className={cn("bg-[#030014] overflow-y-scroll overflow-x-hidden font-sans")}>
        <MicrosoftClarity projectId={clarityProjectId} />
        <DeferredStarBackground />
        <ImageFallbackController />
        <Navbar profile={content.profile} navLinks={content.navLinks} />
        {children}
        <Footer profile={content.profile} />
        <DeferredAnalytics gaMeasurementId={gaMeasurementId} />
      </body>
    </html>
  );
}

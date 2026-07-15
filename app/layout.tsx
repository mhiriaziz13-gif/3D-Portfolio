export const revalidate = 60;

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { PropsWithChildren } from "react";

import { DeferredAnalytics } from "@/components/main/deferred-analytics";
import { DeferredStarBackground } from "@/components/main/deferred-star-background";
import { Footer } from "@/components/main/footer";
import { ImageFallbackController } from "@/components/main/image-fallback-controller";
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
      <head>
        <Script id="microsoft-clarity" strategy="beforeInteractive">
          {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarityProjectId}");`}
        </Script>
      </head>
      <body className={cn("bg-[#030014] overflow-y-scroll overflow-x-hidden font-sans")}>
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

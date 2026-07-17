export const revalidate = 60;

import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
const gtmContainerId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

export default async function RootLayout({ children }: PropsWithChildren) {
  const content = await getPortfolioContent();

  return (
    <html lang="en">
      {gtmContainerId && (
        <head>
          <Script id="google-tag-manager" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmContainerId}');`}
          </Script>
        </head>
      )}
      <body className={cn("bg-[#030014] overflow-y-scroll overflow-x-hidden font-sans")}>
        {gtmContainerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
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

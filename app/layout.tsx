export const revalidate = 60;

import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";

import { Footer } from "@/components/main/footer";
import { Navbar } from "@/components/main/navbar";
import { StarsCanvas } from "@/components/main/star-background";
import { siteConfig } from "@/config";
import { getPortfolioContent } from "@/lib/cms";
import { cn } from "@/lib/utils";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#030014",
};

export const metadata: Metadata = siteConfig;

export default async function RootLayout({ children }: PropsWithChildren) {
  const content = await getPortfolioContent();

  return (
    <html lang="en">
      <body
        className={cn(
          "bg-[#030014] overflow-y-scroll overflow-x-hidden font-sans"
        )}
      >
        <StarsCanvas />
        <Navbar profile={content.profile} navLinks={content.navLinks} />
        {children}
        <Footer profile={content.profile} />
      </body>
    </html>
  );
}
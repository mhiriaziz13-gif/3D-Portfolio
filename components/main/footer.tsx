import { EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";

import { CookiePreferencesButton } from "@/components/consent/cookie-preferences-button";
import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { ProfileContent } from "@/lib/cms-types";

export const Footer = ({ profile = fallbackPortfolioContent.profile }: { profile?: ProfileContent }) => {
  return (
    <footer className="relative z-[20] w-full bg-transparent px-6 py-10 text-gray-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">{profile.name}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
            {profile.mainTitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm md:items-end">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-cyan-200" />
            {profile.location}
          </span>
          <Link
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 transition hover:text-cyan-100"
          >
            <EnvelopeIcon className="h-4 w-4 text-purple-200" />
            {profile.email}
          </Link>
          <Link
            href={profile.github}
            aria-label={`${profile.githubLabel} — GitHub profile`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 transition hover:text-cyan-100"
          >
            <FaGithub className="h-4 w-4 text-gray-200" />
            {profile.githubLabel}
          </Link>
          <Link
            href={profile.linkedIn}
            aria-label={`${profile.linkedInLabel} — LinkedIn profile`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 transition hover:text-cyan-100"
          >
            <FaLinkedinIn className="h-4 w-4 text-[#0A66C2]" />
            {profile.linkedInLabel}
          </Link>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-7xl text-sm text-gray-400">
        &copy; {profile.name} {new Date().getFullYear()}. All rights reserved.
      </p>
      <nav aria-label="Footer navigation" className="mx-auto mt-6 flex max-w-7xl flex-wrap gap-x-5 gap-y-3 text-sm text-gray-400">
        {[["About","/about"],["Expertise","/expertise"],["Projects","/projects"],["Experience","/experience"],["Education","/education"],["Certifications","/certifications"],["Resume","/resume"],["Contact","/contact"]].map(([label, href]) => <Link key={href} href={href} className="hover:text-cyan-100">{label}</Link>)}
        <CookiePreferencesButton />
      </nav>
    </footer>
  );
};

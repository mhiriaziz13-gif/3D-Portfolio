"use client";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { NavLink, ProfileContent } from "@/lib/cms-types";

export const Navbar = ({ profile = fallbackPortfolioContent.profile, navLinks = fallbackPortfolioContent.navLinks }: { profile?: ProfileContent; navLinks?: NavLink[] }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 h-[65px] w-full bg-[#030014]/55 px-4 shadow-lg shadow-[#2A0E61]/40 backdrop-blur-md sm:px-10">
      <nav
        className="mx-auto flex h-full w-full max-w-7xl items-center justify-between"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7042f88b] bg-[#08021c] text-sm font-bold text-white shadow-[0_0_24px_rgba(112,66,248,0.35)]">
            {profile.initials}
          </span>
          <span className="hidden font-semibold text-gray-200 md:inline">
            {profile.name}
          </span>
        </Link>

        <div className="hidden h-full flex-row items-center md:flex">
          <div className="flex items-center gap-1 rounded-full border border-[rgba(112,66,248,0.38)] bg-[rgba(3,0,20,0.5)] px-3 py-2 text-sm text-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 md:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label="Toggle navigation"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="absolute left-0 top-[65px] w-full border-y border-white/10 bg-[#030014]/95 p-5 text-gray-200 shadow-lg shadow-[#2A0E61]/30 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="rounded-lg px-4 py-3 transition hover:bg-white/10 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
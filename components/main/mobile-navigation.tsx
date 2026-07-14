"use client";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

import type { NavLink } from "@/lib/cms-types";

export const MobileNavigation = ({ navLinks }: { navLinks: NavLink[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 md:hidden"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label="Toggle navigation"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <div
          id="mobile-navigation"
          className="absolute left-0 top-[65px] w-full border-y border-white/10 bg-[#030014]/95 p-5 text-gray-200 shadow-lg shadow-[#2A0E61]/30 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                prefetch={false}
                aria-label={link.href === "/resume" ? "View CV" : undefined}
                className="rounded-lg px-4 py-3 transition hover:bg-white/10 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                onClick={() => setIsOpen(false)}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

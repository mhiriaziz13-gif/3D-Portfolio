"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { ProfileContent } from "@/lib/cms-types";
import { isHttpsUrl } from "@/lib/utils";

export const AvatarCard = ({ profile = fallbackPortfolioContent.profile }: { profile?: ProfileContent }) => {
  const shouldReduceMotion = useReducedMotion();
  const [hasImageError, setHasImageError] = useState(false);
  const showAvatar = Boolean(profile.avatarPath) && !hasImageError;

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative mx-auto flex aspect-square w-full max-w-[25rem] items-center justify-center rounded-full border border-[#7042f88b] bg-[#120829]/70 shadow-[0_0_70px_rgba(112,66,248,0.28)] backdrop-blur-md"
      aria-label={`${profile.name} portrait`}
    >
      <div className="absolute inset-4 rounded-full border border-cyan-300/20" />
      <div className="absolute inset-8 rounded-full border border-purple-300/20" />
      <div className="absolute -left-2 top-1/2 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
      <div className="absolute right-6 top-7 h-2 w-2 rounded-full bg-purple-300 shadow-[0_0_22px_rgba(216,180,254,0.9)]" />
      <div className="relative h-[82%] w-[82%] overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-[#190a44] via-[#1f1548] to-[#073452] shadow-[inset_0_0_28px_rgba(255,255,255,0.08)]">
        {showAvatar ? (
          <Image
            src={profile.avatarPath}
            alt={profile.name}
            fill
            sizes="(min-width: 640px) 328px, 82vw"
            className="object-cover"
            priority
            unoptimized={isHttpsUrl(profile.avatarPath)}
            onError={() => setHasImageError(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-5xl font-bold text-white">
            {profile.initials}
          </span>
        )}
      </div>
    </motion.div>
  );
};

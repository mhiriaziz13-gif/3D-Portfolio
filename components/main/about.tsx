"use client";

import { SparklesIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

import { AvatarCard } from "@/components/sub/avatar-card";
import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { AboutContentData, ProfileContent } from "@/lib/cms-types";
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/lib/motion";

type AboutProps = {
  profile?: ProfileContent;
  about?: AboutContentData;
};

export const About = ({ profile = fallbackPortfolioContent.profile, about = fallbackPortfolioContent.about }: AboutProps) => {
  const avatarProfile = { ...profile, avatarPath: about.avatarUrl || profile.avatarPath };

  return (
    <motion.section
      id="about"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      className="relative z-[20] mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 py-24 lg:flex-row lg:px-12"
    >
      <motion.div variants={slideInFromLeft(0.2)} className="w-full lg:w-[42%]">
        <AvatarCard profile={avatarProfile} />
      </motion.div>

      <div className="flex w-full flex-col gap-6 lg:w-[58%]">
        <motion.div
          variants={slideInFromTop}
          className="Welcome-box border border-[#7042f88b] px-[7px] py-[8px] opacity-[0.9]"
        >
          <SparklesIcon className="mr-[10px] h-5 w-5 text-[#b49bff]" />
          <p className="Welcome-text text-[13px]">About Ahmed</p>
        </motion.div>

        <motion.h2
          variants={slideInFromRight(0.35)}
          className="text-3xl font-semibold text-white sm:text-4xl"
        >
          {about.title}
        </motion.h2>

        <motion.p
          variants={slideInFromRight(0.5)}
          className="max-w-3xl text-base leading-8 text-gray-300 sm:text-lg"
        >
          {about.body}
        </motion.p>

        <motion.ul
          variants={slideInFromRight(0.65)}
          className="grid gap-3 text-sm leading-6 text-gray-300 md:grid-cols-3"
        >
          {about.highlights.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
              <span>{item}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          variants={slideInFromRight(0.8)}
          className="flex flex-wrap gap-3 text-sm text-gray-300"
        >
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2">
            {profile.location}
          </span>
          <span className="rounded-full border border-purple-300/30 bg-purple-300/10 px-4 py-2">
            {profile.availability}
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
};
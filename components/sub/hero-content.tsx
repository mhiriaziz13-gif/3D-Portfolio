"use client";

import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";

import { DynamicTitle } from "@/components/sub/dynamic-title";
import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { HeroContentData, ProfileContent } from "@/lib/cms-types";
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/lib/motion";

type HeroContentProps = {
  profile?: ProfileContent;
  hero?: HeroContentData;
};

export const HeroContent = ({ profile = fallbackPortfolioContent.profile, hero = fallbackPortfolioContent.hero }: HeroContentProps) => {
  return (
    <motion.section
      id="home"
      initial="hidden"
      animate="visible"
      className="relative z-[20] flex min-h-screen w-full flex-col items-center justify-center gap-10 px-6 pt-28 text-center lg:flex-row lg:px-20 lg:text-left"
    >
      <div className="flex h-full w-full max-w-3xl flex-col justify-center gap-5">
        <motion.div
          variants={slideInFromTop}
          className="Welcome-box mx-auto border border-[#7042f88b] px-[7px] py-[8px] opacity-[0.9] lg:mx-0"
        >
          <SparklesIcon className="mr-[10px] h-5 w-5 text-[#b49bff]" />
          <p className="Welcome-text text-[13px]">{hero.eyebrow}</p>
        </motion.div>

        <motion.div
          variants={slideInFromLeft(0.4)}
          className="mt-4 flex flex-col gap-5 text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
        >
          <h1>{hero.title}</h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-cyan-400 to-sky-300">
            {hero.tagline}
          </p>
        </motion.div>

        <motion.p
          variants={slideInFromLeft(0.65)}
          className="max-w-2xl text-base leading-8 text-gray-300 sm:text-lg"
        >
          {profile.shortProfile}
        </motion.p>

        <motion.div
          variants={slideInFromLeft(0.8)}
          className="min-h-[4.5rem] rounded-2xl border border-white/10 bg-[#08021c]/60 px-5 py-4 text-base text-gray-300 backdrop-blur-md sm:text-lg"
        >
          <span>Open to roles such as </span>
          <span className="font-semibold text-white">
            <DynamicTitle titles={hero.dynamicTitles} />
          </span>
        </motion.div>

        <motion.div variants={slideInFromLeft(1)} className="flex flex-col gap-3">
          <Link
            href={hero.primaryCtaHref}
            className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-lg px-7 py-4 text-center text-base font-bold text-white shadow-[0_0_32px_rgba(112,66,248,0.45)] transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:w-fit sm:self-center lg:self-start"
          >
            <EnvelopeIcon className="h-5 w-5" />
            {hero.primaryCtaLabel}
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Link
              href={hero.secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7042f88b] bg-white/5 px-5 py-3 text-center text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <BriefcaseIcon className="h-5 w-5" />
              {hero.secondaryCtaLabel}
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7042f88b] bg-white/5 px-5 py-3 text-center text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download CV
            </Link>
            <Link
              href={profile.github}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-center text-gray-300 transition hover:bg-white/10 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <FaGithub className="h-5 w-5" />
              GitHub
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={slideInFromRight(0.75)}
        className="flex h-full w-full max-w-xl items-center justify-center"
        aria-hidden="true"
      >
        <Image
          src="/hero-bg.svg"
          alt=""
          height={650}
          width={650}
          priority
          draggable={false}
          className="select-none"
        />
      </motion.div>
    </motion.section>
  );
};
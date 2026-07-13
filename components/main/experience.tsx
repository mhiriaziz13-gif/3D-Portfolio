"use client";

import { CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { ExperienceContent } from "@/lib/cms-types";
import { isHttpsUrl } from "@/lib/utils";

const getInitials = (company: string) =>
  company
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const TimelineMarker = ({
  experience,
}: {
  experience: ExperienceContent;
}) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const showLogo = Boolean(experience.logo) && failedLogo !== experience.logo;

  return (
    <div
      className="absolute left-1/2 top-0 flex h-24 w-24 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border border-white/25 text-base font-bold text-white shadow-[0_0_42px_rgba(112,66,248,0.5)]"
      style={{
        backgroundColor: showLogo ? "rgba(255,255,255,0.99)" : experience.iconBg,
      }}
      aria-hidden="true"
    >
      {showLogo && experience.logo ? (
        <Image
          src={experience.logo}
          alt=""
          fill
          sizes="96px"
          className="object-contain p-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]"
          unoptimized={isHttpsUrl(experience.logo)}
          onError={() => setFailedLogo(experience.logo ?? null)}
        />
      ) : (
        getInitials(experience.company)
      )}
    </div>
  );
};

const ExperienceCard = ({
  experience,
  index,
}: {
  experience: ExperienceContent;
  index: number;
}) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.08, 0.32), duration: 0.5 }}
      className="relative grid gap-5 md:grid-cols-[1fr_6rem_1fr]"
    >
      <div className="hidden md:block">
        {index % 2 === 0 && <TimelinePanel experience={experience} />}
      </div>

      <div className="pointer-events-none absolute left-12 top-0 h-full w-px bg-gradient-to-b from-purple-400/0 via-purple-400/50 to-cyan-300/0 md:relative md:left-auto md:top-auto md:mx-auto md:w-px">
        <TimelineMarker experience={experience} />
      </div>

      <div className="pl-32 md:pl-0">
        {index % 2 === 0 ? (
          <div className="md:hidden">
            <TimelinePanel experience={experience} />
          </div>
        ) : (
          <TimelinePanel experience={experience} />
        )}
      </div>
    </motion.article>
  );
};

const TimelinePanel = ({ experience }: { experience: ExperienceContent }) => {
  return (
    <div className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6 text-left shadow-xl shadow-[#2A0E61]/20 backdrop-blur-md">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">{experience.role}</h3>
        <p className="mt-1 text-base font-semibold text-cyan-100">
          {experience.company}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-400">
          <span className="inline-flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4 text-purple-200" />
            {experience.date}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-cyan-200" />
            {experience.location}
          </span>
        </div>
      </div>

      <ul className="ml-4 list-disc space-y-2 text-sm leading-6 text-gray-300">
        {experience.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
};

export const Experience = ({ experience = fallbackPortfolioContent.experience }: { experience?: ExperienceContent[] }) => {
  return (
    <section
      id="experience"
      className="relative z-[20] mx-auto flex w-full max-w-7xl flex-col px-6 py-24"
    >
      <p className="Welcome-text text-sm uppercase">What I have worked on</p>
      <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
        Work Experience
      </h2>

      <div className="mt-16 flex flex-col gap-10">
        {experience.map((item, index) => (
          <ExperienceCard
            key={`${item.company}-${item.date}`}
            experience={item}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

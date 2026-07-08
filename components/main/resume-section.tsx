import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { ResumeContent } from "@/lib/cms-types";

const DownloadAction = ({
  href,
  label,
  available,
}: {
  href: string;
  label: string;
  available: boolean;
}) => {
  const className =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300";

  if (!available || !href) {
    return (
      <span
        aria-disabled="true"
        className={`${className} cursor-not-allowed border border-white/10 bg-white/5 text-gray-500`}
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      download
      className={`${className} button-primary text-white`}
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      {label}
    </Link>
  );
};

const ResumeCard = ({ resume }: { resume: ResumeContent }) => {
  return (
    <article className="rounded-lg border border-white/10 bg-[#08021c]/75 p-5 shadow-lg shadow-[#2A0E61]/20 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">{resume.title}</h3>
        {!resume.available && (
          <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs text-purple-100">
            Files pending
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <DownloadAction
          href={resume.pdfPath}
          label="Download PDF"
          available={resume.available}
        />
        <DownloadAction
          href={resume.docxPath}
          label="Download DOCX"
          available={resume.available}
        />
      </div>
    </article>
  );
};

export const ResumeSection = ({ preview = false, resumes = fallbackPortfolioContent.resumes }: { preview?: boolean; resumes?: ResumeContent[] }) => {
  const visibleResumes = preview ? resumes.slice(0, 3) : resumes;

  return (
    <section
      id={preview ? "cv-preview" : "resume"}
      className="relative z-[20] mx-auto flex w-full max-w-7xl flex-col px-6 py-24"
    >
      <p className="Welcome-text text-sm uppercase">CV</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            CV & Resume
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
            Choose the version that fits the application context. Each card includes
            direct PDF and DOCX downloads.
          </p>
        </div>

        {preview && (
          <Link
            href="/resume"
            className="button-primary inline-flex w-fit items-center justify-center gap-2 rounded-lg px-5 py-3 text-white transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            View CV Page
          </Link>
        )}
      </div>

      <div className={preview ? "mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "mt-10 grid gap-5 md:grid-cols-2"}>
        {visibleResumes.map((resume) => (
          <ResumeCard key={resume.title} resume={resume} />
        ))}
      </div>
    </section>
  );
};
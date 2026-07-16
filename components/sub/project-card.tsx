import Link from "next/link";

import { ProjectArtwork } from "@/components/sub/project-artwork";

type ProjectCardProps = {
  src: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
};

export const ProjectCard = ({
  src,
  title,
  description,
  tags,
  href,
}: ProjectCardProps) => {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-[#2A0E61] bg-[#08021c]/70 shadow-lg shadow-[#2A0E61]/20 backdrop-blur-sm">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-[#030014]">
        <ProjectArtwork src={src} title={title} />
      </div>

      <div className="relative flex h-full flex-col gap-4 p-5">
        <h3 className="text-xl font-semibold leading-tight text-white">
          {title}
        </h3>
        <p className="text-sm leading-7 text-gray-300">{description}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={`${title}-${tag}`}
              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
            >
              {tag}
            </span>
          ))}
        </div>
        {href && (
          <Link href={href} className="button-secondary mt-2 inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
            View details <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
};

import Image from "next/image";
import Link from "next/link";

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
        <Image
          src={src}
          alt={`Project visual for ${title}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
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
          <Link href={href} className="mt-2 inline-flex w-fit rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-cyan-100">
            View details
          </Link>
        )}
      </div>
    </article>
  );
};
export const revalidate = 60;

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectBySlug } from "@/lib/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-28">
      <article className="relative z-[20] mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link href="/projects" className="w-fit rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-cyan-100">
          Back to projects
        </Link>

        <div>
          <p className="Welcome-text mb-4 text-sm">Project</p>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{project.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300">{project.description}</p>
        </div>

        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#2A0E61] bg-[#08021c]/70 shadow-lg shadow-[#2A0E61]/20">
          <Image src={project.image} alt={`Project visual for ${project.title}`} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover opacity-90" />
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{tag}</span>
          ))}
        </div>

        <div className="grid gap-5">
          {(project.sections ?? []).map((section) => (
            <section key={`${project.slug}-${section.title}`} className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6 shadow-xl shadow-[#2A0E61]/20 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              {section.body && <p className="mt-4 text-sm leading-7 text-gray-300">{section.body}</p>}
              {!!section.bullets.length && (
                <ul className="mt-4 ml-4 list-disc space-y-2 text-sm leading-6 text-gray-300">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
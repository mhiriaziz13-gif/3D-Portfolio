import { ProjectCard } from "@/components/sub/project-card";
import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { ProjectContent } from "@/lib/cms-types";

export const Projects = ({ projects = fallbackPortfolioContent.projects, cardLocation }: { projects?: ProjectContent[]; cardLocation: "homepage" | "projects_page" }) => {
  return (
    <section
      id="projects"
      className="render-deferred mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-24"
    >
      <p className="Welcome-text mb-4 text-sm">Selected work</p>
      <h2 className="pb-14 text-center text-[40px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
        Projects
      </h2>
      <div className="grid h-full w-full gap-8 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.slug || project.title}
            src={project.image}
            title={project.title}
            description={project.description}
            tags={project.tags}
            projectSlug={project.slug}
            cardLocation={cardLocation}
            href={project.slug ? `/projects/${project.slug}` : undefined}
          />
        ))}
      </div>
    </section>
  );
};

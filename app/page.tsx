export const revalidate = 60;

import { About } from "@/components/main/about";
import { Contact } from "@/components/main/contact";
import { Experience } from "@/components/main/experience";
import { Hero } from "@/components/main/hero";
import { Projects } from "@/components/main/projects";
import { ResumeSection } from "@/components/main/resume-section";
import { Skills } from "@/components/main/skills";
import { getPortfolioContent } from "@/lib/cms";

export default async function Home() {
  const content = await getPortfolioContent();

  return (
    <main className="h-full w-full">
      <Hero profile={content.profile} hero={content.hero} />
      <About profile={content.profile} about={content.about} />
      <Skills skillCategories={content.skillCategories} />
      <Projects projects={content.projects} />
      <Experience experience={content.experience} />
      <ResumeSection preview resumes={content.resumes} />
      <Contact profile={content.profile} />
    </main>
  );
}
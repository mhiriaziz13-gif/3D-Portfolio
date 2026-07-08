export const revalidate = 60;

import { Projects } from "@/components/main/projects";
import { getPortfolioContent } from "@/lib/cms";

export default async function ProjectsPage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-16">
      <Projects projects={content.projects} />
    </main>
  );
}
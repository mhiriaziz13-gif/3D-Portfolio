export const revalidate = 60;

import { Experience } from "@/components/main/experience";
import { getPortfolioContent } from "@/lib/cms";

export default async function ExperiencePage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-16">
      <Experience experience={content.experience} />
    </main>
  );
}
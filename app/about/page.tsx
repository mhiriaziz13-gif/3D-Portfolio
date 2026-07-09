export const revalidate = 60;

import { About } from "@/components/main/about";
import { getPortfolioContent } from "@/lib/cms";

export default async function AboutPage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-16">
      <About profile={content.profile} about={content.about} />
    </main>
  );
}
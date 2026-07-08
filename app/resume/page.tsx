export const revalidate = 60;

import { ResumeSection } from "@/components/main/resume-section";
import { getPortfolioContent } from "@/lib/cms";

export default async function ResumePage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-16">
      <ResumeSection resumes={content.resumes} />
    </main>
  );
}
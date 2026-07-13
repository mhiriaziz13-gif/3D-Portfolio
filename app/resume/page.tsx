export const revalidate = 60;

import { CertificationsSection } from "@/components/main/certifications-section";
import { EducationSection } from "@/components/main/education-section";
import { ResumeSection } from "@/components/main/resume-section";
import { getPortfolioContent } from "@/lib/cms";

export default async function ResumePage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-16">
      <ResumeSection resumes={content.resumes} />
      <EducationSection education={content.education} />
      <CertificationsSection certifications={content.certifications} />
    </main>
  );
}

export const revalidate = 60;

import { About } from "@/components/main/about";
import { CertificationsSection } from "@/components/main/certifications-section";
import { Contact } from "@/components/main/contact";
import { EducationSection } from "@/components/main/education-section";
import { Experience } from "@/components/main/experience";
import { Hero } from "@/components/main/hero";
import { Projects } from "@/components/main/projects";
import { ResumeSection } from "@/components/main/resume-section";
import { Skills } from "@/components/main/skills";
import { getPortfolioContent } from "@/lib/cms";
import { JsonLd } from "@/components/seo/json-ld";
import { personSchema, websiteSchema } from "@/lib/seo/schema";

export default async function Home() {
  const content = await getPortfolioContent();

  return (
    <main className="h-full w-full">
      <JsonLd data={[websiteSchema(), personSchema(content.profile)]} />
      <Hero profile={content.profile} hero={content.hero} />
      <About profile={content.profile} about={content.about} />
      <Skills skillCategories={content.skillCategories} />
      <Projects projects={content.projects} />
      <Experience experience={content.experience} />
      <EducationSection preview education={content.education} />
      <CertificationsSection preview certifications={content.certifications} />
      <ResumeSection preview resumes={content.resumes} />
      <Contact profile={content.profile} />
    </main>
  );
}

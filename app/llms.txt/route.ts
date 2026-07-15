import { getPortfolioContent } from "@/lib/cms";
import { absoluteUrl } from "@/lib/seo/urls";

export const revalidate = 60;
export async function GET() {
  const content = await getPortfolioContent();
  const projects = content.projects.map((project) => `- [${project.title}](${absoluteUrl(`/projects/${project.slug}`)}): ${project.description}`).join("\n");
  const profiles = [["LinkedIn", content.profile.linkedIn], ["GitHub", content.profile.github]].filter((entry) => entry[1]).map(([label, url]) => `- [${label}](${url})`).join("\n");
  const body = `# Ahmed Aziz Mhiri\n\n> Data-Driven Marketing, Commercial Analytics and Business Intelligence portfolio focused on analytics, customer insight, process automation and digital growth.\n\nAhmed Aziz Mhiri is based in Sousse, Tunisia and is available for Europe-based opportunities from Summer 2027.\n\n## Primary pages\n\n- [About](${absoluteUrl("/about")}): Professional background and approach.\n- [Expertise](${absoluteUrl("/expertise")}): Analytics, marketing, automation and technical capabilities.\n- [Projects](${absoluteUrl("/projects")}): Public-safe case studies.\n- [Experience](${absoluteUrl("/experience")}): Professional timeline.\n- [Education](${absoluteUrl("/education")}): Verified academic information.\n- [Certifications](${absoluteUrl("/certifications")}): Verified credentials.\n- [Resume](${absoluteUrl("/resume")}): Available CV formats.\n- [Contact](${absoluteUrl("/contact")}): Contact options.\n\n${projects ? `## Selected projects\n\n${projects}\n\n` : ""}${profiles ? `## Professional profiles\n\n${profiles}\n\n` : ""}## Content notes\n\nProject descriptions are public-safe and may omit confidential operational data. This file is a supplementary, experimental discovery aid; it does not guarantee crawling, ranking, or use by AI systems.\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

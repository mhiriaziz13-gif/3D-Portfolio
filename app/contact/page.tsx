export const revalidate = 60;

import { Contact } from "@/components/main/contact";
import { getPortfolioContent } from "@/lib/cms";

export default async function ContactPage() {
  const content = await getPortfolioContent();

  return (
    <main className="min-h-screen pt-16">
      <Contact profile={content.profile} />
    </main>
  );
}
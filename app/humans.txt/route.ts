import { siteSeo } from "@/lib/seo/config";
export function GET() { return new Response(`Owner: Ahmed Aziz Mhiri\nPurpose: Data-driven marketing, commercial analytics and business intelligence portfolio\nTechnology: Next.js, TypeScript, Supabase, Vercel\nLinkedIn: ${siteSeo.sameAs[0]}\nGitHub: ${siteSeo.sameAs[1]}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } }); }

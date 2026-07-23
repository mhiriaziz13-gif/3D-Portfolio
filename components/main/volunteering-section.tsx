import type { VolunteeringContent } from "@/lib/cms-types";

export function VolunteeringSection({ entries, title = "Volunteering", subtitle }: { entries: VolunteeringContent[]; title?: string; subtitle?: string }) {
  if (!entries.length) return null;
  return (
    <section id="volunteering" className="relative z-20 mx-auto w-full max-w-7xl px-6 py-24">
      {subtitle && <p className="Welcome-text text-sm">{subtitle}</p>}
      <h2 className="mt-3 text-4xl font-bold text-white">{title}</h2>
      <div className="mt-10 grid gap-6">
        {entries.map((entry) => (
          <article key={`${entry.organisation}-${entry.role}`} className="rounded-lg border border-white/10 bg-[#100b24]/90 p-6">
            <h3 className="text-xl font-bold text-white">{entry.role}</h3>
            <p className="mt-1 font-semibold text-cyan-100">{entry.organisation} · {entry.domain}</p>
            <p className="mt-2 text-sm text-gray-400">{entry.date}</p>
            <p className="mt-4 leading-7 text-gray-300">{entry.summary}</p>
            <ul className="mt-4 ml-5 list-disc space-y-2 text-sm leading-6 text-gray-300">
              {entry.descriptionItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {entry.focusAreas.map((area) => <span key={area} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{area}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

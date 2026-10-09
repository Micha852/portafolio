import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { profile } from "@/data/profile";

export default function About() {
  return (
    <section id="sobre-mi" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="01" title="Sobre mí" />

        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5 text-lg leading-relaxed text-muted">
            {profile.about.map((p, i) => (
              <Reveal key={i} delay={i * 120}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
            {profile.stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 120} className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-display text-3xl sm:text-4xl font-bold text-accent">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

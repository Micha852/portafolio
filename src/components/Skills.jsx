import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { skills } from "@/data/profile";

export default function Skills() {
  return (
    <section id="habilidades" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="03" title="Habilidades" subtitle="Las herramientas con las que trabajo día a día." />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((group, i) => (
            <Reveal key={group.group} delay={(i % 4) * 100} className="rounded-3xl border border-line bg-surface p-6">
              <h3 className="font-display text-xl font-bold">
                <span className="text-accent">/</span> {group.group}
              </h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-line px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

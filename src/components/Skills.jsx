import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { skills } from "@/data/profile";

const span = { 2: "lg:col-span-2", 4: "sm:col-span-2 lg:col-span-4" };

function Chips({ items }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-xl border border-line px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent">
          {item}
        </li>
      ))}
    </ul>
  );
}

// Proceso por etapas: línea de tiempo horizontal en escritorio y vertical en celular
function Steps({ steps }) {
  return (
    <ol className="mt-6 grid gap-6 md:grid-cols-5 md:gap-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative pl-10 md:pl-0">
          {/* Conector entre etapas */}
          {i < steps.length - 1 && (
            <span className="absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-px bg-line md:left-8 md:top-4 md:h-px md:w-[calc(100%-1rem)]" aria-hidden="true" />
          )}
          <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border border-accent/60 bg-bg font-display text-xs font-bold text-accent md:relative">
            {i + 1}
          </span>
          <p className="font-display font-semibold md:mt-3">{s.title}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {s.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-warm" />
                {item}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export default function Skills() {
  return (
    <section id="habilidades" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="04" title="Habilidades" subtitle="Las herramientas con las que trabajo día a día." />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((group, i) => (
            <Reveal key={group.group} delay={(i % 4) * 100} className={`rounded-3xl border border-line bg-surface p-6 ${span[group.wide] ?? ""}`}>
              <h3 className="font-display text-xl font-bold">
                <span className="text-accent">/</span> {group.group}
              </h3>
              {group.note && <p className="mt-1 text-sm text-muted">{group.note}</p>}
              {group.steps ? (
                <Steps steps={group.steps} />
              ) : (
                <div className="mt-5">
                  <Chips items={group.items} />
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

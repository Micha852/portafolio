import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { experience } from "@/data/profile";

export default function Experience() {
  return (
    <section id="experiencia" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="04" title="Experiencia" subtitle="Mi recorrido hasta ahora." />

        <ol className="relative ml-3 border-l border-line">
          {experience.map((item, i) => (
            <Reveal as="li" key={`${item.title}-${i}`} delay={i * 100} className="relative pl-8 pb-12 last:pb-0">
              <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-accent bg-bg" />
              <p className="text-sm font-semibold text-warm">{item.period}</p>
              <h3 className="font-display mt-1 text-2xl font-bold">{item.title}</h3>
              <p className="text-accent font-medium">{item.place}</p>
              <p className="mt-3 max-w-2xl text-muted leading-relaxed">{item.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

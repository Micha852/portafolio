import Image from "next/image";
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

            {profile.highlights?.length > 0 && (
              <Reveal delay={240} className="pt-4">
                <h3 className="font-display text-base font-semibold text-ink mb-4">Reconocimientos y certificaciones</h3>
                <ul className="space-y-3 text-base">
                  {profile.highlights.map((h) => (
                    <li key={h.title} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rotate-45 bg-warm" />
                      <span>
                        <span className="text-ink">{h.title}</span>
                        <span className="block text-sm">{h.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {profile.stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 120} className="rounded-2xl border border-line bg-surface p-5">
                  <p className="font-display whitespace-nowrap text-2xl font-bold text-accent sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                  {s.detail && <p className="mt-1 text-xs font-semibold text-warm">{s.detail}</p>}
                </Reveal>
              ))}
            </div>

            {profile.setups?.length > 0 && (
              <Reveal delay={240} className="pt-2">
                <h3 className="font-display text-base font-semibold text-ink mb-3">Entornos de desarrollo</h3>
                <div className="space-y-4">
                  {profile.setups.map((s) => (
                    <figure key={s.image} className="group relative aspect-video overflow-hidden rounded-2xl border border-line">
                      <Image
                        src={s.image}
                        alt={s.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
                        <p className="font-display text-sm font-bold text-white">{s.title}</p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

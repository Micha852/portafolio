import Image from "next/image";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { Icon } from "./Icons";
import { projects } from "@/data/profile";

function ProjectCard({ project, index }) {
  const { title, description, image, tags, demo, repo, featured } = project;

  return (
    <Reveal
      delay={(index % 3) * 120}
      className={`group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/10 ${
        featured ? "md:col-span-2 md:flex-row" : ""
      }`}
    >
      <div className={`relative aspect-video overflow-hidden bg-bg ${featured ? "md:aspect-auto md:w-3/5" : ""}`}>
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent/20 via-bg to-warm/15">
            <span className="font-display text-4xl font-bold text-ink/20">{title}</span>
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-6 ${featured ? "md:p-8 md:justify-center" : ""}`}>
        {featured && <p className="text-xs font-semibold uppercase tracking-widest text-warm mb-2">Destacado</p>}
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <p className="mt-3 text-muted leading-relaxed flex-1">{description}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {t}
            </li>
          ))}
        </ul>

        {(demo || repo) && (
          <div className="mt-6 flex gap-5 text-sm font-semibold">
            {demo && (
              <a href={demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent transition">
                <Icon name="external" className="w-4 h-4" />
                Ver sitio
              </a>
            )}
            {repo && (
              <a href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent transition">
                <Icon name="github" className="w-4 h-4" />
                Código
              </a>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}

export default function Projects() {
  return (
    <section id="proyectos" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="02" title="Proyectos" subtitle="Una selección de cosas que he construido." />
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

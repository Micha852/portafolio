import Image from "next/image";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { Icon } from "./Icons";
import GalleryModal from "./GalleryModal";
import { contagracia, projects } from "@/data/profile";

function Highlights({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2 text-sm text-muted">
      {items.map((h) => (
        <li key={h} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {h}
        </li>
      ))}
    </ul>
  );
}

function Tags({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {t}
        </li>
      ))}
    </ul>
  );
}

function Links({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
      {items.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-accent transition"
        >
          <Icon name={link.icon ?? "external"} className="w-4 h-4" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

const cardClass =
  "group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/10";

function ProjectCard({ project, index }) {
  const { title, description, highlights, image, tags, links, featured, gallery } = project;

  return (
    <Reveal delay={(index % 3) * 120} className={`${cardClass} ${featured ? "md:col-span-2 md:flex-row" : ""}`}>
      <div className={`relative aspect-video overflow-hidden bg-bg ${featured ? "md:aspect-auto md:w-2/5 md:shrink-0" : ""}`}>
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : gallery ? (
          // Mosaico con las primeras capturas de la galería
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
            {gallery.sites.slice(0, 4).map((site) => (
              <div key={site.href} className="relative overflow-hidden rounded-lg">
                <Image
                  src={site.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover object-top transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent/20 via-bg to-warm/15">
            <span className="font-display text-4xl font-bold text-ink/20 text-center px-4">{title}</span>
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-6 ${featured ? "md:p-8 md:justify-center" : ""}`}>
        {featured && <p className="text-xs font-semibold uppercase tracking-widest text-warm mb-2">Destacado</p>}
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <p className="mt-3 text-muted leading-relaxed">{description}</p>
        <Highlights items={highlights} />
        <div className="flex-1" />
        <Tags items={tags} />
        <Links items={links} />
        {gallery && <GalleryModal gallery={gallery} />}
      </div>
    </Reveal>
  );
}

function ModuleCard({ module, index }) {
  return (
    <Reveal delay={(index % 3) * 100} className={`${cardClass} p-6`}>
      <p className="font-display text-sm font-semibold text-warm">{String(index + 1).padStart(2, "0")}</p>
      <h4 className="font-display mt-1 text-xl font-bold">{module.title}</h4>
      <p className="mt-2 text-sm text-muted leading-relaxed">{module.description}</p>
      <Highlights items={module.highlights} />
      <div className="flex-1" />
      <Tags items={module.tags} />
      <Links items={module.links} />
      {module.gallery && <GalleryModal gallery={module.gallery} />}
    </Reveal>
  );
}

function ContagraciaShowcase() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Reveal className="relative overflow-hidden rounded-3xl border border-accent/40 bg-surface p-8 md:col-span-2">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-widest text-warm">Proyecto principal</p>
        <h3 className="font-display mt-2 text-3xl sm:text-4xl font-bold">{contagracia.title}</h3>
        <p className="mt-4 max-w-2xl text-muted leading-relaxed">{contagracia.description}</p>
        <Tags items={contagracia.tags} />
        <Links items={contagracia.links} />
      </Reveal>

      {contagracia.modules.map((m, i) => (
        <ModuleCard key={m.title} module={m} index={i} />
      ))}
    </div>
  );
}

export default function Projects() {
  return (
    <section id="proyectos" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="02" title="Proyectos" subtitle="Productos en los que he trabajado de punta a punta." />

        <ContagraciaShowcase />

        <Reveal className="mt-20 mb-8">
          <h3 className="font-display text-2xl sm:text-3xl font-bold">Otros proyectos</h3>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

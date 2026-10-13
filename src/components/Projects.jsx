import Image from "next/image";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { Icon } from "./Icons";
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
  const { title, description, highlights, image, tags, links, featured } = project;

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

function Showcase() {
  const sites = contagracia.showcase ?? [];
  if (sites.length === 0) return null;

  return (
    <div className="mt-16">
      <Reveal className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-warm">Resultados reales</p>
        <h3 className="font-display mt-2 text-2xl sm:text-3xl font-bold">Sitios creados con el CMS de Contagracia</h3>
        <p className="mt-3 text-muted">
          Negocios de distintos sectores que publican su sitio y su tienda en línea con el CMS que desarrollé.
        </p>
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site, i) => (
          <Reveal key={site.href} delay={(i % 3) * 100}>
            <a
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/10"
            >
              {/* Barra de navegador para que se lea como un sitio web */}
              <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-line" />
                <span className="h-2 w-2 rounded-full bg-line" />
                <span className="h-2 w-2 rounded-full bg-line" />
                <span className="ml-2 truncate text-[11px] text-muted">{site.href.replace(/^https?:\/\/|\/$/g, "")}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={site.image}
                  alt={`Sitio web de ${site.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{site.name}</p>
                  <p className="text-xs text-muted">{site.category}</p>
                </div>
                <Icon name="external" className="w-4 h-4 shrink-0 text-muted transition group-hover:text-accent" />
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="proyectos" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="02" title="Proyectos" subtitle="Productos en los que he trabajado de punta a punta." />

        <ContagraciaShowcase />
        <Showcase />

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

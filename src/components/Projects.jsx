import Image from "next/image";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { Icon } from "./Icons";
import GalleryModal from "./GalleryModal";
import SimulatorModal from "./simulators/SimulatorModal";
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
  const { title, description, highlights, image, imageMobile, tags, links, featured, gallery } = project;

  return (
    <Reveal delay={(index % 3) * 120} className={`${cardClass} ${featured ? "md:col-span-2 md:flex-row" : ""}`}>
      <div className={`relative overflow-hidden bg-bg ${imageMobile ? "h-80" : "aspect-video"} ${featured ? "md:aspect-auto md:h-auto md:min-h-[440px] md:w-2/5 md:shrink-0" : ""}`}>
        {imageMobile ? (
          // Captura de celular dentro de un marco de teléfono, sobre un degradado
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent/25 via-bg to-warm/20 py-6">
            <div className="relative h-full max-h-[420px] aspect-[9/19.5] overflow-hidden rounded-[1.8rem] border-[6px] border-[#1f2328] bg-[#1f2328] shadow-2xl transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1deg]">
              <Image src={imageMobile} alt={title} fill sizes="240px" className="object-cover object-top" />
            </div>
          </div>
        ) : image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover object-left-top transition duration-500 group-hover:scale-105"
          />
        ) : gallery ? (
          // Mosaico clicable que abre la galería
          <GalleryModal gallery={gallery} variant="mosaic" />
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
    <Reveal
      delay={(index % 3) * 100}
      className={`${cardClass} relative p-6 ${module.simulator ? "border-warm/40 shadow-lg shadow-warm/5" : ""}`}
    >
      {module.simulator && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-warm/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warm" />
          Interactivo
        </span>
      )}
      <p className="font-display text-sm font-semibold text-warm">{String(index + 1).padStart(2, "0")}</p>
      <h4 className="font-display mt-1 text-xl font-bold">{module.title}</h4>
      <p className="mt-2 text-sm text-muted leading-relaxed">{module.description}</p>
      <Highlights items={module.highlights} />
      <div className="flex-1" />
      <Tags items={module.tags} />
      <Links items={module.links} />
      {module.gallery && <GalleryModal gallery={module.gallery} variant="thumbs" />}
      {module.simulator && <SimulatorModal simulator={module.simulator} />}
    </Reveal>
  );
}

const simulators = contagracia.modules.filter((m) => m.simulator);

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

        {/* Acceso directo a los simuladores: lo más valioso no debe pasar desapercibido */}
        <div id="demos" className="mt-6 scroll-mt-32 rounded-2xl border border-warm/40 bg-warm/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warm" />
            </span>
            Pruébalo en vivo: {simulators.length} simuladores interactivos
          </p>
          <p className="mt-1 text-xs text-muted">No son capturas: úsalos como si fueras el cliente, el mesero o el administrador.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {simulators.map((m) => (
              <SimulatorModal key={m.simulator.id} simulator={m.simulator} variant="chip" label={m.short ?? m.title} />
            ))}
          </div>
        </div>
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

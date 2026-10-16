import Image from "next/image";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import ClickableCard from "./ClickableCard";
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
      {items.map((link, i) => (
        <a
          key={link.href}
          data-card-action={i === 0 ? "3" : undefined}
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

// Quién es dueño del producto y qué hice yo en él
function Owner({ owner }) {
  if (!owner) return null;
  return <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">{owner}</p>;
}

function Mine({ text }) {
  if (!text) return null;
  return (
    <p className="mt-3 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
      <span className="font-semibold text-accent">Mi parte: </span>
      {text}
    </p>
  );
}

function GroupHeading({ title, text, className = "" }) {
  return (
    <Reveal className={`mb-8 ${className}`}>
      <h3 className="font-display text-2xl sm:text-3xl font-bold">{title}</h3>
      {text && <p className="mt-2 max-w-3xl text-muted">{text}</p>}
    </Reveal>
  );
}

const cardClass =
  "group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/10";

function ProjectCard({ project, index }) {
  const { title, description, highlights, image, imageMobile, tags, links, featured, gallery, owner, mine } = project;

  return (
    <ClickableCard delay={(index % 3) * 120} className={`${cardClass} ${featured ? "md:col-span-2 md:flex-row" : ""}`}>
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
        <Owner owner={owner} />
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <p className="mt-3 text-muted leading-relaxed">{description}</p>
        <Mine text={mine} />
        <Highlights items={highlights} />
        <div className="flex-1" />
        <Tags items={tags} />
        <Links items={links} />
        {gallery && <GalleryModal gallery={gallery} />}
      </div>
    </ClickableCard>
  );
}

// Recorrido de la demo en texto. Va en el HTML aunque esté cerrado, así lo leen también las IA y buscadores
function FlowSteps({ steps = [] }) {
  if (steps.length === 0) return null;
  return (
    <details className="group/flow mt-5 rounded-xl border border-line text-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-medium text-muted transition hover:text-ink [&::-webkit-details-marker]:hidden">
        Ver el flujo paso a paso
        <Icon name="arrow" className="h-4 w-4 rotate-90 transition group-open/flow:-rotate-90" />
      </summary>
      <ol className="space-y-2 border-t border-line px-3 py-3 text-muted">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="font-display font-semibold text-accent">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function ModuleCard({ module, index }) {
  return (
    <ClickableCard delay={(index % 3) * 100} className={`${cardClass} p-6`}>
      <p className="font-display text-sm font-semibold text-warm">{String(index + 1).padStart(2, "0")}</p>
      <h4 className="font-display mt-1 text-xl font-bold">{module.title}</h4>
      <p className="mt-2 text-sm text-muted leading-relaxed">{module.description}</p>
      <Mine text={module.mine} />
      <Highlights items={module.highlights} />
      <div className="flex-1" />
      <Tags items={module.tags} />
      <Links items={module.links} />
      {module.gallery && <GalleryModal gallery={module.gallery} variant="thumbs" />}
      {module.simulator && <FlowSteps steps={module.simulator.flow} />}
      {module.simulator && <SimulatorModal simulator={module.simulator} />}
    </ClickableCard>
  );
}

function ContagraciaShowcase() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ClickableCard className="relative overflow-hidden rounded-3xl border border-accent/40 bg-surface p-8 transition duration-300 hover:border-accent md:col-span-2">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-widest text-warm">Producto de {contagracia.owner}</p>
        <h3 className="font-display mt-2 text-3xl sm:text-4xl font-bold">{contagracia.title}</h3>
        <p className="mt-1 text-sm font-semibold text-accent">Mi rol: {contagracia.role}</p>
        <p className="mt-4 max-w-2xl text-muted leading-relaxed">{contagracia.description}</p>
        <Tags items={contagracia.tags} />
        <Links items={contagracia.links} />
      </ClickableCard>

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
        <SectionHeading number="02" title="Proyectos" subtitle="Productos en los que he trabajado, con el crédito de quién es cada uno y qué hice yo." />

        <GroupHeading
          title="En Arawana Studios"
          text="Trabajo para Arawana Home Studio S.A.S. como contratista de desarrollo de software. Los productos, su código y sus diseños son de Arawana; aquí muestro mi parte en ellos."
        />
        <ContagraciaShowcase />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {projects
            .filter((p) => p.group === "arawana")
            .map((p, i) => (
              <ProjectCard key={p.title} project={p} index={i} />
            ))}
        </div>

        <GroupHeading className="mt-20" title="Propios, académicos y colaboraciones" />
        <div className="grid gap-6 md:grid-cols-2">
          {projects
            .filter((p) => p.group !== "arawana")
            .map((p, i) => (
              <ProjectCard key={p.title} project={p} index={i} />
            ))}
        </div>
      </div>
    </section>
  );
}

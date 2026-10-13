import Typewriter from "./Typewriter";
import Avatar from "./Avatar";
import { Icon } from "./Icons";
import { profile, contact } from "@/data/profile";

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-16">
      <div className="grid-bg absolute inset-0 -z-10" aria-hidden="true" />
      <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-24 -z-10 h-96 w-96 rounded-full bg-warm/15 blur-3xl" aria-hidden="true" />

      <div className="mx-auto w-full max-w-6xl px-6 grid gap-14 md:grid-cols-[1.3fr_1fr] items-center">
        <div>
          {profile.available && (
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-4 py-1.5 text-sm text-muted">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              Disponible para nuevos proyectos
            </p>
          )}

          <h1 className="font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Hola, soy <span className="text-accent">{profile.shortName}</span>
            <span className="block text-muted text-3xl sm:text-4xl lg:text-5xl mt-3">{profile.role}</span>
          </h1>

          <p className="mt-6 text-xl sm:text-2xl min-h-[2.5em] font-display">
            <Typewriter phrases={profile.taglines} />
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#proyectos" className="btn-solid">
              Ver proyectos
              <Icon name="arrow" className="w-4 h-4" />
            </a>
            <a
              href="#demos"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-warm bg-warm/10 px-6 py-3 font-semibold text-warm transition hover:-translate-y-0.5 hover:bg-warm hover:text-bg"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm opacity-75 group-hover:bg-bg" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warm group-hover:bg-bg" />
              </span>
              Probar demos en vivo
            </a>
            <a href="#contacto" className="btn-outline">
              Hablemos
            </a>
            {profile.cv && (
              <a href={profile.cv} download className="btn-outline">
                <Icon name="download" className="w-4 h-4" />
                CV
              </a>
            )}
          </div>

          <div className="mt-10 flex items-center gap-5 text-muted">
            {contact.socials.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="hover:text-accent transition">
                <Icon name={s.icon} className="w-6 h-6" />
              </a>
            ))}
            <span className="h-px w-12 bg-line" />
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Icon name="pin" className="w-4 h-4" />
              {profile.location}
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-3 rounded-[2.5rem] border border-dashed border-accent/40 animate-float" aria-hidden="true" />
          <Avatar name={profile.name} photos={profile.photos} className="aspect-[4/5] w-full" />
          <div className="absolute -bottom-5 -left-5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xl">
            <p className="font-display text-2xl font-bold text-warm">{profile.heroBadge.value}</p>
            <p className="text-xs text-muted">{profile.heroBadge.label}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

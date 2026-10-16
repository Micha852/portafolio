import { profile, contact, contagracia, projects, experience, skills } from "@/data/profile";

export const SITE_URL = "https://michael.prometeondev.com";

// Datos estructurados (schema.org) de la persona: los leen Google y los asistentes de IA
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: profile.about.join(" "),
    url: SITE_URL,
    image: `${SITE_URL}${profile.photos[0]?.src ?? "/og.jpg"}`,
    email: `mailto:${contact.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Florencia", addressRegion: "Caquetá", addressCountry: "CO" },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Universidad de la Amazonia" },
      { "@type": "EducationalOrganization", name: "Servicio Nacional de Aprendizaje (SENA)" },
    ],
    hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: profile.degree },
    knowsLanguage: ["es", "en"],
    knowsAbout: skills.flatMap((g) => g.items ?? []),
    sameAs: contact.socials.map((s) => s.href),
  };
}

const list = (items = []) => items.map((i) => `- ${i}`).join("\n");

// Resumen en texto plano del portafolio para asistentes de IA (estándar llms.txt)
export function llmsText() {
  const demos = contagracia.modules.filter((m) => m.simulator);
  return [
    `# ${profile.name}`,
    "",
    `> ${profile.role} · ${profile.degree} · ${profile.location}`,
    "",
    profile.about.join("\n\n"),
    "",
    `- Portafolio: ${SITE_URL}`,
    `- CV (PDF): ${SITE_URL}${profile.cv}`,
    `- Correo: ${contact.email}`,
    ...contact.socials.map((s) => `- ${s.name}: ${s.href}`),
    "",
    "## Experiencia",
    "",
    ...experience.map((e) => `### ${e.title} · ${e.place} (${e.period})\n\n${e.description}\n`),
    `## ${contagracia.title} (producto de ${contagracia.owner})`,
    "",
    `Rol: ${contagracia.role}. ${contagracia.description}`,
    "",
    ...contagracia.modules.map((m) => [`### ${m.title}`, "", m.description, "", m.mine ? `Mi parte: ${m.mine}` : "", "", list(m.highlights), ""].join("\n")),
    "## Demos interactivas del portafolio",
    "",
    "Simuladores hechos para este portafolio con datos ficticios (empresa de ejemplo «Grupo Nova»). Se inspiran en funcionalidades en las que trabajé; no usan código ni datos de Arawana. Se abren desde la sección Proyectos; este es su recorrido en texto:",
    "",
    ...demos.map((m) => [`### ${m.simulator.title}`, "", m.simulator.subtitle, "", m.simulator.flow.map((s, i) => `${i + 1}. ${s}`).join("\n"), ""].join("\n")),
    "## Otros proyectos",
    "",
    ...projects.map((p) =>
      [
        `### ${p.title}${p.owner ? ` (${p.owner})` : ""}`,
        "",
        p.description,
        p.mine ? `\nMi parte: ${p.mine}` : "",
        p.highlights?.length ? `\n${list(p.highlights)}` : "",
        p.tags?.length ? `\nTecnologías: ${p.tags.join(", ")}` : "",
        p.links?.length ? `\nEnlaces: ${p.links.map((l) => l.href).join(", ")}` : "",
        "",
      ].join("\n")
    ),
    "## Habilidades",
    "",
    ...skills.map((g) => `- ${g.group}: ${(g.items ?? g.steps?.flatMap((s) => s.items) ?? []).join(", ")}`),
    "",
    "## Reconocimientos y certificaciones",
    "",
    list(profile.highlights.map((h) => `${h.title} (${h.detail})`)),
    "",
  ].join("\n");
}

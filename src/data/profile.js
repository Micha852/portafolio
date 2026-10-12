// ✏️ Todo el contenido del portafolio vive aquí. Edita este archivo y la página se actualiza sola.

export const profile = {
  name: "Michael Andrés Martínez Guzmán",
  shortName: "Michael",
  role: "Desarrollador Full Stack",
  // Frases que se escriben en el hero, una tras otra
  taglines: [
    "Ingeniero de Sistemas.",
    "Construyo plataformas ERP y de facturación electrónica.",
    "Diseño APIs REST y bases de datos.",
    "Convierto requerimientos en software que funciona.",
  ],
  location: "Florencia, Caquetá, Colombia",
  available: true,
  // Pon tu foto en /public (ej: /public/foto.webp) y escribe "/foto.webp". Si queda vacío se muestran tus iniciales.
  photo: "/michael.jpeg",
  // Qué parte de la foto se ve al recortarla (CSS object-position)
  photoPosition: "18% center",
  cv: "/cv-michael-martinez.pdf",
  about: [
    "Soy Ingeniero de Sistemas y desarrollador Full Stack. Trabajo en todo el ciclo del software: desde levantar requerimientos con los usuarios hasta desplegar, mantener y mejorar plataformas en producción.",
    "Me especializo en aplicaciones web, integración de APIs REST, automatización de procesos y bases de datos relacionales y NoSQL. Mi experiencia como analista funcional y en UX me ayuda a construir herramientas que la gente realmente entiende y usa.",
  ],
  stats: [
    { value: "2+", label: "Años de experiencia" },
    { value: "3.9k+", label: "Commits en Contagracia" },
    { value: "1.º", label: "Maratón de Programación 2025" },
  ],
  highlights: [
    { title: "Primer lugar — Maratón de Programación Competitiva 2025", detail: "Universidad de la Amazonia" },
    { title: "Tercer lugar — Maratón de Programación Competitiva 2024-1", detail: "Universidad de la Amazonia" },
    { title: "Matrícula Profesional COPNIA", detail: "Ingeniero de Sistemas · 2026" },
    { title: "NDG Linux Essentials y Linux Unhatched", detail: "Cisco Networking Academy · 2022" },
    { title: "Idiomas", detail: "Español nativo · Inglés B1 (lectura técnica y documentación)" },
  ],
};

export const contact = {
  email: "may13xd@gmail.com",
  whatsapp: "573122453755", // solo números, con código de país
  socials: [
    { name: "GitHub", href: "https://github.com/Micha852", icon: "github" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/mamg0852/", icon: "linkedin" },
    { name: "Portafolio en Prometeon", href: "https://prometeondev.com/", icon: "globe" },
  ],
};

// links: lista de enlaces del proyecto. icon puede ser "external" (sitio) o "github" (código)
export const projects = [
  {
    title: "Contagracia ERP",
    description:
      "ERP multitenant para empresas colombianas construido en 20 microservicios: facturación electrónica DIAN, contabilidad, nómina, inventario, CRM, propiedad horizontal, restaurantes y tienda en línea. Más de 3.900 commits míos entre front y back.",
    // Puntos clave que se muestran en la tarjeta (opcional)
    highlights: [
      "CRM con embudo de oportunidades, WhatsApp, Lead Forms y campañas de Meta Ads",
      "Motor de automatizaciones con disparadores, notificaciones y agentes de IA de varios proveedores",
      "Propiedad horizontal: cuotas, mora y pronto pago, documentos por torre y apartamento, portería",
      "Restaurantes: comandas para cocina, domicilios, menú público configurable y reportes de ventas",
      "Lectura de extractos bancarios en PDF con IA, nómina y PILA, calendario tributario DIAN e integración con Tiendanube",
    ],
    image: "", // ej: "/projects/contagracia.webp"
    tags: ["Next.js", "TypeScript", "NestJS", "Microservicios", "Prisma", "PostgreSQL", "Redis · BullMQ", "IA"],
    links: [
      { label: "contagracia.com", href: "https://contagracia.com", icon: "external" },
      { label: "facturafacil.com.co", href: "https://facturafacil.com.co", icon: "external" },
    ],
    featured: true,
  },
  {
    title: "Herbario Digital HUAZ 2.0",
    description:
      "Plataforma para la colección botánica del Herbario de la Universidad de la Amazonia: muestras con taxonomía, imágenes, mapa de recolección, importación y exportación Darwin Core (SiB Colombia / GBIF), fichas y etiquetas en PDF, roles con permisos y un CMS para el sitio público.",
    image: "",
    tags: ["Next.js", "TypeScript", "NestJS", "Prisma", "PostgreSQL", "Leaflet", "Docker"],
    links: [{ label: "herbariohuaz.com", href: "https://herbariohuaz.com/consultas", icon: "external" }],
  },
  {
    title: "Desarrollo Web",
    description:
      "Sitios corporativos, landing pages y plataformas para empresas de marketing, salud, noticias y entretenimiento.",
    image: "",
    tags: ["Next.js", "React", "Tailwind CSS", "SEO"],
    links: [
      { label: "arawanahomestudio.com", href: "https://arawanahomestudio.com", icon: "external" },
      { label: "prometeondev.com", href: "https://prometeondev.com", icon: "external" },
      { label: "reddigitalnoticias.co", href: "https://reddigitalnoticias.co", icon: "external" },
      { label: "globalplayzone.com", href: "https://globalplayzone.com", icon: "external" },
      { label: "dalujo-front.prometeondev.com", href: "https://dalujo-front.prometeondev.com", icon: "external" },
      { label: "gilberto-landing.vercel.app", href: "https://gilberto-landing.vercel.app", icon: "external" },
    ],
  },
];

export const skills = [
  { group: "Lenguajes", items: ["JavaScript", "TypeScript", "C#", "PHP", "Python"] },
  { group: "Backend", items: ["Node.js", "Express", "NestJS", ".NET Core", "Laravel", "APIs REST"] },
  { group: "Frontend", items: ["React", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap"] },
  { group: "Bases de datos", items: ["PostgreSQL", "MySQL", "MongoDB", "Supabase", "Prisma", "PostGIS"] },
  { group: "Infraestructura y herramientas", items: ["Linux", "Contabo", "DigitalOcean", "Docker", "Git y GitHub", "Postman", "Apidog"] },
  { group: "Otros", items: ["Análisis funcional", "UI/UX", "Automatización con Python"] },
];

export const experience = [
  {
    period: "Mar 2025 — Actualidad",
    title: "Desarrollador Full Stack",
    place: "Arawana Home Studio · Florencia",
    description:
      "Desarrollo del ERP Contagracia (CRM, automatizaciones con IA, propiedad horizontal, restaurantes, tienda en línea e integraciones con Meta, WhatsApp y Tiendanube) y de sitios corporativos con React, Next.js, NestJS, PHP y Laravel. Administración de bases de datos PostgreSQL, MySQL y Supabase, y trabajo junto a los equipos de UX/UI, SEO y marketing.",
  },
  {
    period: "Feb 2024 — Mar 2025",
    title: "Analista Funcional / Desarrollador UX",
    place: "Fundación Música, Danza y Teatro del Caquetá (FUNMUDATE)",
    description:
      "Levantamiento y documentación de requerimientos, diseño de prototipos y flujos de navegación, pruebas de usabilidad y enlace entre usuarios, directivos y el equipo de desarrollo. Soporte funcional y capacitación a usuarios finales.",
  },
  {
    period: "Jul 2019 — Dic 2025",
    title: "Ingeniería de Sistemas",
    place: "Universidad de la Amazonia",
    description: "Formación profesional como Ingeniero de Sistemas.",
  },
  {
    period: "Feb 2017 — Dic 2018",
    title: "Técnico en Sistemas",
    place: "Servicio Nacional de Aprendizaje (SENA)",
    description: "Formación técnica en sistemas.",
  },
];

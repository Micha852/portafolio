// ✏️ Todo el contenido del portafolio vive aquí. Edita este archivo y la página se actualiza sola.

export const profile = {
  name: "Tu Nombre",
  shortName: "Micha",
  role: "Desarrollador Full Stack",
  // Frases que se escriben en el hero, una tras otra
  taglines: ["Construyo sitios web rápidos.", "Diseño experiencias digitales.", "Convierto ideas en productos."],
  location: "Colombia",
  available: true,
  // Pon tu foto en /public (ej: /public/foto.webp) y escribe "/foto.webp". Si queda vacío se muestran tus iniciales.
  photo: "",
  cv: "", // ej: "/cv.pdf"
  about: [
    "Soy desarrollador apasionado por crear productos web que se vean bien y funcionen aún mejor. Me gusta trabajar de punta a punta: desde el diseño de la interfaz hasta la base de datos y el despliegue.",
    "Escribe aquí un segundo párrafo contando qué te motiva, en qué tipo de proyectos te gusta trabajar o qué estás aprendiendo ahora.",
  ],
  stats: [
    { value: "3+", label: "Años programando" },
    { value: "10+", label: "Proyectos entregados" },
    { value: "∞", label: "Tazas de café" },
  ],
};

export const contact = {
  email: "tucorreo@ejemplo.com",
  whatsapp: "57XXXXXXXXXX", // solo números, con código de país
  socials: [
    { name: "GitHub", href: "https://github.com/Micha852", icon: "github" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/tu-usuario", icon: "linkedin" },
    { name: "Instagram", href: "https://www.instagram.com/tu-usuario", icon: "instagram" },
  ],
};

export const projects = [
  {
    title: "WebSEN",
    description:
      "Sitio corporativo para una agencia de desarrollo web, branding y marketing, con panel de administración para gestionar servicios, proyectos y equipo.",
    image: "", // ej: "/projects/websen.webp"
    tags: ["Next.js", "Tailwind", "MongoDB", "JWT"],
    demo: "https://websen.co",
    repo: "",
    featured: true,
  },
  {
    title: "Proyecto dos",
    description: "Describe brevemente qué problema resuelve, para quién es y qué parte construiste tú.",
    image: "",
    tags: ["React", "Node.js"],
    demo: "",
    repo: "https://github.com/Micha852",
  },
  {
    title: "Proyecto tres",
    description: "Otro proyecto que quieras mostrar. Puede ser personal, de estudio o de un cliente.",
    image: "",
    tags: ["JavaScript", "API REST"],
    demo: "",
    repo: "https://github.com/Micha852",
  },
];

export const skills = [
  { group: "Frontend", items: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Tailwind CSS"] },
  { group: "Backend", items: ["Node.js", "API REST", "MongoDB", "JWT / Auth", "Nodemailer"] },
  { group: "Herramientas", items: ["Git & GitHub", "VS Code", "Linux / VPS", "Figma", "Vercel"] },
];

export const experience = [
  {
    period: "2024 — Actualidad",
    title: "Desarrollador Full Stack",
    place: "WebSEN",
    description: "Desarrollo del sitio y panel administrativo de la agencia; integración con MongoDB, autenticación y envío de correos.",
  },
  {
    period: "2023 — 2024",
    title: "Proyectos freelance",
    place: "Independiente",
    description: "Sitios web para pequeños negocios: landing pages, formularios de contacto y despliegue.",
  },
  {
    period: "20XX — 20XX",
    title: "Tu carrera o curso",
    place: "Institución",
    description: "Estudios, certificaciones o bootcamps relevantes.",
  },
];

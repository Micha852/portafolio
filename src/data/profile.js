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
  // Insignia junto a la foto del inicio
  heroBadge: { value: "2+", label: "Años de experiencia" },
  // Cifras de la sección Sobre mí
  stats: [
    { value: "3.9k+", label: "Commits en Contagracia" },
    { value: "2 podios", label: "Maratón de Programación", detail: "1.º 2025 · 3.º 2024-1" },
  ],
  // Fotos de los espacios de trabajo (columna derecha de Sobre mí)
  setups: [
    {
      title: "Estación principal",
      caption: "Monitor con el editor de automatizaciones de Contagracia y la laptop con el código.",
      image: "/setup/estacion-principal.webp",
    },
    {
      title: "Segundo puesto",
      caption: "Doble pantalla: código a la izquierda y este portafolio a la derecha.",
      image: "/setup/segundo-puesto.webp",
    },
  ],
  highlights: [
    { title: "Primer lugar — Maratón de Programación Competitiva 2025", detail: "Universidad de la Amazonia" },
    { title: "Tercer lugar — Maratón de Programación Competitiva 2024-1", detail: "Universidad de la Amazonia" },
    { title: "Matrícula Profesional COPNIA", detail: "Ingeniero de Sistemas · 2026" },
    { title: "Linux Essentials — fundamentos de Linux, nivel básico a intermedio", detail: "Cisco Networking Academy (NDG) · 2022" },
    { title: "Linux Unhatched — curso de introducción a Linux", detail: "Cisco Networking Academy (NDG) · 2022" },
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

// Contagracia se muestra como un bloque propio: una introducción y una tarjeta por producto o capacidad.
// links: lista de enlaces. icon puede ser "external" (sitio) o "github" (código)
export const contagracia = {
  title: "Ecosistema Contagracia",
  description:
    "Plataforma SaaS multitenant para empresas colombianas, construida en 20 microservicios. Un mismo núcleo da vida a varios productos —ERP, CRM, propiedad horizontal y restaurantes—, cada uno con su propia landing. Llevo más de 3.900 commits entre el front y el back.",
  tags: ["Next.js", "React", "TypeScript", "NestJS", "Microservicios", "Prisma", "PostgreSQL", "Redis · BullMQ"],
  links: [{ label: "contagracia.com", href: "https://contagracia.com", icon: "external" }],
  modules: [
    {
      title: "ERP contable",
      description: "Software contable para MiPymes: facturación electrónica DIAN, contabilidad, nómina, inventario y tesorería.",
      highlights: [
        "Nómina electrónica y planilla PILA con consolidado mensual",
        "Calendario tributario DIAN leído desde PDF, con recordatorios",
        "Reportes y tableros configurables por el usuario",
      ],
      links: [{ label: "contagracia.com/erp", href: "https://contagracia.com/erp", icon: "external" }],
    },
    {
      title: "Propiedad horizontal",
      description: "Administración de copropiedades bajo la Ley 675: cartera, cuotas, portería y comunicación con residentes.",
      highlights: [
        "Facturación de cuotas con mora y pronto pago configurables",
        "Documentos por torre y apartamento",
        "Minuta de portería con trazabilidad",
      ],
      links: [{ label: "contagracia.com/ph", href: "https://contagracia.com/ph", icon: "external" }],
    },
    {
      title: "Restaurantes",
      description: "Operación completa de restaurante: comandas desde la mesa, cocina sincronizada, domicilios y cierre de caja.",
      highlights: [
        "Comandas para cocina en carta y POS, imprimibles o en PDF",
        "Menú público configurable visualmente por cada negocio",
        "Domicilios y reporte de ventas con permisos",
      ],
      links: [{ label: "contagracia.com/restaurant", href: "https://contagracia.com/restaurant", icon: "external" }],
    },
    {
      title: "CRM",
      description: "Gestión comercial con embudo de oportunidades, fichas de contacto y campañas conectadas a Meta y WhatsApp.",
      highlights: [
        "Conversaciones de WhatsApp dentro del CRM",
        "Sincronización de Lead Forms y campañas de Meta Ads",
        "Importador de contactos por pasos y health score de clientes",
      ],
      links: [],
    },
    {
      title: "Automatizaciones tipo n8n",
      description: "Editor visual de flujos con disparadores, condiciones y acciones que conectan todos los módulos de la plataforma.",
      highlights: [
        "Lienzo de nodos con notas, vista previa y validación antes de activar",
        "Disparadores por eventos y por fechas (oportunidades estancadas, cuotas, PQRS, inventario bajo)",
        "Acciones por correo con plantillas editables, WhatsApp y notificaciones internas",
      ],
      tags: ["React Flow"],
      links: [],
    },
    {
      title: "Inteligencia artificial",
      description: "Capa de IA con cuatro proveedores intercambiables —OpenAI, Anthropic, Gemini y DeepSeek— usada en varios frentes.",
      highlights: [
        "Asistente que genera flujos de automatización a partir de lenguaje natural",
        "Lectura de extractos bancarios en PDF: la IA crea la plantilla una vez y luego el parser trabaja sin IA",
        "Chatbot por módulo con exportación de respuestas a PDF y Excel",
      ],
      tags: ["OpenAI", "Anthropic", "Gemini", "DeepSeek"],
      links: [],
    },
    {
      title: "CMS, landings y tienda en línea",
      description: "Gestor de contenido propio para editar las landings de cada producto, el blog y las pantallas de acceso sin tocar código.",
      highlights: [
        "Landings de ERP, PH, restaurantes y contadores editables desde el CMS",
        "Negocios reales publican su propio sitio y tienda con él",
        "Tienda en línea con plantillas, filtros, scroll infinito y SEO con JSON-LD",
        "Integración con Tiendanube: OAuth, webhooks firmados y recepción de pedidos",
      ],
      tags: ["Tiptap"],
      links: [],
      // Sitios reales de clientes hechos con el CMS (se abren en un modal)
      gallery: {
        title: "Sitios creados con el CMS de Contagracia",
        subtitle: "Negocios de distintos sectores que publican su sitio y su tienda en línea con el CMS que desarrollé.",
        sites: [
          { name: "NovaTech", category: "Tecnología y accesorios", href: "https://novatech.contagracia.com/", image: "/showcase/novatech.webp" },
          { name: "CS Supplements", category: "Suplementos naturales", href: "https://cssupplements.contagracia.com/", image: "/showcase/cssupplements.webp" },
          { name: "Restaurante de Charles", category: "Restaurante", href: "https://restaurantedecharles.contagracia.com/", image: "/showcase/restaurantedecharles.webp" },
          { name: "Ferrocafé Hermanos Java", category: "Ferretería", href: "https://ferrocafe.contagracia.com/", image: "/showcase/ferrocafe.webp" },
          { name: "Kany Hernández", category: "Salud y bienestar", href: "https://kany-hernandez.contagracia.com/", image: "/showcase/kany-hernandez.webp" },
          { name: "Maili Spa Cosmetics", category: "Belleza y cosmética", href: "https://meili.contagracia.com/", image: "/showcase/meili.webp" },
          { name: "Melissa Zarene", category: "Vestidos de novia", href: "https://vestidosdenoviamz.contagracia.com/", image: "/showcase/vestidosdenoviamz.webp" },
          { name: "Prieto & Asociadas SAS", category: "Asesoría contable", href: "https://priasas.contagracia.com/", image: "/showcase/priasas.webp" },
          { name: "DAH Solar Colombia", category: "Energía solar", href: "https://dahsolar.contagracia.com/", image: "/showcase/dahsolar.webp" },
        ],
      },
    },
  ],
};

export const projects = [
  {
    title: "Factura Fácil",
    description:
      "Plataforma colombiana de facturación electrónica DIAN, POS, contabilidad, nómina, inventario y tienda virtual. Aporté nuevas funciones y mejoras sobre un sistema ya en producción.",
    highlights: [
      "Personalización visual por empresa: paleta libre con contraste automático (WCAG) y modo oscuro",
      "Tienda virtual con nuevas plantillas que heredan el tema de cada empresa",
      "Extractos bancarios con IA y OCR para PDFs escaneados",
      "Planes y suscripciones, anticipos, PILA y conciliación bancaria",
    ],
    image: "",
    tags: ["Laravel", "PHP", "Vue.js", "Element UI", "MySQL", "IA"],
    links: [{ label: "facturafacil.com.co", href: "https://facturafacil.com.co", icon: "external" }],
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
    links: [],
    gallery: {
      title: "Desarrollo Web",
      subtitle: "Sitios corporativos, landing pages y plataformas que he construido.",
      sites: [
        { name: "Arawana Studio", category: "Agencia de marketing digital", href: "https://arawanahomestudio.com", image: "/web/arawana.webp" },
        { name: "PrometeonDev", category: "Desarrollo de software", href: "https://prometeondev.com", image: "/web/prometeon.webp" },
        { name: "Red Digital Noticias", category: "Portal de noticias", href: "https://reddigitalnoticias.co", image: "/web/reddigital.webp" },
        { name: "Global Play Zone", category: "Juego de billar en línea", href: "https://globalplayzone.com", image: "/web/globalplayzone.webp" },
        { name: "Dalujo CRM", category: "CRM de ventas y conversaciones", href: "https://dalujo-front.prometeondev.com", image: "/web/dalujo.webp" },
        { name: "Dr. Gilberto Rincón", category: "Psiquiatría · landing", href: "https://gilberto-landing.vercel.app", image: "/web/gilberto.webp" },
      ],
    },
  },
];

export const skills = [
  { group: "Lenguajes", items: ["JavaScript", "TypeScript", "C#", "PHP", "Python"] },
  { group: "Backend", items: ["Node.js", "Express", "NestJS", "Microservicios", ".NET Core", "Laravel", "APIs REST", "Redis · BullMQ"] },
  { group: "Frontend", items: ["React", "Next.js", "Vue.js", "React Flow", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap"] },
  { group: "Bases de datos", items: ["PostgreSQL", "MySQL", "MongoDB", "Supabase", "Prisma", "PostGIS"] },
  { group: "Infraestructura y herramientas", items: ["Linux", "Contabo", "DigitalOcean", "Docker", "Git y GitHub", "Postman", "Apidog"] },
  { group: "IA y automatización", items: ["OpenAI", "Anthropic", "Gemini", "DeepSeek", "Flujos tipo n8n", "Python"] },
  { group: "Integraciones", items: ["Facturación electrónica DIAN", "Meta Ads y Lead Forms", "WhatsApp", "Tiendanube", "Webhooks y OAuth"] },
  { group: "Otros", items: ["Análisis funcional", "UI/UX", "Documentación técnica"] },
];

export const experience = [
  {
    period: "Mar 2025 — Actualidad",
    title: "Desarrollador Full Stack",
    place: "Arawana Home Studio · Florencia",
    description:
      "Desarrollo de Contagracia (ERP, CRM, propiedad horizontal, restaurantes, CMS, automatizaciones e IA) y de Factura Fácil (temas por empresa, tienda virtual, extractos con IA), además de sitios corporativos con React, Next.js, NestJS, Vue, PHP y Laravel. Administración de bases de datos PostgreSQL, MySQL y Supabase, y trabajo junto a los equipos de UX/UI, SEO y marketing.",
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

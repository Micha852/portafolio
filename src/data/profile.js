// ✏️ Todo el contenido del portafolio vive aquí. Edita este archivo y la página se actualiza sola.

export const profile = {
  name: "Michael Andrés Martínez Guzmán",
  shortName: "Michael",
  role: "Desarrollador Full Stack",
  degree: "Ingeniero de Sistemas",
  // Frases que se escriben en el hero, una tras otra
  taglines: [
    "Construyo plataformas ERP y de facturación electrónica.",
    "Diseño APIs REST y bases de datos.",
    "Convierto requerimientos en software que funciona.",
  ],
  location: "Florencia, Caquetá, Colombia",
  available: true,
  // Fotos del inicio: rotan con un fundido cada 5 s. position = qué parte se ve al recortar (CSS object-position)
  photos: [
    { src: "/michael-diploma.webp", position: "center 72%", alt: "Michael en su grado de Ingeniería de Sistemas en la Universidad de la Amazonia, con su diploma" },
    { src: "/michael-2.webp", position: "center 30%", alt: "Michael programando en su escritorio con su pato en las piernas" },
    { src: "/michael.jpeg", position: "18% center", alt: "Michael sonriendo en su puesto de trabajo, con código en la pantalla" },
    { src: "/michael-buso-blanco.webp", position: "center 78%", alt: "Michael programando con audífonos en su habitación" },
  ],
  cv: "/cv-michael-martinez-2026-10.pdf",
  about: [
    "Soy Ingeniero de Sistemas y desarrollador Full Stack. Trabajo en todo el ciclo del software: desde levantar requerimientos con los usuarios hasta desplegar, mantener y mejorar plataformas en producción.",
    "Me especializo en aplicaciones web, integración de APIs REST, automatización de procesos y bases de datos relacionales y NoSQL. Mi experiencia como analista funcional y en UX me ayuda a construir herramientas que la gente realmente entiende y usa.",
  ],
  // Insignia junto a la foto del inicio
  heroBadge: { value: "2+", label: "Años de experiencia" },
  // Cifras de la sección Sobre mí
  stats: [
    { value: "3.4k+", label: "Commits en GitHub", detail: "2024 – 2026 · 16+ repositorios" },
    { value: "2 podios", label: "Maratón de Programación", detail: "1.º 2025 · 3.º 2024-1" },
  ],
  // Fotos de los espacios de trabajo (columna derecha de Sobre mí)
  setups: [
    {
      title: "Estación principal",
      image: "/setup/estacion-principal.webp",
    },
    {
      title: "Segundo puesto",
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

// Contagracia es un producto de Arawana Home Studio: se muestra como caso de estudio, con "Mi parte" en cada módulo.
// links: lista de enlaces. icon puede ser "external" (sitio) o "github" (código)
export const contagracia = {
  title: "Ecosistema Contagracia",
  owner: "Arawana Home Studio S.A.S.",
  role: "Desarrollador full stack · prestación de servicios",
  description:
    "Plataforma SaaS de Arawana Home Studio para empresas colombianas, con arquitectura de microservicios. Un mismo núcleo da vida a varios productos —ERP, CRM, propiedad horizontal y restaurantes—. Trabajo en ella como contratista; abajo están los módulos en los que participé y mi parte en cada uno.",
  tags: ["Next.js", "React", "TypeScript", "NestJS", "Microservicios", "Prisma", "PostgreSQL", "Redis · BullMQ"],
  links: [{ label: "contagracia.com", href: "https://contagracia.com", icon: "external" }],
  modules: [
    {
      title: "ERP contable",
      mine: "Nómina y PILA, calendario tributario y reportes.",
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
      mine: "La mayor parte del módulo: estructura de la copropiedad, unidades y copropietarios, zonas comunes, documentos, asambleas, PQRS, comunicados y recordatorios de cobro.",
      description: "Administración de copropiedades: estructura, residentes, zonas comunes, asambleas y comunicación con la administración.",
      highlights: [
        "Estructura de copropiedades: torres, pisos, tipos de unidad y coeficientes",
        "Asambleas con quórum por coeficiente y voto solo de propietarios",
        "Zonas comunes con reservas, documentos por torre y unidad, y PQRS con conversación",
      ],
      links: [{ label: "contagracia.com/ph", href: "https://contagracia.com/ph", icon: "external" }],
      simulator: {
        id: "ph",
        title: "Simulador de software de propiedad horizontal",
        subtitle:
          "Crea una copropiedad ficticia con torres, unidades y coeficientes, y síguela por reservas, cobros, documentos, asamblea y PQRS.",
      },
    },
    {
      title: "Restaurantes",
      mine: "El flujo inicial del módulo, sedes, reservas, sesiones de mesa, cocina con tiempos, menú público y reportes de ventas y propinas.",
      description: "Operación de restaurantes con varias sedes: reservas, atención de mesas, cocina sincronizada y menú público.",
      highlights: [
        "Reservas con disponibilidad en tiempo real y asignación automática que une mesas para grupos grandes",
        "Sesiones de mesa con mesero responsable y cocina en tablero con cronómetro por plato",
        "Menú público por sede con editor visual, y reportes de ventas y propinas por persona",
      ],
      links: [{ label: "contagracia.com/restaurant", href: "https://contagracia.com/restaurant", icon: "external" }],
      simulator: {
        id: "restaurant",
        title: "Simulador de café-bar con sedes y reservas",
        subtitle:
          "Reserva con asignación automática de mesas, atiende la mesa como su mesero, mueve la cocina, diseña el menú público y cierra el día por sede.",
      },
    },
    {
      title: "CRM",
      mine: "Desarrollador principal del módulo: leads, oportunidades, integración con Meta, asignación al equipo, cotizaciones, actividades, salud comercial y los flujos de WhatsApp con IA.",
      description: "Gestión comercial con embudo de oportunidades, fichas de contacto y campañas conectadas a Meta y WhatsApp.",
      highlights: [
        "Leads desde formularios públicos y Meta Lead Ads, con deduplicación y reparto en rotación al equipo",
        "Embudo con actividades, recordatorios y cotización que convierte al contacto en cliente",
        "Salud comercial con señales, y flujos de WhatsApp con IA que pasan la conversación al asesor",
      ],
      links: [],
      // Simulador interactivo (src/components/simulators)
      simulator: {
        id: "crm",
        title: "Simulador de CRM comercial",
        subtitle:
          "Sigue un lead de una academia de idiomas desde el formulario o el anuncio hasta la matrícula, con IA que lo califica y un asesor que cierra.",
      },
    },
    {
      title: "Automatizaciones tipo n8n",
      mine: "Diseño y desarrollo del motor de flujos y del asistente con IA.",
      description: "Editor visual de flujos con disparadores, condiciones y acciones que conectan todos los módulos de la plataforma.",
      highlights: [
        "Lienzo de nodos con notas, vista previa y validación antes de activar",
        "Disparadores por eventos y por fechas (oportunidades estancadas, cuotas, PQRS, inventario bajo)",
        "Acciones por correo con plantillas editables, WhatsApp y notificaciones internas",
      ],
      tags: ["React Flow"],
      links: [],
      simulator: {
        id: "automations",
        title: "Simulador del hub de automatizaciones",
        subtitle:
          "Pídele un flujo al asistente de IA: míralo dibujarse en el lienzo, créalo, pruébalo y actívalo. Lo que aún no se puede hacer queda como solicitud.",
      },
    },
    {
      title: "Inteligencia artificial",
      mine: "Integración de proveedores, chat por módulo y lectura de extractos.",
      description: "Capa de IA con cuatro proveedores intercambiables —OpenAI, Anthropic, Gemini y DeepSeek— usada en varios frentes.",
      highlights: [
        "Asistente que genera flujos de automatización a partir de lenguaje natural",
        "Lectura de PDFs con plantillas que la IA crea una sola vez, con OCR y archivos con contraseña",
        "Chatbot por módulo con exportación de respuestas a PDF y Excel",
      ],
      tags: ["OpenAI", "Anthropic", "Gemini", "DeepSeek"],
      links: [],
      simulator: {
        id: "ai",
        title: "Simulador de una capa de IA multiproveedor",
        subtitle:
          "Modelos con respaldo automático, un asistente que enruta cada pregunta y un lector de PDFs que aprende el formato de cada proveedor una sola vez.",
      },
    },
    {
      title: "CMS, landings y tienda en línea",
      mine: "Landings editables, tienda en línea e integración con Tiendanube.",
      description: "Gestor de contenido propio para editar las landings de cada producto, el blog y las pantallas de acceso sin tocar código.",
      highlights: [
        "Landings de ERP, PH, restaurantes y contadores editables desde el CMS",
        "Negocios que usan Contagracia publican su sitio y su tienda con él",
        "Tienda en línea con plantillas, filtros, scroll infinito y SEO con JSON-LD",
        "Integración con Tiendanube: OAuth, webhooks firmados y recepción de pedidos",
      ],
      tags: ["Tiptap"],
      links: [],
      // Sitios reales de clientes hechos con el CMS (se abren en un modal)
      gallery: {
        title: "Sitios creados con el CMS de Contagracia",
        subtitle: "Negocios que usan Contagracia y armaron su sitio con su CMS.",
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
    group: "arawana",
    owner: "Arawana Home Studio S.A.S.",
    mine: "Personalización visual por empresa, plantillas de tienda, extractos con IA y mejoras contables.",
    description:
      "Plataforma de Arawana Home Studio para facturación electrónica DIAN, POS, contabilidad, nómina, inventario y tienda virtual. Aporté nuevas funciones y mejoras sobre un sistema ya en producción.",
    highlights: [
      "Personalización visual por empresa: paleta libre con contraste automático (WCAG) y modo oscuro",
      "Tienda virtual con nuevas plantillas que heredan el tema de cada empresa",
      "Extractos bancarios con IA y OCR para PDFs escaneados",
      "Planes y suscripciones, anticipos, PILA y conciliación bancaria",
    ],
    image: "/projects/facturafacil.webp",
    tags: ["Laravel", "PHP", "Vue.js", "Element UI", "MySQL", "IA"],
    links: [{ label: "facturafacil.com.co", href: "https://facturafacil.com.co", icon: "external" }],
  },
  {
    title: "Herbario Digital HUAZ 2.0",
    group: "propios",
    owner: "Proyecto propio · Universidad de la Amazonia",
    description:
      "Plataforma para la colección botánica del Herbario de la Universidad de la Amazonia: muestras con taxonomía, imágenes, mapa de recolección, importación y exportación Darwin Core (SiB Colombia / GBIF), fichas y etiquetas en PDF, roles con permisos y un CMS para el sitio público.",
    image: "/projects/herbario.webp",
    tags: ["Next.js", "TypeScript", "NestJS", "Prisma", "PostgreSQL", "Leaflet", "Docker"],
    links: [{ label: "herbariohuaz.com", href: "https://herbariohuaz.com/consultas", icon: "external" }],
  },
  {
    title: "Sitios para clientes de Arawana",
    group: "arawana",
    owner: "Arawana Home Studio S.A.S.",
    mine: "Desarrollo de los sitios.",
    description:
      "Sitios corporativos, landing pages y plataformas para clientes del estudio: marketing, salud, noticias, comercio y juegos en línea.",
    highlights: [
      "Sitio de la agencia Arawana Studio y portal de noticias Red Digital",
      "Juegos en línea: billar en Global Play Zone y partidas por turnos en Intergool",
      "Catálogo con reservas en línea para Trajes Típicos",
      "Landing para el consultorio de psiquiatría del Dr. Gilberto Rincón",
      "Diseño responsive, rendimiento y SEO técnico en todos los sitios",
    ],
    image: "",
    tags: ["Next.js", "React", "Tailwind CSS", "SEO"],
    links: [],
    gallery: {
      title: "Sitios para clientes de Arawana",
      subtitle: "Sitios que desarrollé en Arawana Home Studio para sus clientes.",
      sites: [
        { name: "Arawana Studio", category: "Agencia de marketing digital", href: "https://arawanahomestudio.com", image: "/web/arawana.webp" },
        { name: "Red Digital Noticias", category: "Portal de noticias", href: "https://reddigitalnoticias.co", image: "/web/reddigital-caqueta.webp" },
        { name: "Global Play Zone", category: "Juego de billar en línea", href: "https://globalplayzone.com", image: "/web/globalplayzone.webp" },
        { name: "Trajes Típicos", category: "Alquiler y venta de trajes · reservas en línea", href: "https://trajestipicos.com.co/", image: "/web/trajestipicos.webp" },
        { name: "Intergool", category: "Juego en línea por turnos", href: "https://intergooladmin.globalplayzone.com/", image: "/web/intergool.webp" },
        { name: "Dr. Gilberto Rincón", category: "Psiquiatría · landing", href: "https://gilberto-landing.vercel.app", image: "/web/gilberto.webp" },
      ],
    },
  },
  {
    title: "Colaboraciones con PrometeOnDev",
    group: "propios",
    owner: "PrometeOnDev · emprendimiento de Johan Ramírez y amigos",
    mine: "Colaboré en el sitio del estudio y en la landing de Dalujo.",
    description: "Sitios de PrometeOnDev, un estudio de desarrollo de Florencia, y de Dalujo, su CRM con finanzas para negocios.",
    image: "",
    tags: ["Next.js", "React", "Tailwind CSS"],
    gallery: {
      title: "Colaboraciones con PrometeOnDev",
      subtitle: "Sitios de PrometeOnDev en los que colaboré.",
      sites: [
        { name: "PrometeOnDev", category: "Estudio de desarrollo", href: "https://prometeondev.com", image: "/web/prometeon.webp" },
        { name: "Dalujo", category: "CRM con finanzas · landing", href: "https://dalujo.com.co/", image: "/web/dalujo-sitio.webp" },
      ],
    },
    links: [
      { label: "prometeondev.com", href: "https://prometeondev.com", icon: "external" },
      { label: "dalujo.com.co", href: "https://dalujo.com.co/", icon: "external" },
    ],
  },
];

// wide: columnas que ocupa en escritorio. steps: se muestra como proceso por etapas
export const skills = [
  { group: "Lenguajes", items: ["JavaScript", "TypeScript", "C#", "PHP", "Python", "SQL"] },
  { group: "Backend", items: ["Node.js", "Express", "NestJS", "Microservicios", ".NET Core", "Laravel", "APIs REST", "Redis · BullMQ"] },
  { group: "Frontend", items: ["React", "Next.js", "Vue.js", "React Flow", "Tailwind CSS", "Bootstrap", "HTML5", "CSS3"] },
  { group: "Bases de datos", items: ["PostgreSQL", "MySQL", "MongoDB", "Supabase", "Prisma", "PostGIS"] },
  { group: "Infraestructura y nube", items: ["Linux", "Docker", "Contabo", "DigitalOcean", "MongoDB Atlas", "Git y GitHub", "Postman", "Apidog"] },
  { group: "IA y automatización", items: ["OpenAI", "Anthropic", "Gemini", "DeepSeek", "Agentes con herramientas", "Flujos tipo n8n", "OCR"] },
  {
    group: "Integraciones",
    wide: 2,
    items: [
      "Facturación electrónica DIAN",
      "Nómina electrónica y PILA (SuAporte)",
      "Calendario tributario DIAN",
      "Proveedores de IA",
      "WhatsApp (Meta, Twilio, Evolution)",
      "Meta Ads y Lead Forms",
      "Tiendanube",
      "Webhooks y OAuth",
    ],
  },
  {
    group: "Análisis, documentación y capacitación",
    wide: 4,
    note: "El ciclo completo, desde la primera entrevista hasta que el usuario final usa el sistema.",
    steps: [
      { title: "Levantamiento", items: ["Entrevistas con usuarios", "Catálogo de requisitos"] },
      { title: "Análisis", items: ["ERS (IEEE 830)", "Requisitos funcionales y no funcionales", "Casos de uso"] },
      { title: "Diseño", items: ["Diagramas UML", "Modelo relacional", "Mockups y grafo de navegación", "UI/UX y pruebas de usabilidad"] },
      { title: "Documentación", items: ["Manuales de usuario", "Documentación técnica"] },
      { title: "Capacitación", items: ["Capacitación a usuarios finales", "Soporte funcional"] },
    ],
  },
];

export const experience = [
  {
    kind: "work",
    period: "Mar 2025 — Actualidad",
    title: "Desarrollador Full Stack · contratista",
    place: "Arawana Home Studio S.A.S. · prestación de servicios · Florencia",
    description:
      "Desarrollo de software para los productos del estudio: Contagracia (ERP, CRM, propiedad horizontal, restaurantes, CMS, automatizaciones e IA) y Factura Fácil (temas por empresa, tienda virtual, extractos con IA), además de sitios para sus clientes con React, Next.js, NestJS, Vue, PHP y Laravel. Administración de bases de datos PostgreSQL, MySQL y Supabase, y trabajo junto a los equipos de UX/UI, SEO y marketing.",
  },
  {
    kind: "work",
    period: "Feb 2024 — Mar 2025",
    title: "Analista Funcional / Desarrollador UX",
    place: "Fundación Música, Danza y Teatro del Caquetá (FUNMUDATE)",
    description:
      "Levantamiento y documentación de requerimientos, diseño de prototipos y flujos de navegación, pruebas de usabilidad y enlace entre usuarios, directivos y el equipo de desarrollo. Mejora continua de plataformas y sitios institucionales, soporte funcional y capacitación a usuarios finales. Desempeño certificado como sobresaliente.",
  },
  {
    kind: "study",
    period: "Jul 2019 — Dic 2025",
    title: "Ingeniería de Sistemas",
    place: "Universidad de la Amazonia",
    description: "Formación profesional como Ingeniero de Sistemas.",
  },
  {
    kind: "study",
    period: "Feb 2017 — Dic 2018",
    title: "Técnico en Sistemas",
    place: "Servicio Nacional de Aprendizaje (SENA)",
    description: "Formación técnica en sistemas.",
  },
];

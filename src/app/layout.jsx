import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Tracker from "@/components/Tracker";
import { profile } from "@/data/profile";
import { SITE_URL, personJsonLd } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const TITLE = `${profile.name} · ${profile.role}`;
const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: `${TITLE} · ${profile.degree}` };

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${profile.shortName} · ${profile.role}`,
  description: profile.about[0],
  authors: [{ name: profile.name }],
  icons: { icon: "/icon.svg" },
  alternates: { canonical: "/" },
  // Vista previa al compartir el enlace (WhatsApp, LinkedIn, Facebook, X)
  openGraph: {
    title: TITLE,
    description: profile.about[0],
    type: "website",
    url: SITE_URL,
    siteName: `Portafolio de ${profile.shortName}`,
    locale: "es_CO",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: profile.about[0],
    images: [OG_IMAGE.url],
  },
};

// Aplica el tema guardado antes de pintar para evitar el parpadeo
const themeScript = `
try {
  var t = localStorage.getItem("theme");
  if (t !== "light") document.documentElement.classList.add("dark");
} catch (e) {
  document.documentElement.classList.add("dark");
}`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Datos estructurados de la persona para buscadores y asistentes de IA */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, "\\u003c") }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Tracker />
      </body>
    </html>
  );
}

import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { profile } from "@/data/profile";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const SITE_URL = "https://michael.prometeondev.com";
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
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

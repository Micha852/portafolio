import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { profile } from "@/data/profile";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata = {
  title: `${profile.shortName} · ${profile.role}`,
  description: profile.about[0],
  authors: [{ name: profile.name }],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: `${profile.name} · ${profile.role}`,
    description: profile.about[0],
    type: "website",
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

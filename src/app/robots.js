import { SITE_URL } from "@/lib/site";

// Buscadores y bots de IA pueden leer todo menos el panel privado y la API
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/stats", "/estadisticas", "/no-contar", "/contar", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

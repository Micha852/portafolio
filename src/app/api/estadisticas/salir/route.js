import { sessionCookie, redirectTo } from "@/lib/stats-auth";

// Cierra la sesión del panel en este navegador
export function POST() {
  return redirectTo("/estadisticas", sessionCookie("", 0));
}

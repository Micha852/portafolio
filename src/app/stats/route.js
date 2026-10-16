import { isValidPassword, sessionCookie, redirectTo } from "@/lib/stats-auth";

// Enlace antiguo /stats?key=…: si la clave es válida inicia la sesión; siempre lleva a /estadisticas
export async function GET(req) {
  const key = new URL(req.url).searchParams.get("key");
  return isValidPassword(key) ? redirectTo("/estadisticas", sessionCookie()) : redirectTo("/estadisticas");
}

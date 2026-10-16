import { isValidPassword, sessionCookie, redirectTo } from "@/lib/stats-auth";

// Intentos por IP en una ventana de 15 min, para frenar a quien intente adivinar la contraseña
const WINDOW = 15 * 60 * 1000;
const MAX_TRIES = 8;
const tries = new Map();

function tooMany(ip) {
  const now = Date.now();
  const list = (tries.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  tries.set(ip, list);
  return list.length > MAX_TRIES;
}

export async function POST(req) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (tooMany(ip)) return redirectTo("/estadisticas?error=espera");

  const form = await req.formData().catch(() => null);
  const password = form?.get("password");
  if (!isValidPassword(typeof password === "string" ? password.trim() : "")) return redirectTo("/estadisticas?error=clave");

  tries.delete(ip);
  return redirectTo("/estadisticas", sessionCookie());
}

import { createHmac, timingSafeEqual } from "crypto";

// Sesión del panel de estadísticas: cookie firmada con STATS_KEY, recordada un año en el navegador.
// La contraseña es STATS_PASSWORD (fácil de recordar); si no existe, sirve la clave larga STATS_KEY.
export const STATS_COOKIE = "stats_session";
export const STATS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export function sessionToken() {
  const key = process.env.STATS_KEY;
  return key ? createHmac("sha256", key).update("panel-estadisticas").digest("hex") : null;
}

export function isValidSession(value) {
  const token = sessionToken();
  return !!token && !!value && safeEqual(value, token);
}

export function isValidPassword(password) {
  if (!password) return false;
  return [process.env.STATS_PASSWORD, process.env.STATS_KEY].some((p) => p && safeEqual(password, p));
}

// Cabecera Set-Cookie de la sesión (vacía y vencida para cerrar sesión)
export function sessionCookie(value = sessionToken(), maxAge = STATS_COOKIE_MAX_AGE) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${STATS_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

// Redirección relativa: detrás de nginx, req.url apunta al puerto interno
export const redirectTo = (path, cookie) =>
  new Response(null, { status: 303, headers: { Location: path, ...(cookie ? { "Set-Cookie": cookie } : {}) } });

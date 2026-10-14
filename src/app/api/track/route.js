import { appendEvent, EVENT_TYPES } from "@/lib/stats";

// Bots y previsualizadores de enlaces (WhatsApp, LinkedIn…) no cuentan como visitas
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|linkedin|telegram|discord|preview|headless|lighthouse|curl|wget|python|node-fetch/i;

const clean = (v, max = 80) => (typeof v === "string" ? v.slice(0, max) : undefined);

export async function POST(req) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (BOT.test(ua)) return new Response(null, { status: 204 });

    const body = await req.json();
    if (!EVENT_TYPES.includes(body.type) || typeof body.vid !== "string") return new Response(null, { status: 400 });

    await appendEvent({
      ts: Date.now(),
      type: body.type,
      vid: body.vid.slice(0, 40), // id aleatorio del navegador (no es personal)
      label: clean(body.label),
      ref: clean(body.ref),
      device: /mobile|android|iphone|ipad/i.test(ua) ? "Celular" : "Computador",
    });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}

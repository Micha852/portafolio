import { readEvents, dayOf } from "@/lib/stats";
import { contagracia } from "@/data/profile";

// Panel privado del contador de visitas: /stats?key=STATS_KEY
export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas", robots: { index: false, follow: false } };

const RANGES = { 7: "7 días", 30: "30 días", 90: "90 días" };
const SIM_NAMES = Object.fromEntries(contagracia.modules.filter((m) => m.simulator).map((m) => [m.simulator.id, m.title]));
const fmt = (n) => n.toLocaleString("es-CO");

function count(items, keyFn) {
  const map = new Map();
  items.forEach((i) => {
    const k = keyFn(i);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function Tile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold">{fmt(value)}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// Lista ordenada con barra horizontal (una sola serie, un solo color)
function Ranked({ title, rows, empty = "Sin datos todavía." }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="mb-3 font-display font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(([name, n]) => (
            <li key={name} className="text-sm">
              <div className="mb-1 flex justify-between gap-3">
                <span className="truncate">{name}</span>
                <span className="font-semibold tabular-nums">{fmt(n)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-line/50">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function StatsPage({ searchParams }) {
  const { key, dias } = await searchParams;
  if (!process.env.STATS_KEY || key !== process.env.STATS_KEY) {
    return (
      <section className="grid min-h-screen place-items-center px-6">
        <p className="text-muted">Página no disponible.</p>
      </section>
    );
  }

  const days = RANGES[dias] ? Number(dias) : 30;
  const since = Date.now() - days * 864e5;
  const all = await readEvents();
  const events = all.filter((e) => e.ts >= since);
  const visits = events.filter((e) => e.type === "visit");
  const unique = new Set(visits.map((e) => e.vid)).size;

  // Visitas por día (incluye días en cero)
  const perDay = new Map();
  for (let i = days - 1; i >= 0; i--) perDay.set(dayOf(Date.now() - i * 864e5), 0);
  visits.forEach((v) => perDay.has(dayOf(v.ts)) && perDay.set(dayOf(v.ts), perDay.get(dayOf(v.ts)) + 1));
  const daily = [...perDay.entries()];
  const maxDay = Math.max(1, ...daily.map((d) => d[1]));

  const sims = count(events.filter((e) => e.type === "simulator"), (e) => SIM_NAMES[e.label] ?? e.label);
  const simVisitors = new Set(events.filter((e) => e.type === "simulator").map((e) => e.vid)).size;
  const last = [...visits].reverse().slice(0, 12);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Estadísticas del portafolio</h1>
          <p className="mt-1 text-sm text-muted">Sin contar tus visitas, bots ni previsualizaciones de enlaces.</p>
        </div>
        <nav className="flex gap-1 rounded-full border border-line p-1 text-sm">
          {Object.entries(RANGES).map(([d, label]) => (
            <a
              key={d}
              href={`/stats?key=${encodeURIComponent(key)}&dias=${d}`}
              className={`rounded-full px-3 py-1 ${Number(d) === days ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Tile label="Visitas" value={visits.length} hint="Una por sesión" />
        <Tile label="Personas" value={unique} hint="Navegadores distintos" />
        <Tile label="Abrieron un simulador" value={simVisitors} hint={(() => { const n = sims.reduce((a, s) => a + s[1], 0); return `${fmt(n)} apertura${n === 1 ? "" : "s"} en total`; })()} />
        <Tile label="Descargas del CV" value={events.filter((e) => e.type === "cv").length} />
        <Tile label="Mensajes de contacto" value={events.filter((e) => e.type === "contact").length} />
      </div>

      {/* Visitas por día: barras con detalle al pasar el mouse */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="mb-4 font-display font-semibold">Visitas por día</p>
        <div className="flex h-44 items-end gap-[2px]">
          {daily.map(([d, n]) => (
            <div key={d} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-accent transition group-hover:brightness-125"
                style={{ height: n ? `${Math.max(4, (n / maxDay) * 100)}%` : "2px", opacity: n ? 1 : 0.25 }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs shadow-lg group-hover:block">
                <span className="text-muted">{d}</span> · <strong>{fmt(n)}</strong> visita{n === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{daily[0][0]}</span>
          <span>{daily[daily.length - 1][0]}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Ranked title="De dónde llegan" rows={count(visits, (e) => e.ref)} />
        <Ranked title="Simuladores abiertos" rows={sims} />
        <Ranked title="Dispositivo" rows={count(visits, (e) => e.device)} />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="mb-3 font-display font-semibold">Últimas visitas</p>
        {last.length === 0 ? (
          <p className="text-sm text-muted">Sin visitas todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Origen</th>
                <th className="pb-2 font-medium">Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {last.map((v, i) => (
                <tr key={i} className="border-t border-line/60">
                  <td className="py-2 tabular-nums">{new Date(v.ts).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="py-2">{v.ref}</td>
                  <td className="py-2">{v.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

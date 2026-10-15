"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, ExecLog, Panel, Row, Badge } from "./ui";

// Demo propia de una capa de IA multiproveedor para "Grupo Nova" (empresa ficticia):
// modelos por uso con respaldo automático, un asistente con router de áreas y un lector de listas de precios
// en PDF que crea su plantilla con IA una sola vez. Proveedores, datos, cifras y plantillas son de ejemplo.

const cop = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;
const num = (n) => Math.round(n).toLocaleString("es-CO");
const RED = "#EF4444";
const GREEN = "#10B981";
const AMBER = "#F59E0B";

const PROVIDERS = {
  openai: { label: "OpenAI", short: "OA", color: "#10A37F", models: ["gpt-4o-mini", "gpt-4o"] },
  anthropic: { label: "Anthropic", short: "AN", color: "#D97757", models: ["claude-haiku", "claude-sonnet"] },
  gemini: { label: "Gemini", short: "GE", color: "#4285F4", models: ["gemini-flash", "gemini-pro"] },
  deepseek: { label: "DeepSeek", short: "DS", color: "#6366F1", models: ["deepseek-chat", "deepseek-reasoner"] },
};

const USES = {
  asistente: { label: "Asistente", icon: "sparkles", desc: "Responde preguntas sobre los negocios del grupo." },
  lectura: { label: "Lectura de documentos", icon: "download", desc: "Crea plantillas para leer PDFs de proveedores." },
  flujos: { label: "Creación de flujos", icon: "branch", desc: "Arma automatizaciones a partir de una descripción." },
};

// Cómo se clasifica la falla del proveedor principal
const ERRORS = {
  cuota: { code: "429", label: "Cuota agotada", says: "se quedó sin cuota" },
  clave: { code: "401", label: "Clave inválida", says: "rechazó la clave de acceso" },
  timeout: { code: "504", label: "Tiempo agotado", says: "no respondió a tiempo" },
};

const initialState = () => ({
  uses: {
    asistente: { p: "anthropic", m: "claude-haiku", fb: { p: "openai", m: "gpt-4o-mini" } },
    lectura: { p: "gemini", m: "gemini-flash", fb: { p: "deepseek", m: "deepseek-chat" } },
    flujos: { p: "openai", m: "gpt-4o", fb: null },
  },
  outage: false,
  errKind: "timeout",
  pings: {},
  health: { calls: 128, fallbacks: 3, tokens: 48210, errors: { cuota: 1, clave: 0, timeout: 2 } },
  turns: [],
  job: null,
  templates: [
    { supplier: "Insumos Cumbre", version: 1, by: "gemini-flash", uses: 14, fails: 1, last: "hace 3 días" },
    { supplier: "Bodegas Río Claro", version: 1, by: "deepseek-chat", uses: 12, fails: 5, last: "ayer" },
    { supplier: "Papelería Faro", version: 2, by: "claude-sonnet", uses: 31, fails: 0, last: "hoy" },
  ],
  regen: null,
  log: [],
});

const TABS = [
  ["modelos", "Modelos", "grid"],
  ["asistente", "Asistente", "sparkles"],
  ["lector", "Lector de PDFs", "download"],
  ["plantillas", "Plantillas", "filter"],
];

// Quién atiende un uso ahora mismo, según la configuración y la caída simulada
function resolve(st, use) {
  const u = st.uses[use];
  if (!st.outage) return { p: u.p, m: u.m };
  const err = ERRORS[st.errKind];
  if (u.fb) return { p: u.fb.p, m: u.fb.m, fallback: true, from: u.p, err };
  return { p: u.p, m: u.m, failed: true, err };
}
const who = (r) => `${PROVIDERS[r.p].label} · ${r.m}`;

// Registra una llamada en la franja de salud
function bump(x, r, tokens = 0) {
  x.health.calls += r.fallback ? 2 : 1;
  x.health.tokens += tokens;
  if (r.fallback) x.health.fallbacks += 1;
  if (r.fallback || r.failed) x.health.errors[x.errKind] += 1;
}

export default function AiSimulator() {
  const sim = useSim(initialState);
  const [tab, setTab] = useState("modelos");
  const log = (msg, tone = "info") => sim.update((x) => x.log.push({ msg, tone, id: x.log.length }));
  const jobRunning = sim.st.job && !["listo", "error", "clave"].includes(sim.st.job.phase);

  return (
    <div className="flex h-full flex-col">
      <div data-guide="ai-tabs" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {TABS.map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 ${tab === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
          >
            <Icon name={icon} className="hidden h-3.5 w-3.5 sm:block" />
            {k === "lector" ? (
              <>
                <span className="sm:hidden">Lector</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            ) : (
              label
            )}
            {k === "lector" && jobRunning && tab !== k && <span className="absolute right-1 top-1 h-2 w-2 animate-ping rounded-full bg-warm" />}
          </button>
        ))}
        {sim.st.outage && (
          <span className="hidden shrink-0 sm:inline">
            <Badge color={RED}>Principal caído · {ERRORS[sim.st.errKind].code}</Badge>
          </span>
        )}
        <button
          onClick={sim.reset}
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
          title="Reiniciar"
          aria-label="Reiniciar simulación"
        >
          <Icon name="refresh" className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <div className={tab === "modelos" ? "h-full" : "hidden"}>
          <Models sim={sim} log={log} />
        </div>
        <div className={tab === "asistente" ? "h-full" : "hidden"}>
          <Assistant sim={sim} log={log} goModels={() => setTab("modelos")} />
        </div>
        <div className={tab === "lector" ? "h-full" : "hidden"}>
          <Reader sim={sim} log={log} goTemplates={() => setTab("plantillas")} goModels={() => setTab("modelos")} />
        </div>
        <div className={tab === "plantillas" ? "h-full" : "hidden"}>
          <Templates sim={sim} log={log} />
        </div>
      </div>
      <ExecLog log={sim.st.log} className="h-24 lg:h-28" empty="Prueba un modelo, haz una pregunta o sube un PDF…" />
    </div>
  );
}

// Columna principal con registro abajo; panel lateral opcional (debajo en móvil)
function Shell({ hint, children, side }) {
  return (
    <div className={`h-full overflow-y-auto lg:grid lg:min-h-0 lg:overflow-hidden ${side ? "lg:grid-cols-[1fr_300px]" : "lg:grid-cols-1"}`}>
      <section className="flex flex-col lg:min-h-0">
        {hint && <div className="shrink-0 border-b border-line bg-accent/5 px-4 py-2.5 text-xs text-muted sm:px-5">{hint}</div>}
        <div className="p-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">{children}</div>
      </section>
      {side && <aside className="flex flex-col gap-3 border-t border-line p-4 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">{side}</aside>}
    </div>
  );
}

function ProviderMark({ p, size = "h-6 w-6 text-[9px]" }) {
  const v = PROVIDERS[p];
  return (
    <span className={`grid shrink-0 place-items-center rounded-md font-bold ${size}`} style={{ background: `${v.color}22`, color: v.color }}>
      {v.short}
    </span>
  );
}

function Dot({ color, pulse }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: color }} />}
      <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

const chip = (on) =>
  `rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40 ${on ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:border-accent/50 hover:text-ink"}`;
const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110 disabled:opacity-40";
const btnGhost = "inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium transition hover:border-accent hover:text-accent disabled:opacity-40";

/* ───────────────────────────── 1. Modelos ───────────────────────────── */

function Models({ sim, log }) {
  const { st, update, sequence, busy } = sim;
  const h = st.health;

  const toggleOutage = () => {
    update((x) => (x.outage = !x.outage));
    log(st.outage ? "Simulación: el proveedor principal de cada uso está caído" : "Los proveedores principales vuelven a responder", st.outage ? "warn" : "ok");
  };

  return (
    <Shell hint="Cada uso de la IA tiene su propio modelo y un respaldo. Activa la caída del principal y mira qué pasa aquí y en las otras pestañas.">
      <div className="space-y-4">
        {/* Franja de salud + simulador de caída */}
        <div data-guide="ai-outage" className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Llamadas hoy", num(h.calls), "bolt"],
              ["Respaldos usados", num(h.fallbacks), "repeat"],
              ["Tokens hoy", num(h.tokens), "sparkles"],
              ["Errores", `${h.errors.cuota} · ${h.errors.clave} · ${h.errors.timeout}`, "bell"],
            ].map(([k, v, icon]) => (
              <div key={k} className="rounded-xl border border-line bg-surface/60 px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted">
                  <Icon name={icon} className="h-3 w-3" />
                  {k}
                </p>
                <p className="font-display text-lg font-bold tabular-nums">{v}</p>
                {k === "Errores" && <p className="text-[9px] text-muted">cuota · clave · tiempo</p>}
              </div>
            ))}
          </div>
          <div className={`rounded-xl border p-3 transition ${st.outage ? "border-[#EF4444]/60 bg-[#EF4444]/5" : "border-line"}`}>
            <button onClick={toggleOutage} disabled={busy} className="flex w-full items-center gap-3 text-left disabled:opacity-50" role="switch" aria-checked={st.outage}>
              <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${st.outage ? "bg-[#EF4444]" : "bg-line"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg shadow transition-all ${st.outage ? "left-[18px]" : "left-0.5"}`} />
              </span>
              <span className="text-xs">
                <span className="block font-semibold">Simular caída del proveedor principal</span>
                <span className="text-muted">Afecta al asistente, al lector y a las plantillas.</span>
              </span>
            </button>
            {st.outage && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 animate-pop">
                <span className="text-[10px] text-muted">Tipo de falla:</span>
                {Object.entries(ERRORS).map(([k, e]) => (
                  <button
                    key={k}
                    disabled={busy}
                    onClick={() => {
                      update((x) => (x.errKind = k));
                      log(`La falla simulada ahora es «${e.label}» (${e.code})`, "warn");
                    }}
                    className={chip(st.errKind === k)}
                  >
                    {e.code} {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tarjetas por uso */}
        <div data-guide="ai-cards" className="grid gap-3 md:grid-cols-3">
          {Object.keys(USES).map((k) => (
            <UseCard key={k} id={k} sim={sim} log={log} />
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-line p-3 text-[11px] text-muted">
          <span className="font-semibold text-ink">Cómo decide: </span>
          primero llama al modelo principal del uso. Si falla, clasifica el error (cuota, clave o tiempo de espera) y reintenta con el respaldo del mismo uso. Si no hay respaldo, el usuario ve un
          mensaje claro en vez de un error técnico.
        </div>
      </div>
    </Shell>
  );
}

function UseCard({ id, sim, log }) {
  const { st, update, sequence, busy } = sim;
  const u = st.uses[id];
  const meta = USES[id];
  const r = resolve(st, id);
  const ping = st.pings[id];
  const status = r.failed ? ["Sin servicio", RED] : r.fallback ? ["En respaldo", AMBER] : ["Operativo", GREEN];

  const setPrimary = (p, m) =>
    update((x) => {
      const v = x.uses[id];
      v.p = p;
      v.m = m ?? PROVIDERS[p].models[0];
      if (v.fb?.p === p) v.fb = null;
      delete x.pings[id];
    });
  const setFallback = (val) => {
    update((x) => {
      const [p, m] = val ? val.split("|") : [];
      x.uses[id].fb = val ? { p, m } : null;
      delete x.pings[id];
    });
    log(val ? `${meta.label}: respaldo → ${val.replace("|", " · ")}` : `${meta.label}: sin respaldo`, val ? "info" : "warn");
  };

  const test = () =>
    sequence(async (wait) => {
      update((x) => (x.pings[id] = { state: "run", text: `Llamando a ${who({ p: u.p, m: u.m })}…` }));
      log(`Probar «${meta.label}»: ping corto a ${u.p} · ${u.m}`);
      await wait(800);
      const res = resolve(st, id);
      if (!res.fallback && !res.failed) {
        const ms = 280 + Math.round(Math.random() * 520);
        update((x) => {
          x.pings[id] = { state: "ok", text: `Respondió en ${ms} ms` };
          bump(x, res, 12);
        });
        log(`${who(res)} respondió en ${ms} ms`, "ok");
        return;
      }
      update((x) => (x.pings[id] = { state: "run", text: `Error ${res.err.code}: ${res.err.label.toLowerCase()}` }));
      log(`${PROVIDERS[u.p].label} devolvió ${res.err.code} → clasificado como «${res.err.label}»`, "warn");
      await wait(700);
      if (res.failed) {
        update((x) => {
          x.pings[id] = { state: "err", text: `${res.err.label} y sin respaldo configurado` };
          bump(x, res);
        });
        log(`«${meta.label}» queda sin servicio: no tiene respaldo`, "warn");
        return;
      }
      update((x) => (x.pings[id] = { state: "run", text: `Reintentando con ${who(res)}…` }));
      await wait(700);
      const ms = 420 + Math.round(Math.random() * 600);
      update((x) => {
        x.pings[id] = { state: "fb", text: `Respaldo respondió en ${ms} ms` };
        bump(x, res, 12);
      });
      log(`Respaldo ${who(res)} respondió en ${ms} ms`, "ok");
    });

  return (
    <div className={`flex flex-col rounded-2xl border bg-surface/40 p-3 transition ${r.failed ? "border-[#EF4444]/50" : r.fallback ? "border-warm/50" : "border-line"}`}>
      <div className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon name={meta.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{meta.label}</p>
          <p className="text-[10px] text-muted">{meta.desc}</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: status[1] }}>
          <Dot color={status[1]} pulse={!r.failed} />
          {status[0]}
        </span>
      </div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Principal</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {Object.entries(PROVIDERS).map(([pk, p]) => (
          <button
            key={pk}
            disabled={busy}
            onClick={() => {
              setPrimary(pk);
              log(`${meta.label}: principal → ${p.label} · ${PROVIDERS[pk].models[0]}`);
            }}
            title={p.label}
            className={`rounded-lg border p-0.5 transition disabled:opacity-40 ${u.p === pk ? "border-accent ring-1 ring-accent" : "border-transparent opacity-60 hover:opacity-100"}`}
          >
            <ProviderMark p={pk} />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {PROVIDERS[u.p].models.map((m) => (
          <button key={m} disabled={busy} onClick={() => setPrimary(u.p, m)} className={chip(u.m === m)}>
            {m}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Respaldo</p>
      <select
        value={u.fb ? `${u.fb.p}|${u.fb.m}` : ""}
        disabled={busy}
        onChange={(e) => setFallback(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-xs outline-none focus:border-accent disabled:opacity-50"
      >
        <option value="">Sin respaldo</option>
        {Object.entries(PROVIDERS)
          .filter(([pk]) => pk !== u.p)
          .flatMap(([pk, p]) =>
            p.models.map((m) => (
              <option key={pk + m} value={`${pk}|${m}`}>
                {p.label} · {m}
              </option>
            )),
          )}
      </select>

      <div className="mt-3 flex items-center gap-2 border-t border-line/60 pt-3">
        <button onClick={test} disabled={busy} className={btnGhost}>
          <Icon name="play" className="h-3 w-3" />
          Probar
        </button>
        {ping && (
          <span
            className={`min-w-0 flex-1 truncate text-[11px] ${ping.state === "ok" ? "text-accent" : ping.state === "fb" ? "text-warm" : ping.state === "err" ? "text-[#EF4444]" : "text-muted"}`}
            title={ping.text}
          >
            {ping.state === "run" && <Icon name="refresh" className="mr-1 inline h-3 w-3 animate-spin" />}
            {ping.text}
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── 2. Asistente ───────────────────────────── */

const AREAS = {
  academia: { label: "Academia Nova", icon: "users", color: "#6366F1", words: ["leads", "matrícula", "clase", "curso"] },
  cafe: { label: "Café Nova", icon: "bolt", color: "#D97706", words: ["ventas", "producto", "latte", "mesa"] },
  complejo: { label: "Complejo Nova", icon: "calendar", color: "#0EA5E9", words: ["reservas", "canchas", "salón", "sábado"] },
};

const QUESTIONS = [
  {
    q: "¿Cuántos leads nuevos tuvo la Academia esta semana?",
    area: "academia",
    conf: 96,
    hits: ["leads", "Academia"],
    tokens: 1840,
    title: "Leads de la semana",
    text: "La Academia Nova recibió **46 leads** esta semana. **9** ya agendaron su clase de prueba.",
    table: [
      ["Canal", "Leads", "Agendaron"],
      ["Instagram", "21", "4"],
      ["WhatsApp", "15", "3"],
      ["Sitio web", "10", "2"],
    ],
  },
  {
    q: "¿Qué vendió más el Café en septiembre?",
    area: "cafe",
    conf: 91,
    hits: ["vendió", "Café"],
    tokens: 2210,
    title: "Más vendidos de septiembre",
    text: "El producto estrella de septiembre fue el **latte de avena**. Los tres primeros suman **$19.460.000**.",
    table: [
      ["Producto", "Unidades", "Ventas"],
      ["Latte de avena", "1.284", "$8.988.000"],
      ["Croissant de almendra", "932", "$5.592.000"],
      ["Cold brew", "610", "$4.880.000"],
    ],
  },
  {
    q: "¿Qué canchas del Complejo quedan libres el sábado?",
    area: "complejo",
    conf: 94,
    hits: ["canchas", "sábado"],
    tokens: 1690,
    title: "Disponibilidad del sábado",
    text: "El sábado hay **3 espacios con franjas libres**. El salón de eventos sigue sin reservas.",
    table: [
      ["Espacio", "Libre", "Ocupación"],
      ["Cancha sintética 1", "7:00 – 9:00", "78 %"],
      ["Cancha sintética 2", "14:00 – 16:00", "64 %"],
      ["Salón de eventos", "Todo el día", "0 %"],
    ],
  },
  { q: "¿Cómo nos fue este mes?", ambiguous: true, conf: 38, hits: ["mes"] },
];

// Respuestas de resumen mensual cuando la pregunta es ambigua y el usuario elige el área
const MONTHLY = {
  academia: {
    title: "Resumen del mes · Academia",
    tokens: 1520,
    text: "La Academia cerró el mes con **31 matrículas nuevas**, un 12 % más que el mes pasado.",
    table: [
      ["Indicador", "Mes", "Variación"],
      ["Leads", "184", "+9 %"],
      ["Matrículas", "31", "+12 %"],
      ["Conversión", "16,8 %", "+0,5 pt"],
    ],
  },
  cafe: {
    title: "Resumen del mes · Café",
    tokens: 1610,
    text: "El Café vendió **$62.300.000** en el mes, con ticket promedio de $18.400.",
    table: [
      ["Indicador", "Mes", "Variación"],
      ["Ventas", "$62.300.000", "+6 %"],
      ["Tickets", "3.386", "+4 %"],
      ["Ticket promedio", "$18.400", "+2 %"],
    ],
  },
  complejo: {
    title: "Resumen del mes · Complejo",
    tokens: 1480,
    text: "El Complejo tuvo **412 reservas** y la ocupación de canchas subió al 71 %.",
    table: [
      ["Indicador", "Mes", "Variación"],
      ["Reservas", "412", "+15 %"],
      ["Ocupación canchas", "71 %", "+6 pt"],
      ["Eventos en salón", "5", "+1"],
    ],
  },
};

function Assistant({ sim, log, goModels }) {
  const { st, update, sequence, busy } = sim;
  const end = useRef(null);
  const r = resolve(st, "asistente");
  const waiting = st.turns.some((t) => t.stage === "choose");

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [st.turns.length, st.turns.at(-1)?.stage]);

  const answer = async (wait, i, area, data) => {
    update((x) => (x.turns[i].stage = "model"));
    const res = resolve(st, "asistente");
    await wait(700);
    if (res.failed || res.fallback) {
      update((x) => (x.turns[i].primaryErr = res.err));
      log(`${PROVIDERS[st.uses.asistente.p].label} devolvió ${res.err.code} (${res.err.label})`, "warn");
      await wait(700);
    }
    if (res.failed) {
      update((x) => {
        x.turns[i].stage = "error";
        x.turns[i].via = res;
        bump(x, res);
      });
      log("Asistente sin respaldo configurado: se muestra un mensaje amable al usuario", "warn");
      return;
    }
    if (res.fallback) {
      update((x) => (x.turns[i].retry = true));
      log(`Reintentando con el respaldo ${who(res)}`);
      await wait(800);
    }
    update((x) => (x.turns[i].stage = "writing"));
    await wait(900);
    const ms = 900 + Math.round(Math.random() * 900) + (res.fallback ? 600 : 0);
    update((x) => {
      Object.assign(x.turns[i], { stage: "done", area, data, via: res, ms });
      bump(x, res, data.tokens);
    });
    log(`${AREAS[area].label}: respuesta con tabla de ${data.table.length - 1} filas · ${who(res)} · ${num(data.tokens)} tokens`, res.fallback ? "warn" : "ok");
  };

  const ask = (item) =>
    sequence(async (wait) => {
      const i = st.turns.length;
      update((x) => x.turns.push({ q: item.q, stage: "routing", item }));
      log(`Pregunta: «${item.q}»`);
      await wait(900);
      if (item.ambiguous) {
        update((x) => {
          x.turns[i].stage = "choose";
          x.turns[i].conf = item.conf;
        });
        log(`Router: confianza ${item.conf} %, no alcanza el umbral (70 %) → se pregunta el área`, "warn");
        return;
      }
      update((x) => {
        x.turns[i].area = item.area;
        x.turns[i].conf = item.conf;
        x.turns[i].stage = "routed";
      });
      log(`Router: área «${AREAS[item.area].label}» (${item.conf} %) por las palabras ${item.hits.map((h) => `«${h}»`).join(", ")}`);
      await wait(600);
      await answer(wait, i, item.area, item);
    });

  const pick = (i, area) =>
    sequence(async (wait) => {
      update((x) => {
        x.turns[i].area = area;
        x.turns[i].picked = true;
        x.turns[i].stage = "routed";
      });
      log(`Elegiste el área «${AREAS[area].label}»`);
      await wait(400);
      await answer(wait, i, area, MONTHLY[area]);
    });

  const exportAs = (i, fmt) => {
    const t = st.turns[i];
    const file = `${t.data.title.replace(/ · /g, " - ")}.${fmt === "PDF" ? "pdf" : "xlsx"}`;
    update((x) => {
      const e = (x.turns[i].exported ||= []);
      if (!e.includes(fmt)) e.push(fmt);
    });
    log(`Exportar ${fmt}: «${file}» con encabezado de Grupo Nova, la pregunta y ${t.data.table.length - 1} filas`, "ok");
  };

  return (
    <Shell
      hint="Elige una pregunta: el router detecta el área del negocio y el modelo responde con una tabla. Prueba también la caída del principal o quitar el respaldo en Modelos."
      side={
        <>
          <Panel guide="ai-router" title="Router de áreas" icon="branch">
            {Object.entries(AREAS).map(([k, a]) => {
              const last = st.turns.at(-1);
              const on = last?.area === k;
              return (
                <div key={k} className={`rounded-xl border p-2 transition ${on ? "border-accent bg-accent/10" : "border-line/60"}`}>
                  <p className="flex items-center gap-1.5 text-xs font-semibold">
                    <span style={{ color: a.color }}>
                      <Icon name={a.icon} className="h-3.5 w-3.5" />
                    </span>
                    {a.label}
                    {on && last.conf && !last.picked && <span className="ml-auto text-[10px] text-accent">{last.conf} %</span>}
                    {on && last.picked && <span className="ml-auto text-[10px] text-accent">elegida</span>}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">Pistas: {a.words.join(", ")}</p>
                </div>
              );
            })}
            <p className="pt-1 text-[10px] text-muted">Si la confianza es menor al 70 %, el asistente te pregunta el área en vez de adivinar.</p>
          </Panel>
          <Panel title="Modelo del asistente" icon="sparkles">
            <Row k="Principal" v={`${PROVIDERS[st.uses.asistente.p].label} · ${st.uses.asistente.m}`} />
            <Row k="Respaldo" v={st.uses.asistente.fb ? `${PROVIDERS[st.uses.asistente.fb.p].label} · ${st.uses.asistente.fb.m}` : "—"} />
            <p className={`pt-1 text-[11px] font-semibold ${r.failed ? "text-[#EF4444]" : r.fallback ? "text-warm" : "text-accent"}`}>
              {r.failed ? "Ahora mismo no puede responder" : r.fallback ? "Respondería el respaldo" : "Responde el principal"}
            </p>
          </Panel>
        </>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="space-y-4">
          {st.turns.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line p-5 text-center">
              <Icon name="sparkles" className="mx-auto h-6 w-6 text-accent" />
              <p className="mt-2 text-sm font-semibold">Asistente de Grupo Nova</p>
              <p className="text-xs text-muted">Pregunta por la Academia, el Café o el Complejo. Cada pregunta pasa por el router antes de llegar al modelo.</p>
            </div>
          )}
          {st.turns.map((t, i) => (
            <Turn key={i} t={t} i={i} busy={busy} pick={pick} exportAs={exportAs} goModels={goModels} assistantUse={st.uses.asistente} />
          ))}
          <div ref={end} />
        </div>

        <div className="mt-5 border-t border-line pt-3">
          <p className="mb-2 text-[11px] text-muted">Preguntas sugeridas</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {QUESTIONS.map((item) => (
              <button
                key={item.q}
                disabled={busy || waiting}
                onClick={() => ask(item)}
                className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-left text-xs transition hover:border-accent hover:bg-accent/5 disabled:opacity-40"
              >
                <Icon name={item.ambiguous ? "filter" : AREAS[item.area].icon} className="h-3.5 w-3.5 shrink-0 text-accent" />
                {item.q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Turn({ t, i, busy, pick, exportAs, goModels, assistantUse }) {
  const g = t.stage;
  const states = [
    g === "routing" || g === "choose" ? "run" : "done",
    g === "model" ? "run" : g === "writing" || g === "done" ? "done" : g === "error" ? "err" : "off",
    g === "writing" ? "run" : g === "done" ? "done" : "off",
  ];
  const area = t.area && AREAS[t.area];
  const pipe = [
    ["Router", t.stage === "choose" ? "¿Qué área?" : area ? area.label : "Analizando…"],
    ["Modelo", t.via ? who(t.via) : t.retry ? "Respaldo…" : t.primaryErr ? `Error ${t.primaryErr.code}` : `${PROVIDERS[assistantUse.p].label}`],
    ["Respuesta", t.stage === "done" ? `${t.ms} ms` : t.stage === "error" ? "No disponible" : "…"],
  ];

  return (
    <div className="animate-pop space-y-2">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-3 py-2 text-sm text-bg">{t.q}</p>
      </div>

      {/* Pipeline visible: router → modelo → respuesta */}
      <div className="flex flex-wrap items-center gap-1 text-[10px]">
        {pipe.map(([k, v], n) => {
          const s = states[n];
          return (
            <span key={k} className="flex items-center gap-1">
              {n > 0 && <Icon name="arrow" className="h-3 w-3 text-muted" />}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  s === "done" ? "border-accent/50 text-accent" : s === "run" ? "border-warm/60 text-warm" : s === "err" ? "border-[#EF4444]/60 text-[#EF4444]" : "border-line text-muted"
                }`}
              >
                {s === "run" && <Icon name="refresh" className="h-2.5 w-2.5 animate-spin" />}
                <b className="font-semibold">{k}:</b> {v}
              </span>
            </span>
          );
        })}
      </div>

      {t.stage === "choose" && (
        <div className="rounded-2xl border border-warm/50 bg-warm/10 p-3 text-xs">
          <p className="font-semibold">No estoy seguro de qué negocio hablas ({t.conf} % de confianza).</p>
          <p className="text-muted">¿Sobre cuál quieres el resumen del mes?</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(AREAS).map(([k, a]) => (
              <button
                key={k}
                disabled={busy}
                onClick={() => pick(i, k)}
                className="inline-flex items-center gap-1 rounded-full border border-warm/60 bg-bg px-3 py-1 font-semibold transition hover:bg-warm/20 disabled:opacity-40"
              >
                <Icon name={a.icon} className="h-3 w-3" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {t.stage === "error" && (
        <div className="rounded-2xl border border-[#EF4444]/50 bg-[#EF4444]/5 p-3 text-xs">
          <p className="font-semibold text-[#EF4444]">Ahora no pude responder 😕</p>
          <p className="mt-0.5">
            {PROVIDERS[t.via.p].label} {t.via.err.says} y este asistente no tiene un modelo de respaldo. Tus datos están bien; solo falta un proveedor alterno.
          </p>
          <button onClick={goModels} className="mt-2 text-[11px] font-semibold text-accent hover:underline">
            Configurar un respaldo en Modelos →
          </button>
        </div>
      )}

      {t.stage === "done" && (
        <div className="rounded-2xl rounded-tl-sm border border-line bg-surface/60 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${area.color}22`, color: area.color }}>
              <Icon name={area.icon} className="h-3 w-3" />
              {area.label}
            </span>
            {t.via.fallback && <Badge color={AMBER}>respondió el respaldo</Badge>}
          </div>
          <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.data.text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
          <div className="mt-2 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-xs">
              <thead className="bg-bg/60 text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  {t.data.table[0].map((c, ci) => (
                    <th key={c} className={`px-2.5 py-1.5 font-semibold ${ci ? "text-right" : ""}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.data.table.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-t border-line/60">
                    {row.map((c, ci) => (
                      <td key={ci} className={`px-2.5 py-1.5 ${ci ? "text-right tabular-nums" : "font-medium"}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted">
            <span>
              {who(t.via)} · {num(t.data.tokens)} tokens · {t.ms} ms
            </span>
            <span className="ml-auto flex items-center gap-1">
              {["PDF", "Excel"].map((f) => {
                const done = t.exported?.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => exportAs(i, f)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 transition ${done ? "border-accent/50 text-accent" : "border-line hover:border-accent hover:text-accent"}`}
                  >
                    <Icon name={done ? "check" : "download"} className="h-3 w-3" />
                    {f}
                  </button>
                );
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── 3. Lector de PDFs ───────────────────────────── */

// Plantillas de lectura por proveedor (esquema propio de la demo)
const SPECS = {
  "Distribuidora Altamar": {
    cols: ["Referencia", "Producto", "Unidad", "Precio", "IVA"],
    pattern: "REF(5) · NOMBRE · UNIDAD · $ PRECIO · IVA %",
    regex: String.raw`^([A-Z]{2}-\d{3})\s+(.+?)\s+(UND|KG|LT|PAQ)\s+\$\s?([\d.]+)\s+(\d{1,2})%$`,
    marks: ["ALTAMAR", "LISTA DE PRECIOS"],
    from: "REF",
    to: "TOTAL REFERENCIAS",
  },
  "Insumos Cumbre": {
    cols: ["Código", "Artículo", "Presentación", "Valor", "IVA"],
    pattern: "CÓDIGO · ARTÍCULO · PRESENTACIÓN · VALOR · IVA",
    regex: String.raw`^(\d{4})\s+(.+?)\s+(\S+)\s+([\d.]+)\s+(\d{1,2})$`,
    marks: ["INSUMOS CUMBRE", "PRECIOS VIGENTES"],
    from: "CÓDIGO",
    to: "FIN DE LISTA",
  },
  "Bodegas Río Claro": {
    cols: ["Ítem", "Descripción", "Empaque", "Precio"],
    pattern: "ÍTEM · DESCRIPCIÓN · EMPAQUE · PRECIO",
    regex: String.raw`^(\d+)\.\s+(.+?)\s+\((.+?)\)\s+([\d.]+)$`,
    marks: ["RÍO CLARO"],
    from: "ÍTEM",
    to: "SUBTOTAL",
  },
  "Papelería Faro": {
    cols: ["SKU", "Descripción", "Unidad", "Precio"],
    pattern: "SKU · DESCRIPCIÓN · UNIDAD · PRECIO",
    regex: String.raw`^(PF\d{4})\s+(.+?)\s+(\w+)\s+([\d.]+)$`,
    marks: ["PAPELERÍA FARO"],
    from: "SKU",
    to: "TOTAL",
  },
};

// [referencia, producto, unidad, precio, iva, problema]
const PDFS = [
  {
    id: "altamar-oct",
    name: "altamar_lista_octubre.pdf",
    supplier: "Distribuidora Altamar",
    pages: 3,
    tag: "Proveedor nuevo",
    rows: [
      ["AL-101", "Café en grano tostado", "KG", 46000, 5],
      ["AL-102", "Leche de avena 1 L", "LT", 9800, 19],
      ["AL-117", "Vaso compostable 12 oz x50", "PAQ", 21500, 19],
      ["AL-120", "Tapa para vaso x50", "PAQ", 8400, 19],
      ["AL-131", "Azúcar morena 1 kg", "KG", 6200, 5],
      ["AL-140", "Cacao en polvo 500 g", "UND", 18900, 19],
      ["AL-152", "Jarabe de vainilla 750 ml", "UND", 0, 19, "Precio vacío en el PDF"],
      ["AL-160", "Servilleta x200", "PAQ", 7300, 19],
    ],
  },
  {
    id: "altamar-nov",
    name: "altamar_lista_noviembre.pdf",
    supplier: "Distribuidora Altamar",
    pages: 3,
    tag: "Mismo proveedor",
    rows: [
      ["AL-101", "Café en grano tostado", "KG", 47400, 5],
      ["AL-102", "Leche de avena 1 L", "LT", 9800, 19],
      ["AL-117", "Vaso compostable 12 oz x50", "PAQ", 22100, 19],
      ["AL-120", "Tapa para vaso x50", "PAQ", 8400, 19],
      ["AL-131", "Azúcar morena 1 kg", "KG", 6400, 5],
      ["AL-140", "Cacao en polvo 500 g", "UND", 19500, 19],
      ["AL-152", "Jarabe de vainilla 750 ml", "UND", 24900, 19],
      ["AL-160", "Servilleta x200", "PAQ", 7300, 19],
      ["AL-171", "Bolsa kraft para llevar", "BULTO", 15600, 19, "Unidad «BULTO» no reconocida"],
    ],
  },
  {
    id: "cumbre",
    name: "cumbre_precios_escaneado.pdf",
    supplier: "Insumos Cumbre",
    pages: 2,
    tag: "Escaneado · con clave",
    locked: true,
    scanned: true,
    rows: [
      ["2201", "Balón fútbol sala #4", "UND", 89000, 19],
      ["2215", "Malla para arco 3 × 2 m", "UND", 145000, 19],
      ["2230", "Cono de entrenamiento 30 cm", "UND", 18900, 19, "OCR dudoso: «1B.900» leído como 18.900"],
      ["3104", "Desinfectante 4 L", "GALÓN", 32500, 19],
      ["3112", "Toalla de papel x6", "PAQ", 27800, 19],
      ["3120", "Pintura de demarcación 1 gal", "GALÓN", 96000, 19],
    ],
  },
];
const PASSWORD = "cumbre2026";

function Reader({ sim, log, goTemplates, goModels }) {
  const { st, update, sequence, busy } = sim;
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const job = st.job;

  const step = (x, text, pct, tone) => {
    x.job.steps.push({ text, tone, t: `00:${String(x.job.steps.length).padStart(2, "0")}` });
    if (pct != null) x.job.pct = pct;
  };

  const process = async (wait, file) => {
    if (file.scanned) {
      update((x) => step(x, "No hay capa de texto: se pasa por OCR", 32));
      log("El PDF es una imagen escaneada: OCR antes de leer");
      for (let p = 1; p <= file.pages; p++) {
        await wait(700);
        update((x) => step(x, `OCR página ${p}/${file.pages} · confianza ${p === 1 ? 97 : 93} %`, 32 + p * 10));
      }
      await wait(400);
    }
    const tpl = st.templates.find((t) => t.supplier === file.supplier);
    if (tpl) {
      update((x) => {
        step(x, `Huella reconocida → plantilla «${tpl.supplier}» v${tpl.version}`, 62, "ok");
        x.job.mode = "plantilla";
        x.job.tpl = `v${tpl.version}`;
      });
      log(`Plantilla encontrada para ${file.supplier}: se lee sin IA`, "ok");
      await wait(700);
      update((x) => step(x, "Lectura determinística de filas · 0 tokens de IA", 84));
      await wait(600);
      update((x) => {
        x.job.tokens = 0;
        x.job.ms = 30 + Math.round(Math.random() * 25);
        x.templates.find((t) => t.supplier === file.supplier).uses += 1;
      });
    } else {
      const res = resolve(st, "lectura");
      update((x) => {
        step(x, "Proveedor sin plantilla: la IA la crea una sola vez", 40, "warn");
        x.job.mode = "ia";
      });
      log(`${file.supplier} no tiene plantilla: se le pide a la IA que la cree`);
      await wait(700);
      if (res.failed || res.fallback) {
        update((x) => step(x, `${PROVIDERS[st.uses.lectura.p].label}: error ${res.err.code} (${res.err.label})`, 44, "err"));
        log(`Lectura: el principal devolvió ${res.err.code}`, "warn");
        await wait(600);
      }
      if (res.failed) {
        update((x) => {
          step(x, "Sin modelo de respaldo para lectura: el trabajo se detiene", 44, "err");
          x.job.phase = "error";
          x.job.error = `${PROVIDERS[res.p].label} ${res.err.says} y «Lectura de documentos» no tiene respaldo. El PDF quedó guardado; vuelve a intentarlo cuando configures uno.`;
          bump(x, res);
        });
        log("Trabajo detenido: sin respaldo para lectura de documentos", "warn");
        return;
      }
      const spec = SPECS[file.supplier];
      const tokens = 3200 + Math.round(Math.random() * 600);
      update((x) => {
        x.job.via = res;
        x.job.gen = { cols: [], pattern: null, saved: false };
        step(x, `${who(res)} analiza la página 1${res.fallback ? " (respaldo)" : ""}`, 50);
      });
      await wait(900);
      for (const c of spec.cols) {
        update((x) => x.job.gen.cols.push(c));
        await wait(220);
      }
      update((x) => step(x, `Columnas detectadas: ${spec.cols.length}`, 64));
      await wait(500);
      update((x) => {
        x.job.gen.pattern = spec.pattern;
        step(x, `Patrón de fila propuesto y probado contra las ${file.pages} páginas`, 74);
      });
      await wait(800);
      update((x) => {
        x.job.gen.saved = true;
        x.job.tokens = tokens;
        x.job.ms = 2400 + Math.round(Math.random() * 600);
        x.templates.push({ supplier: file.supplier, version: 1, by: res.m, uses: 1, fails: 0, last: "ahora", fresh: true });
        step(x, `Plantilla guardada · ${file.supplier} v1`, 82, "ok");
        bump(x, res, tokens);
      });
      log(`Plantilla creada con ${who(res)} (${num(tokens)} tokens). Los próximos PDFs de ${file.supplier} se leen sin IA`, "ok");
      await wait(600);
    }
    update((x) => step(x, "Validando: conteo del pie de página, precios y unidades", 94));
    await wait(700);
    const problems = file.rows.filter((r) => r[5]).length;
    update((x) => {
      x.job.result = { rows: file.rows, problems, total: file.rows.reduce((a, r) => a + r[3], 0) };
      x.job.phase = "listo";
      x.job.pct = 100;
      step(x, `Listo · ${file.rows.length} filas leídas, ${problems} con problemas`, 100, "ok");
    });
    log(`${file.name}: ${file.rows.length} productos, ${problems} para revisar`, problems ? "warn" : "ok");
  };

  const run = (file) =>
    sequence(async (wait) => {
      setPw("");
      setPwErr(false);
      const id = `J-${(410 + st.health.calls) % 1000}`;
      update((x) => (x.job = { id, file, phase: "cola", pct: 4, steps: [], mode: null }));
      update((x) => step(x, `${file.name} recibido · trabajo ${id} en cola`, 6));
      log(`Trabajo ${id} creado para ${file.name} (se procesa en segundo plano)`);
      await wait(800);
      update((x) => {
        x.job.phase = "corriendo";
        step(x, `Abriendo PDF · ${file.pages} páginas`, 14);
      });
      await wait(600);
      if (file.locked) {
        update((x) => {
          x.job.phase = "clave";
          step(x, "El PDF pide contraseña", 18, "warn");
        });
        log("PDF protegido: el trabajo espera la contraseña", "warn");
        return;
      }
      await process(wait, file);
    });

  const unlock = () => {
    if (pw.trim() !== PASSWORD) {
      setPwErr(true);
      log("Contraseña incorrecta: el PDF sigue cerrado", "warn");
      return;
    }
    setPwErr(false);
    sequence(async (wait) => {
      update((x) => {
        x.job.phase = "corriendo";
        step(x, "PDF desbloqueado", 24, "ok");
      });
      log("PDF desbloqueado; la clave no se guarda");
      await wait(500);
      await process(wait, job.file);
    });
  };

  const importNow = () => {
    const ok = job.result.rows.length - job.result.problems;
    update((x) => (x.job.imported = true));
    log(`Importado al catálogo: ${ok} productos con precio actualizado; ${job.result.problems} quedan en revisión`, "ok");
  };

  const phaseBadge = { cola: ["En cola", "#94A3B8"], corriendo: ["Procesando", AMBER], clave: ["Esperando clave", AMBER], listo: ["Terminado", GREEN], error: ["Detenido", RED] };
  const hasTpl = (f) => st.templates.some((t) => t.supplier === f.supplier);

  return (
    <Shell
      hint="Sube las listas en orden: la primera de Altamar crea la plantilla con IA, la segunda ya se lee sin IA. La de Cumbre está escaneada y con clave."
      side={
        <>
          <Panel title="Modelo de lectura" icon="download">
            {(() => {
              const r = resolve(st, "lectura");
              return (
                <>
                  <Row k="Ahora" v={r.failed ? "Sin servicio" : who(r)} />
                  {r.fallback && <Badge color={AMBER}>usando el respaldo</Badge>}
                  <p className="text-[10px] text-muted">Solo se usa para crear plantillas nuevas. Un proveedor conocido se lee sin gastar IA.</p>
                </>
              );
            })()}
          </Panel>
          {job?.gen && (
            <Panel title="Plantilla generada" icon="sparkles" className="animate-pop">
              <p className="text-[10px] text-muted">Columnas detectadas</p>
              <div className="flex flex-wrap gap-1">
                {job.gen.cols.map((c) => (
                  <span key={c} className="animate-pop rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    {c}
                  </span>
                ))}
              </div>
              {job.gen.pattern && (
                <>
                  <p className="pt-1 text-[10px] text-muted">Patrón de fila</p>
                  <code className="block rounded-lg bg-bg/80 p-1.5 font-mono text-[10px] text-accent">{job.gen.pattern}</code>
                </>
              )}
              {job.gen.saved && (
                <>
                  <Row k="Tokens usados" v={num(job.tokens)} />
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Icon name="check" className="h-3.5 w-3.5" /> Plantilla guardada
                  </p>
                  <button onClick={goTemplates} className="text-[11px] text-accent hover:underline">
                    Ver en Plantillas →
                  </button>
                </>
              )}
            </Panel>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {PDFS.map((f) => (
            <button
              key={f.id}
              disabled={busy}
              onClick={() => run(f)}
              className={`group rounded-2xl border p-3 text-left transition hover:border-accent disabled:opacity-40 ${job?.file.id === f.id ? "border-accent bg-accent/5" : "border-line"}`}
            >
              <div className="flex items-start gap-2">
                <span className="grid h-10 w-8 shrink-0 place-items-center rounded-md border border-line bg-bg text-[8px] font-bold text-[#EF4444]">PDF</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{f.supplier}</p>
                  <p className="truncate font-mono text-[10px] text-muted">{f.name}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge color={f.locked ? AMBER : "#64748B"}>{f.tag}</Badge>
                <Badge color={hasTpl(f) ? GREEN : "#6366F1"}>{hasTpl(f) ? "con plantilla" : "sin plantilla"}</Badge>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent">
                <Icon name="download" className="h-3 w-3 rotate-180" /> Subir
              </p>
            </button>
          ))}
        </div>

        {!job && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted">Elige una lista de precios para convertirla en catálogo.</p>}

        {job && (
          <div data-guide="ai-job" className="space-y-3">
            <div className="rounded-2xl border border-line bg-surface/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xs font-semibold">Trabajo {job.id}</p>
                <Badge color={phaseBadge[job.phase][1]}>{phaseBadge[job.phase][0]}</Badge>
                {job.mode === "ia" && <Badge color="#6366F1">crea plantilla con IA</Badge>}
                {job.mode === "plantilla" && <Badge color={GREEN}>plantilla {job.tpl} · sin IA</Badge>}
                {job.via?.fallback && <Badge color={AMBER}>respaldo</Badge>}
                <span className="ml-auto text-[11px] tabular-nums text-muted">{job.pct} %</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/60">
                <div className={`h-full transition-all duration-500 ${job.phase === "error" ? "bg-[#EF4444]" : "bg-accent"}`} style={{ width: `${job.pct}%` }} />
              </div>
              <ol className="mt-2 space-y-0.5 font-mono text-[11px]">
                {job.steps.map((s, i) => {
                  const live = i === job.steps.length - 1 && busy;
                  return (
                    <li key={i} className={`flex gap-2 ${s.tone === "err" ? "text-[#EF4444]" : s.tone === "warn" ? "text-warm" : s.tone === "ok" ? "text-accent" : "text-muted"}`}>
                      <span className="shrink-0 opacity-60">{s.t}</span>
                      {live && <Icon name="refresh" className="mt-0.5 h-3 w-3 shrink-0 animate-spin" />}
                      <span>{s.text}</span>
                    </li>
                  );
                })}
              </ol>
              {(job.phase === "cola" || job.phase === "corriendo") && <p className="mt-2 text-[10px] text-muted">Corre en segundo plano: puedes ir a otra pestaña y volver.</p>}
              {job.mode && job.ms != null && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
                  <Stat k="Tokens de IA" v={num(job.tokens)} hi={job.tokens === 0} />
                  <Stat k="Tiempo de lectura" v={job.ms > 1000 ? `${(job.ms / 1000).toFixed(1)} s` : `${job.ms} ms`} hi={job.ms < 1000} />
                  <Stat k="Plantilla" v={job.mode === "ia" ? "nueva v1" : `reusada ${job.tpl}`} />
                </div>
              )}
            </div>

            {job.phase === "clave" && (
              <div className="animate-pop rounded-2xl border border-warm/50 bg-warm/10 p-3 text-xs">
                <p className="font-semibold">Este PDF está protegido</p>
                <p className="text-muted">
                  Escribe la contraseña que te dio el proveedor. En la demo es <code className="font-mono text-ink">{PASSWORD}</code>.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && unlock()}
                    placeholder="Contraseña del PDF"
                    className={`w-44 rounded-lg border bg-bg px-2 py-1.5 font-mono outline-none focus:border-accent ${pwErr ? "border-[#EF4444]" : "border-line"}`}
                  />
                  <button onClick={unlock} disabled={busy} className="rounded-full bg-warm px-3 py-1.5 font-semibold text-bg disabled:opacity-40">
                    Desbloquear
                  </button>
                  <button onClick={() => setPw(PASSWORD)} className="text-[11px] text-muted hover:text-ink">
                    Usar la de la demo
                  </button>
                </div>
                {pwErr && <p className="mt-1 text-[11px] text-[#EF4444]">Esa no es. Revisa mayúsculas y vuelve a intentar.</p>}
              </div>
            )}

            {job.phase === "error" && (
              <div className="animate-pop rounded-2xl border border-[#EF4444]/50 bg-[#EF4444]/5 p-3 text-xs">
                <p className="font-semibold text-[#EF4444]">No se pudo crear la plantilla</p>
                <p className="mt-0.5">{job.error}</p>
                <button onClick={goModels} className="mt-2 text-[11px] font-semibold text-accent hover:underline">
                  Ir a Modelos →
                </button>
              </div>
            )}

            {job.result && <Catalog job={job} importNow={importNow} />}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Stat({ k, v, hi }) {
  return (
    <div className="rounded-xl border border-line bg-bg/50 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted">{k}</p>
      <p className={`text-sm font-bold tabular-nums ${hi ? "text-accent" : ""}`}>{v}</p>
    </div>
  );
}

function Catalog({ job, importNow }) {
  const { rows, problems, total } = job.result;
  const box = useRef(null);
  useEffect(() => {
    box.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [job.id]);
  return (
    <div ref={box} className="animate-pop scroll-mt-4 space-y-2 rounded-2xl border border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">Catálogo de {job.file.supplier}</p>
        <span className="ml-auto flex flex-wrap gap-1">
          <Badge color={GREEN}>
            {rows.length}/{rows.length} filas · cuadra con el pie
          </Badge>
          <Badge color={problems ? AMBER : GREEN}>{problems ? `${problems} por revisar` : "sin problemas"}</Badge>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-xs">
          <thead className="text-left text-[10px] uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="py-1.5 pr-2">Ref.</th>
              <th className="pr-2">Producto</th>
              <th className="pr-2">Unidad</th>
              <th className="pr-2 text-right">Precio</th>
              <th className="pr-2 text-right">IVA</th>
              <th className="text-right">Validación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className={`border-b border-line/50 ${r[5] ? "bg-warm/5" : ""}`}>
                <td className="py-1.5 pr-2 font-mono text-[10px] text-muted">{r[0]}</td>
                <td className="pr-2 font-medium">{r[1]}</td>
                <td className="pr-2">{r[2]}</td>
                <td className="pr-2 text-right tabular-nums">{r[3] ? cop(r[3]) : "—"}</td>
                <td className="pr-2 text-right">{r[4]} %</td>
                <td className="text-right">
                  {r[5] ? (
                    <span className="text-[10px] text-warm" title={r[5]}>
                      ⚠ {r[5]}
                    </span>
                  ) : (
                    <Icon name="check" className="ml-auto h-3.5 w-3.5 text-accent" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-[11px]">
              <td colSpan={3} className="pt-1.5 text-muted">
                Suma de precios leídos
              </td>
              <td className="pt-1.5 pr-2 text-right font-semibold tabular-nums">{cop(total)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {job.imported ? (
          <p className="flex items-center gap-1 text-xs font-semibold text-accent">
            <Icon name="check" className="h-4 w-4" />
            {rows.length - problems} productos importados · {problems} en revisión
          </p>
        ) : (
          <>
            <button onClick={importNow} className={btnPrimary}>
              <Icon name="check" className="h-3.5 w-3.5" />
              Importar al catálogo
            </button>
            {problems > 0 && <span className="text-[11px] text-muted">Las filas con problemas no se importan; quedan para revisión.</span>}
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── 4. Plantillas ───────────────────────────── */

// Esquema propio de la demo para guardar una plantilla de lectura
function templateJson(t) {
  const s = SPECS[t.supplier];
  const slug = t.supplier.toLowerCase().replace(/ /g, "_").normalize("NFD").replace(/[̀-ͯ]/g, "");
  return JSON.stringify(
    {
      id: `tpl_${slug}_v${t.version}`,
      proveedor: t.supplier,
      version: t.version,
      origen: { tipo: "ia", modelo: t.by },
      reconocer: { texto_contiene: s.marks },
      tabla: { empieza_en: s.from, termina_en: s.to },
      fila: { patron: s.regex, campos: s.cols.map((c) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")) },
      numeros: { miles: ".", decimal: "," },
      controles: ["conteo_vs_pie", "precio_mayor_a_cero", "unidad_conocida"],
      uso: { lecturas: t.uses, fallidas: t.fails },
    },
    null,
    2,
  );
}

function Templates({ sim, log }) {
  const { st, update, sequence, busy } = sim;
  const [sel, setSel] = useState(null);
  const shown = st.templates.find((t) => t.supplier === sel);

  const regenerate = (t) =>
    sequence(async (wait) => {
      const { version, fails } = t;
      update((x) => (x.regen = { supplier: t.supplier, step: "Tomando los últimos PDFs que fallaron como muestra…" }));
      log(`Regenerar «${t.supplier}»: ${t.fails} lecturas fallidas de ${t.uses}`);
      await wait(900);
      const res = resolve(st, "lectura");
      if (res.failed || res.fallback) {
        log(`Lectura: el principal devolvió ${res.err.code} (${res.err.label})`, "warn");
      }
      if (res.failed) {
        update((x) => {
          x.regen = { supplier: t.supplier, step: `${PROVIDERS[res.p].label} ${res.err.says} y no hay respaldo. La versión actual sigue activa.`, err: true };
          bump(x, res);
        });
        log("No se regeneró: lectura sin respaldo. La plantilla anterior sigue en uso", "warn");
        return;
      }
      update((x) => (x.regen.step = `${who(res)} propone una versión nueva${res.fallback ? " (respaldo)" : ""}…`));
      await wait(1100);
      update((x) => (x.regen.step = "Probando la versión nueva contra los PDFs que fallaban…"));
      await wait(1000);
      const tokens = 2900 + Math.round(Math.random() * 500);
      update((x) => {
        const v = x.templates.find((y) => y.supplier === t.supplier);
        v.version += 1;
        v.by = res.m;
        v.fails = 0;
        v.last = "ahora";
        v.fresh = true;
        x.regen = null;
        bump(x, res, tokens);
      });
      setSel(t.supplier);
      log(`«${t.supplier}» v${version + 1} ${fails ? `lee bien los ${fails} PDFs que fallaban` : "probada con los últimos PDFs"} · ${num(tokens)} tokens. La v${version} queda archivada`, "ok");
    });

  return (
    <Shell
      hint="Cada proveedor tiene una plantilla que se creó con IA una vez. Si empieza a fallar (por ejemplo, el proveedor cambió el formato), se regenera."
      side={
        <Panel title="Plantilla en JSON" icon="filter">
          {shown ? (
            <>
              <p className="text-xs font-semibold">
                {shown.supplier} · v{shown.version}
              </p>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-bg/80 p-2 font-mono text-[10px] leading-relaxed text-accent">{templateJson(shown)}</pre>
            </>
          ) : (
            <p className="text-xs text-muted">Toca «JSON» en una plantilla para ver cómo se guarda.</p>
          )}
        </Panel>
      }
    >
      <div data-guide="ai-templates" className="grid gap-3 sm:grid-cols-2">
        {st.templates.map((t) => {
          const rate = t.uses ? Math.round(((t.uses - t.fails) / t.uses) * 100) : 100;
          const bad = t.uses && t.fails / t.uses > 0.2;
          const working = st.regen?.supplier === t.supplier;
          return (
            <div key={t.supplier} className={`rounded-2xl border p-3 transition ${bad ? "border-warm/60" : t.fresh ? "border-accent/60 bg-accent/5" : "border-line"}`}>
              <div className="flex items-start gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 font-display text-sm font-bold text-accent">{t.supplier[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.supplier}</p>
                  <p className="text-[10px] text-muted">
                    v{t.version} · creada con {t.by} · último uso {t.last}
                  </p>
                </div>
                <Badge color={bad ? AMBER : GREEN}>{bad ? "Revisar" : "Sana"}</Badge>
              </div>
              <div className="mt-3 flex items-end justify-between text-[11px]">
                <span>
                  <b className="tabular-nums">{t.uses}</b> <span className="text-muted">lecturas</span> · <b className={`tabular-nums ${bad ? "text-warm" : ""}`}>{t.fails}</b>{" "}
                  <span className="text-muted">fallidas</span>
                </span>
                <span className="tabular-nums text-muted">{rate} % ok</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/60">
                <div className={`h-full ${bad ? "bg-warm" : "bg-accent"}`} style={{ width: `${rate}%` }} />
              </div>
              {working && (
                <p className={`mt-2 flex items-start gap-1 text-[11px] ${st.regen.err ? "text-[#EF4444]" : "text-warm"}`}>
                  {!st.regen.err && <Icon name="refresh" className="mt-0.5 h-3 w-3 shrink-0 animate-spin" />}
                  {st.regen.step}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => setSel(t.supplier)} className={btnGhost}>
                  {"{ }"} JSON
                </button>
                <button
                  onClick={() => regenerate(t)}
                  disabled={busy}
                  className={bad ? "inline-flex items-center gap-1.5 rounded-full bg-warm px-3 py-1.5 text-xs font-semibold text-bg transition hover:brightness-110 disabled:opacity-40" : btnGhost}
                >
                  <Icon name="sparkles" className="h-3 w-3" />
                  Regenerar con IA
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

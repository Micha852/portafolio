"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, ExecLog, Panel, Row, Badge } from "./ui";

// Réplica de la capa de IA de Contagracia: configuración por proveedor y funcionalidad con respaldo,
// chat "Gracia" con router de módulos, y extractos bancarios con plantillas generadas por IA + parser determinístico.
// Etiquetas, reglas y mensajes salen del código; los datos financieros son de ejemplo.

const cop = (n) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("es-CO")}`;

const PROVIDERS = {
  gemini: { label: "Google Gemini", emoji: "✨", desc: "Gemini 2.5 Flash - Rápido y eficiente", models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"] },
  openai: { label: "OpenAI", emoji: "🤖", desc: "GPT-4o - Más reciente y multimodal", models: ["gpt-4o", "gpt-4-turbo"] },
  anthropic: { label: "Anthropic Claude", emoji: "🧠", desc: "Claude Sonnet 4.5 - Inteligente y eficiente", models: ["claude-sonnet-4-5", "claude-haiku-4-5-20251001", "claude-opus-4-7"] },
  deepseek: { label: "DeepSeek", emoji: "🐳", desc: "V4 Flash - Económico, ideal para extractos", models: ["deepseek-flash", "deepseek-v4-pro"] },
};
// Resultado de "Probar" para cada API key en la demo
const KEY_TEST = {
  gemini: ["ok", "Conexión exitosa (412ms)"],
  openai: ["err", "Sin créditos. La cuenta asociada a esta API key no tiene saldo. Revisa el plan de facturación del proveedor."],
  anthropic: ["ok", "Conexión exitosa (688ms)"],
  deepseek: ["ok", "Conexión exitosa (531ms)"],
};
const FEATURES = {
  extractos: "Extractos Bancarios",
  chat: "Chat Asistente",
  automatizaciones: "Asistente de automatizaciones",
};

const initialState = () => ({
  active: "gemini",
  router: true,
  features: {
    extractos: { provider: "gemini", model: "gemini-2.5-flash", fallback: "deepseek", fallbackModel: "deepseek-flash" },
    chat: { provider: "gemini", model: "gemini-2.5-flash", fallback: "deepseek", fallbackModel: "deepseek-flash" },
    automatizaciones: { provider: "deepseek", model: "deepseek-flash", fallback: "", fallbackModel: "" },
  },
  quotaOut: false, // simula "cuota agotada" en el proveedor principal
  identity: {
    name: "Gracia",
    role: "Asistente contable especializado",
    welcome: "¿En qué le puedo ayudar hoy?",
    avatar: "✨",
    tone: "profesional",
    detail: "mixto",
    emojis: true,
    proactive: true,
  },
  keyTests: {},
  showRecs: false,
  // Chat
  messages: [],
  pill: "auto",
  thinking: null,
  suggestion: null,
  // Extractos
  ext: null,
  templates: [
    { banco: "AV-VILLAS", variante: "cuenta movil", version: 2, usos: 41, fallos: 1, active: true },
    { banco: "BAN100", variante: "Cuenta Ban100", version: 1, usos: 9, fallos: 0, active: true },
    { banco: "BANCO DE OCCIDENTE", variante: "Cuenta Corriente", version: 1, usos: 17, fallos: 0, active: true },
    { banco: "BANCOLOMBIA", variante: "CUENTA CORRIENTE", version: 3, usos: 88, fallos: 2, active: true },
    { banco: "BANCOLOMBIA", variante: "Cuenta de Ahorros", version: 1, usos: 126, fallos: 3, active: true },
    { banco: "BBVA", variante: "Ahorros Libretón", version: 2, usos: 23, fallos: 0, active: true },
    { banco: "BOLD", variante: "Depósito de Bajo Monto", version: 2, usos: 14, fallos: 0, active: true },
    { banco: "DAVIVIENDA", variante: "Ahorros", version: 1, usos: 57, fallos: 1, active: true },
    { banco: "NEQUI", variante: "Depósito de Bajo Monto", version: 2, usos: 73, fallos: 6, active: true },
    { banco: "NU", variante: "Cuenta Nu", version: 1, usos: 11, fallos: 0, active: true },
    { banco: "POPULAR", variante: "Ahorros", version: 1, usos: 8, fallos: 0, active: true },
  ],
  log: [],
});

const TABS = [
  ["config", "Configuración de IA", "grid"],
  ["chat", "Chat · Gracia", "sparkles"],
  ["extractos", "Extractos bancarios", "download"],
  ["plantillas", "Plantillas · admin", "filter"],
];

export default function AiSimulator() {
  const sim = useSim(initialState);
  const [tab, setTab] = useState("config");
  const log = (msg, tone = "info") => sim.update((x) => x.log.push({ msg, tone, id: x.log.length }));

  return (
    <div className="flex h-full flex-col">
      <div data-guide="ai-tabs" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {TABS.map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${tab === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
          >
            <Icon name={icon} className="h-3.5 w-3.5" />
            {k === "chat" ? `Chat · ${sim.st.identity.name || "Asistente"}` : label}
          </button>
        ))}
        {sim.st.quotaOut && <Badge color="#EF4444">Cuota agotada en el principal</Badge>}
        <button onClick={sim.reset} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent" title="Reiniciar" aria-label="Reiniciar simulación">
          <Icon name="refresh" className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <div className={tab === "config" ? "h-full" : "hidden"}>
          <Config sim={sim} log={log} />
        </div>
        <div className={tab === "chat" ? "h-full" : "hidden"}>
          <Chat sim={sim} log={log} />
        </div>
        <div className={tab === "extractos" ? "h-full" : "hidden"}>
          <Extractos sim={sim} log={log} goTemplates={() => setTab("plantillas")} />
        </div>
        <div className={tab === "plantillas" ? "h-full" : "hidden"}>
          <Templates sim={sim} log={log} />
        </div>
      </div>
    </div>
  );
}

// Columna principal + registro; en móvil todo hace scroll
function Shell({ hint, children, log, side }) {
  return (
    <div className="h-full overflow-y-auto lg:grid lg:min-h-0 lg:grid-cols-[1fr_300px] lg:overflow-hidden">
      <section className="flex flex-col lg:min-h-0">
        {hint && <div className="shrink-0 border-b border-line bg-warm/10 px-5 py-2.5 text-xs font-medium text-warm">{hint}</div>}
        <div className="p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">{children}</div>
        <ExecLog log={log} className="h-28" />
      </section>
      <aside className="flex flex-col gap-3 border-t border-line p-4 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">{side}</aside>
    </div>
  );
}

const Select = ({ value, onChange, children, label }) => (
  <label className="block text-[11px]">
    <span className="mb-1 block text-muted">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-xs outline-none focus:border-accent">
      {children}
    </select>
  </label>
);

// Quién responde una funcionalidad, según la configuración y la cuota simulada
function resolveProvider(st, feature) {
  const f = st.features[feature];
  const primary = f.provider || st.active;
  const model = f.provider ? f.model : PROVIDERS[st.active].models[0];
  if (!st.quotaOut) return { provider: primary, model, fallbackUsed: false };
  if (f.fallback) return { provider: f.fallback, model: f.fallbackModel || PROVIDERS[f.fallback].models[0], fallbackUsed: true };
  return { provider: primary, model, failed: true };
}

/* ───────────────────────────── 1. Configuración ───────────────────────────── */

function Config({ sim, log }) {
  const { st, update } = sim;
  const setFeature = (k, field, value) =>
    update((x) => {
      const f = x.features[k];
      f[field] = value;
      if (field === "provider") f.model = value ? PROVIDERS[value].models[0] : "";
      if (field === "fallback") f.fallbackModel = value ? PROVIDERS[value].models[0] : "";
    });

  return (
    <Shell
      hint="Cambia proveedores y modelos: el chat y los extractos de las otras pestañas usan esta configuración."
      log={st.log}
      side={
        <>
          <Panel guide="ai-who" title="Quién responde hoy">
            {Object.entries(FEATURES).map(([k, label]) => {
              const r = resolveProvider(st, k);
              return (
                <div key={k} className="text-xs">
                  <p className="text-muted">{label}</p>
                  <p className={`font-semibold ${r.failed ? "text-[#EF4444]" : r.fallbackUsed ? "text-warm" : ""}`}>
                    {r.failed ? "Falla: sin respaldo configurado" : `${PROVIDERS[r.provider].label} · ${r.model}${r.fallbackUsed ? " (respaldo)" : ""}`}
                  </p>
                </div>
              );
            })}
          </Panel>
          <Panel guide="ai-quota" title="Simular falla del proveedor">
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={st.quotaOut}
                onChange={(e) => {
                  update((x) => (x.quotaOut = e.target.checked));
                  log(e.target.checked ? "Simulación: el proveedor principal se quedó sin cuota" : "El proveedor principal volvió a responder", e.target.checked ? "warn" : "ok");
                }}
                className="mt-0.5 accent-[rgb(var(--accent))]"
              />
              <span>La cuota del proveedor principal se agotó. Mira cómo responde el respaldo, o el error si no hay respaldo.</span>
            </label>
          </Panel>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <p className="font-display font-bold">Proveedor de IA y Modelos</p>
          <p className="mb-3 text-xs text-muted">Proveedor Activo · El proveedor seleccionado se usará para todas las consultas del asistente.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(PROVIDERS).map(([k, p]) => (
              <button
                key={k}
                onClick={() => {
                  update((x) => (x.active = k));
                  log(`Proveedor activo: ${p.label}`);
                }}
                className={`rounded-xl border p-3 text-left transition ${st.active === k ? "border-accent bg-accent/10" : "border-line hover:border-accent/50"}`}
              >
                <p className="text-sm font-semibold">
                  {p.emoji} {p.label}
                </p>
                <p className="text-[11px] text-muted">{p.desc}</p>
              </button>
            ))}
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-line p-3 text-xs">
            <input type="checkbox" checked={st.router} onChange={(e) => update((x) => (x.router = e.target.checked))} className="mt-0.5 accent-[rgb(var(--accent))]" />
            <span>
              <span className="font-semibold">✨ Router automático de módulos</span>
              <span className="block text-muted">La IA elige qué módulo usar según cada pregunta del chat, con DeepSeek Flash (~$0.00007 USD por pregunta). Si lo desactivas, el chat solo usa el módulo que el usuario seleccione.</span>
            </span>
          </label>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display font-bold">Modelos por Funcionalidad</p>
              <p className="text-xs text-muted">Si no configuras una, se usa el proveedor activo global. Con respaldo automático si se agota la cuota.</p>
            </div>
            <button onClick={() => update((x) => (x.showRecs = !x.showRecs))} className="rounded-full border border-line px-3 py-1 text-[11px] transition hover:border-accent hover:text-accent">
              Indicaciones y recomendaciones
            </button>
          </div>
          {st.showRecs && <Recommendations />}
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(FEATURES).map(([k, label]) => {
              const f = st.features[k];
              return (
                <div key={k} className="space-y-2 rounded-xl border border-line p-3">
                  <p className="text-sm font-semibold">{label}</p>
                  <Select label="Proveedor" value={f.provider} onChange={(v) => setFeature(k, "provider", v)}>
                    <option value="">— usar global —</option>
                    {Object.entries(PROVIDERS).map(([pk, p]) => (
                      <option key={pk} value={pk}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                  {f.provider && (
                    <Select label="Modelo" value={f.model} onChange={(v) => setFeature(k, "model", v)}>
                      {PROVIDERS[f.provider].models.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </Select>
                  )}
                  <Select label="Respaldo (si falla el principal)" value={f.fallback} onChange={(v) => setFeature(k, "fallback", v)}>
                    <option value="">— sin respaldo —</option>
                    {Object.entries(PROVIDERS)
                      .filter(([pk]) => pk !== (f.provider || st.active))
                      .map(([pk, p]) => (
                        <option key={pk} value={pk}>
                          {p.label}
                        </option>
                      ))}
                  </Select>
                  {f.fallback && (
                    <Select label="Modelo de respaldo" value={f.fallbackModel} onChange={(v) => setFeature(k, "fallbackModel", v)}>
                      {PROVIDERS[f.fallback].models.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </Select>
                  )}
                  {k === "extractos" && (f.model === "deepseek-v4-pro" || f.fallbackModel === "deepseek-v4-pro") && (
                    <p className="text-[11px] text-[#EF4444]">⚠️ NUNCA usar DeepSeek V4 Pro en extractos: consume todos los tokens en razonamiento interno y devuelve 0 movimientos.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <p className="font-display font-bold">Identidad y Personalidad</p>
          <p className="mb-3 text-xs text-muted">Cómo se presenta y responde el asistente. Pruébelo en la pestaña del chat.</p>
          <Identity st={st} update={update} log={log} />
        </section>

        <section>
          <p className="font-display font-bold">API Keys de Modelos de IA</p>
          <p className="mb-3 text-xs text-muted">Configura las claves de API para los diferentes proveedores.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(PROVIDERS).map(([k, p]) => {
              const t = st.keyTests[k];
              return (
                <div key={k} className="rounded-xl border border-line p-3 text-xs">
                  <p className="mb-1 text-muted">{p.label} API Key</p>
                  <div className="flex gap-2">
                    <input readOnly value="sk-••••••••••••••••" className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 font-mono text-[11px]" />
                    <button
                      onClick={() => {
                        update((x) => (x.keyTests[k] = KEY_TEST[k]));
                        log(`${p.label}: ${KEY_TEST[k][1]}`, KEY_TEST[k][0] === "ok" ? "ok" : "warn");
                      }}
                      className="rounded-lg border border-line px-2.5 transition hover:border-accent hover:text-accent"
                    >
                      Probar
                    </button>
                  </div>
                  {t && <p className={`mt-1.5 ${t[0] === "ok" ? "text-accent" : "text-[#EF4444]"}`}>{p.label}: {t[1]}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Identity({ st, update, log }) {
  const id = st.identity;
  const set = (field, value) => update((x) => (x.identity[field] = value));
  const input = "w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-xs outline-none focus:border-accent";
  const chip = (on) => `rounded-full border px-2.5 py-1 text-[11px] transition ${on ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-ink"}`;

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4 md:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-[11px]">
          <span className="mb-1 block text-muted">Nombre del Asistente</span>
          <input value={id.name} maxLength={24} onChange={(e) => set("name", e.target.value)} onBlur={() => log(`Nombre del asistente: ${id.name || "(vacío)"}`)} className={input} />
        </label>
        <label className="block text-[11px]">
          <span className="mb-1 block text-muted">Rol/Profesión</span>
          <input value={id.role} maxLength={60} onChange={(e) => set("role", e.target.value)} className={input} />
        </label>
        <label className="block text-[11px]">
          <span className="mb-1 block text-muted">Mensaje de Bienvenida</span>
          <input value={id.welcome} maxLength={90} onChange={(e) => set("welcome", e.target.value)} className={input} />
        </label>
        <div>
          <p className="mb-1 text-[11px] text-muted">Avatar/Emoji</p>
          <div className="flex flex-wrap gap-1">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => set("avatar", a)} className={`grid h-8 w-8 place-items-center rounded-lg border text-base transition ${id.avatar === a ? "border-accent bg-accent/15" : "border-line"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[11px] text-muted">Tono de Conversación</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(TONES).map(([k, [label, desc]]) => (
              <button
                key={k}
                onClick={() => {
                  set("tone", k);
                  log(`Tono de conversación: ${label}`);
                }}
                className={`rounded-lg border p-2 text-left transition ${id.tone === k ? "border-accent bg-accent/10" : "border-line hover:border-accent/50"}`}
              >
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-muted">{desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[11px] text-muted">Nivel de Detalle</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DETAILS).map(([k, label]) => (
              <button key={k} onClick={() => set("detail", k)} className={chip(id.detail === k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={id.emojis} onChange={(e) => set("emojis", e.target.checked)} className="accent-[rgb(var(--accent))]" />
          Usar Emojis
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={id.proactive} onChange={(e) => set("proactive", e.target.checked)} className="accent-[rgb(var(--accent))]" />
          Sugerencias Proactivas
        </label>
        <div className="rounded-lg bg-bg/70 p-2 text-xs">
          <p className="text-[10px] uppercase tracking-widest text-muted">Vista previa</p>
          <p className="mt-1">
            <span className="mr-1">{id.avatar}</span>
            <span className="font-semibold">{id.name || "Asistente"}</span> <span className="text-muted">· {id.role}</span>
          </p>
          <p className="mt-0.5">
            ¡Hola! Soy {id.name || "su asistente"}. {id.welcome}
          </p>
        </div>
      </div>
    </div>
  );
}

function Recommendations() {
  return (
    <div className="mb-3 animate-pop space-y-3 rounded-xl border border-accent/40 bg-accent/5 p-4 text-xs">
      <p className="font-semibold">Indicaciones y recomendaciones (jun-2026)</p>
      <p className="text-muted">Basado en pruebas reales con extractos colombianos (Nequi, Bancolombia) y conversaciones de chat. Estas son las combinaciones que mejor balance velocidad/costo/calidad mostraron.</p>
      <div>
        <p className="font-semibold">📄 Extractos Bancarios</p>
        <p>Primario sugerido: Gemini 2.5 Flash · Respaldo sugerido: DeepSeek Flash</p>
        <p className="text-muted">Gemini fue el más rápido (~15-20s) con buena precisión. DeepSeek también extrae correctamente todos los movimientos, pero es lento (3+ min) por ser muy verbose — sirve genial como respaldo barato cuando Gemini se cae por cuota.</p>
        <p className="text-[#EF4444]">⚠️ NUNCA usar DeepSeek V4 Pro en extractos: consume todos los tokens en razonamiento interno y devuelve 0 movimientos.</p>
      </div>
      <div>
        <p className="font-semibold">💬 Chat Asistente</p>
        <p>Primario sugerido: Gemini 2.5 Flash o DeepSeek Flash · Respaldo sugerido: DeepSeek Flash (si primario es Gemini)</p>
        <p className="text-muted">DeepSeek se desempeñó muy bien en chat (4-7s de latencia, respuestas claras y bien estructuradas). Gemini sigue siendo el más rápido. Anthropic Haiku 4.5 es excelente en ambos cuando hay saldo, pero más caro.</p>
      </div>
      <p className="text-muted">El respaldo responde automáticamente cuando el principal no puede hacerlo: sin API key, key inválida, cuota agotada o cualquier otro error.</p>
    </div>
  );
}

/* ───────────────────────────── 2. Chat ───────────────────────────── */

const CHAT_MODULES = {
  general: ["General", "💬"],
  bancos: ["Bancos", "🏦"],
  cartera: ["Cartera", "💳"],
  crm: ["CRM", "🎯"],
  ph: ["PH", "🏢"],
  restaurante: ["Restaurante", "🍽️"],
  nomina: ["Nómina", "👥"],
};

// Opciones de "Identidad y Personalidad"
const AVATARS = ["🤖", "💼", "📊", "💰", "🧠", "💬", "🎯", "✨", "🚀", "💡"];
const TONES = {
  profesional: ["💼 Profesional", "Claro y directo"],
  amigable: ["😊 Amigable", "Cálido y cercano"],
  casual: ["🗣️ Casual", "Relajado y conversacional"],
  tecnico: ["🤓 Técnico", "Preciso y detallado"],
};
const DETAILS = { conciso: "📝 Conciso", mixto: "📊 Mixto", detallado: "📖 Detallado" };
const TONE_OPENERS = {
  profesional: ["", ""],
  amigable: ["¡Con mucho gusto! ", "¡Con mucho gusto! 😊 "],
  casual: ["¡Listo! Mira: ", "¡Listo! 👌 Mira: "],
  tecnico: ["Según los datos del módulo: ", "📐 Según los datos del módulo: "],
};

// Aplica la personalidad configurada a la respuesta del modelo
function styleAnswer(item, id) {
  let blocks = item.answer.split("\n\n");
  if (id.detail === "conciso") blocks = blocks.slice(0, 2);
  let text = blocks.join("\n\n");
  if (!id.emojis) text = text.replace(/\p{Extended_Pictographic}️?\s?/gu, "");
  text = TONE_OPENERS[id.tone][id.emojis ? 1 : 0] + text;
  if (id.detail === "detallado") text += "\n\nFuente: datos del módulo consultados en este momento; los valores incluyen todas las sedes de la empresa.";
  if (id.proactive && item.followUp) text += `\n\n${id.emojis ? "💡 " : ""}${item.followUp}`;
  return text;
}

const QUESTIONS = [
  {
    q: "¿Cuánto tengo en el banco?",
    module: "bancos",
    reason: "Pregunta por saldos de cuentas bancarias.",
    answer:
      "Así están sus cuentas hoy:\n\n| Cuenta | Saldo |\n|---|---|\n| Bancolombia Ahorros ****4821 | $48.250.300 |\n| Davivienda Corriente ****1190 | $12.904.100 |\n| Nequi ****7765 | $1.320.000 |\n| **Total** | **$62.474.400** |\n\nTiene **2 conciliaciones pendientes** (octubre en Bancolombia y Nequi).",
    tokens: 2840,
    followUp: "¿Quiere que le muestre los movimientos de esta semana?",
  },
  {
    q: "¿Cuántos morosos tenemos?",
    module: "cartera",
    reason: "Pregunta por clientes con facturas vencidas.",
    answer:
      "Hay **7 clientes en mora** por **$18.430.000**. Los tres mayores:\n\n| Cliente | Vencido | Días |\n|---|---|---|\n| Distribuidora Andes | $6.200.000 | 47 |\n| Ferretería El Tornillo | $4.150.000 | 33 |\n| Café La Montaña | $2.900.000 | 21 |",
    tokens: 3120,
    followUp: "¿Le preparo un correo de cobro para los tres mayores?",
  },
  {
    q: "¿Cómo va el pipeline?",
    module: "crm",
    reason: "Pregunta por el embudo de oportunidades.",
    answer:
      "El pipeline tiene **22 oportunidades abiertas** por **$186.400.000**:\n\n| Etapa | Cantidad | Valor |\n|---|---|---|\n| Prospección | 12 | $54.000.000 |\n| Negociación | 6 | $78.400.000 |\n| Cotizando | 4 | $54.000.000 |\n\nEste mes se ganaron **3** por $21.600.000.",
    tokens: 2975,
    followUp: "¿Quiere ver cuáles oportunidades llevan más de 15 días quietas?",
  },
  {
    q: "¿Quién es el copropietario del parqueadero 12?",
    module: "ph",
    reason: "Pregunta por una unidad de la copropiedad.",
    answer: "El **parqueadero P-12** está asociado al **Apto 302 de la Torre B** (Conjunto La Finca). La propietaria y responsable de pagos es **Laura Gómez**, y la unidad está **al día**.",
    tokens: 1980,
    followUp: "¿Quiere ver el estado de cuenta de la unidad?",
  },
  {
    q: "¿Cuánto debo pagar de nómina este mes?",
    module: "nomina",
    reason: "Pregunta por la nómina del mes.",
    denied: "No puedo consultar Nómina: ese módulo no está activo para su empresa.",
  },
];

function Chat({ sim, log }) {
  const { st, update, sequence, busy } = sim;
  const end = useRef(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [st.messages.length, st.thinking, st.suggestion]);

  const answer = (item, module, how) =>
    sequence(async (wait) => {
      update((x) => (x.thinking = "Pensando..."));
      await wait(1400);
      const r = resolveProvider(st, "chat");
      if (r.failed) {
        const p = PROVIDERS[r.provider].label;
        update((x) => {
          x.thinking = null;
          x.messages.push({
            from: "error",
            text: `La cuota de ${p} se agotó (no es un saturamiento momentáneo). Espere al reinicio del período (diario/mensual) o pida al administrador que aumente el tier en el panel del proveedor.`,
          });
        });
        log(`Chat: falló ${p} y no hay respaldo configurado`, "warn");
        return;
      }
      const ms = 1800 + Math.round(item.q.length * 37);
      update((x) => {
        x.thinking = null;
        x.messages.push({
          from: "ai",
          text: styleAnswer(item, st.identity),
          module,
          how,
          usage: `${PROVIDERS[r.provider].label} · ${item.tokens.toLocaleString("es-CO")} tokens · ${ms}ms${r.fallbackUsed ? " · (respaldo activo)" : ""}`,
          exportAsk: true,
        });
      });
      log(`Chat respondió con ${CHAT_MODULES[module][0]} usando ${PROVIDERS[r.provider].label} · ${r.model}${r.fallbackUsed ? " (respaldo)" : ""}`, r.fallbackUsed ? "warn" : "ok");
    });

  const ask = (item) =>
    sequence(async (wait) => {
      update((x) => {
        x.messages.push({ from: "user", text: item.q });
        x.thinking = "Analizando pregunta...";
        x.suggestion = null;
      });
      await wait(900);
      // 1) Acceso por plan y permisos: no se llama al modelo
      if (item.denied) {
        update((x) => {
          x.thinking = null;
          x.messages.push({ from: "ai", text: item.denied, module: item.module, how: "detectado automáticamente" });
        });
        log("Acceso: el módulo Nómina no está en el plan; se responde sin llamar al modelo", "warn");
        return;
      }
      // 2) Router con DeepSeek Flash
      const auto = st.pill === "auto";
      if (auto && !st.router) {
        update((x) => (x.thinking = null));
        log("Router desactivado: en modo Auto responde General");
        await answer({ ...item, answer: "Con el router apagado respondo como **General**: no tengo los datos de ese módulo. Elija el módulo arriba para una respuesta precisa." }, "general", "seleccionado por usted");
        return;
      }
      log(`Router (DeepSeek Flash): «${CHAT_MODULES[item.module][0]}» — ${item.reason}`);
      if (!auto && st.pill !== item.module) {
        update((x) => {
          x.thinking = null;
          x.suggestion = { item, from: x.pill };
        });
        setCountdown(15);
        return;
      }
      update((x) => (x.thinking = null));
      await answer(item, item.module, auto ? "detectado automáticamente" : "seleccionado por usted");
    });

  // Cuenta regresiva del aviso "¿Con qué módulo respondo?"
  useEffect(() => {
    if (countdown == null) return;
    if (countdown === 0) {
      const s = st.suggestion;
      setCountdown(null);
      update((x) => (x.suggestion = null));
      if (s) answer(s.item, s.from, "seleccionado por usted");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (module) => {
    const s = st.suggestion;
    setCountdown(null);
    update((x) => (x.suggestion = null));
    answer(s.item, module, module === s.item.module ? "detectado automáticamente" : "seleccionado por usted");
  };

  const exportAnswer = (i, format) => {
    update((x) => (x.messages[i].exported = format));
    log(`Exportar ${format}: «Reporte ${CHAT_MODULES[st.messages[i].module][0]}» con nombre y NIT de la empresa`, "ok");
  };

  return (
    <Shell
      hint="Haga una pregunta: el router detecta el módulo. Pruebe elegir un módulo a mano que no corresponda, o activar la falla del proveedor en Configuración."
      log={st.log}
      side={
        <>
          <Panel title="Cómo responde">
            <p className="text-xs text-muted">1. Revisa si el plan y los permisos dejan consultar ese módulo.</p>
            <p className="text-xs text-muted">2. El router (DeepSeek Flash) elige el módulo según la pregunta.</p>
            <p className="text-xs text-muted">3. El módulo carga sus datos y se los pasa al modelo con sus instrucciones.</p>
            <p className="text-xs text-muted">4. Si el principal falla, contesta el respaldo.</p>
          </Panel>
          <Panel title="Modelo del chat">
            {(() => {
              const r = resolveProvider(st, "chat");
              return <p className={`text-xs font-semibold ${r.failed ? "text-[#EF4444]" : r.fallbackUsed ? "text-warm" : ""}`}>{r.failed ? "Sin respaldo: fallará" : `${PROVIDERS[r.provider].label} · ${r.model}${r.fallbackUsed ? " (respaldo)" : ""}`}</p>;
            })()}
          </Panel>
        </>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[["auto", ["Auto", "✨"]], ...Object.entries(CHAT_MODULES).filter(([k]) => k !== "nomina")].map(([k, [label, emoji]]) => (
            <button
              key={k}
              disabled={busy}
              onClick={() => update((x) => (x.pill = k))}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition disabled:opacity-50 ${st.pill === k ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-ink"}`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {st.messages.length === 0 && (
            <p className="py-4 text-center text-sm">
              {st.identity.avatar} ¡Hola! Soy {st.identity.name || "su asistente"}. {st.identity.welcome}
            </p>
          )}
          {st.messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[92%]">
                {m.from === "ai" && (
                  <p className="mb-0.5 text-[11px] font-semibold">
                    {st.identity.avatar} {st.identity.name || "Asistente"}
                  </p>
                )}
                {m.module && (
                  <p className="mb-1 text-[11px] text-muted">
                    Responde con: <span className="rounded-full border border-line px-1.5">{CHAT_MODULES[m.module][1]} {CHAT_MODULES[m.module][0]}</span> · {m.how}
                  </p>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    m.from === "user" ? "rounded-br-sm bg-accent text-bg" : m.from === "error" ? "border border-[#EF4444]/60 bg-[#EF4444]/10" : "rounded-bl-sm border border-line bg-bg/60"
                  }`}
                >
                  {m.from === "error" && <p className="mb-1 font-semibold text-[#EF4444]">No se pudo procesar la consulta</p>}
                  <MarkdownTable text={m.text} />
                </div>
                {m.usage && <p className="mt-1 text-[10px] text-muted">{m.usage}</p>}
                {m.exportAsk && (
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    {m.exported ? (
                      <span className="text-accent">✓ Reporte {CHAT_MODULES[m.module][0]}.{m.exported === "PDF" ? "pdf" : "xlsx"} generado</span>
                    ) : (
                      <>
                        <span className="text-muted">¿Desea exportar esta respuesta?</span>
                        <button onClick={() => exportAnswer(i, "PDF")} className="rounded-full border border-line px-2 hover:border-accent hover:text-accent">
                          PDF
                        </button>
                        <button onClick={() => exportAnswer(i, "Excel")} className="rounded-full border border-line px-2 hover:border-accent hover:text-accent">
                          Excel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {st.thinking && <p className="text-xs text-muted">{st.thinking}</p>}
          {st.suggestion && (
            <div className="animate-pop rounded-xl border border-warm/50 bg-warm/10 p-3 text-xs">
              <p>
                💡 Esto parece una pregunta de {CHAT_MODULES[st.suggestion.item.module][1]} {CHAT_MODULES[st.suggestion.item.module][0]}. ¿Con qué módulo respondo?
              </p>
              <p className="mt-0.5 italic text-muted">{st.suggestion.item.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => choose(st.suggestion.item.module)} className="rounded-full bg-warm px-3 py-1 font-semibold text-bg">
                  Usar {CHAT_MODULES[st.suggestion.item.module][0]}
                </button>
                <button onClick={() => choose(st.suggestion.from)} className="rounded-full border border-line px-3 py-1">
                  Continuar en {CHAT_MODULES[st.suggestion.from][0]}
                </button>
              </div>
              {countdown != null && (
                <>
                  <p className="mt-2 text-muted">
                    Enviando en {CHAT_MODULES[st.suggestion.from][0]} en {countdown}s...
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-line/60">
                    <div className="h-full bg-warm transition-all duration-1000" style={{ width: `${(countdown / 15) * 100}%` }} />
                  </div>
                </>
              )}
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-[11px] text-muted">Escriba su pregunta — yo detecto el módulo automáticamente. En la demo, elija una:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUESTIONS.map((item) => (
              <button
                key={item.q}
                disabled={busy || !!st.suggestion}
                onClick={() => ask(item)}
                className="rounded-full border border-accent/40 px-3 py-1 text-xs text-accent transition hover:bg-accent/10 disabled:opacity-40"
              >
                {item.q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// Markdown mínimo: negritas, saltos de línea y tablas GFM
function MarkdownTable({ text }) {
  const bold = (s) => s.split(/(\*\*[^*]+\*\*)/).map((p, j) => (p.startsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p));
  const blocks = text.split("\n\n");
  return blocks.map((b, i) => {
    const lines = b.split("\n");
    if (lines[0].startsWith("|")) {
      const rows = lines.filter((l) => !/^\|[-|]+\|$/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
      return (
        <div key={i} className="my-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                {rows[0].map((c) => (
                  <th key={c} className="py-1 pr-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, ri) => (
                <tr key={ri} className="border-b border-line/50">
                  {r.map((c, ci) => (
                    <td key={ci} className="py-1 pr-3">
                      {bold(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <p key={i} className={i ? "mt-2" : ""}>
        {lines.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {bold(l)}
          </span>
        ))}
      </p>
    );
  });
}

/* ───────────────────────────── 3. Extractos ───────────────────────────── */

// PDFs de ejemplo. inSystem = el movimiento ya está registrado en el sistema
const FILES = [
  {
    id: "bancolombia",
    name: "Extracto Bancolombia octubre.pdf",
    banco: "BANCOLOMBIA",
    variante: "Cuenta de Ahorros",
    account: "Bancolombia Ahorros ****4821",
    period: "01/10/2026 – 31/10/2026",
    opening: 12500000,
    rowPattern: String.raw`^(\d{2}/\d{2})\s+(.+?)\s+(-?[\d.,]+)\s+([\d.,]+)$`,
    movs: [
      ["01/10", "PAGO PSE CLIENTE DISTRIB ANDES", 3450000, true],
      ["03/10", "TRANSF A NOMINA EMPLEADOS", -4200000, true],
      ["05/10", "CONSIGNACION SUCURSAL", 1180000, true],
      ["09/10", "PAGO PROVEEDOR PAPELERIA", -385400, true],
      ["12/10", "CUOTA MANEJO TARJETA", -18900, false],
      ["15/10", "ABONO INTERESES", 2310, true],
      ["20/10", "PAGO PSE CONJUNTO LA FINCA", 2900000, true],
      ["27/10", "GMF 4X1000", -18340, false],
    ],
  },
  {
    id: "cajasocial",
    name: "Extracto Banco Caja Social.pdf",
    banco: "BANCO CAJA SOCIAL",
    variante: "Ahorros",
    account: "Caja Social Ahorros ****3307",
    period: "01/10/2026 – 31/10/2026",
    opening: 4800000,
    rowPattern: String.raw`^(\d{2}-[A-Z]{3})\s+(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$`,
    noTemplate: true,
    movs: [
      ["02-OCT", "ABONO TRANSFERENCIA ACH", 2100000, true],
      ["06-OCT", "PAGO ARRIENDO LOCAL", -1200000, true],
      ["14-OCT", "COMPRA DATAFONO", -650000, true],
      ["21-OCT", "CONSIGNACION EFECTIVO", 380000, true],
      ["30-OCT", "COMISION MANEJO", -12500, false],
      ["31-OCT", "GRAVAMEN MOV FINANCIERO", -9880, false],
    ],
  },
  {
    id: "nequi",
    name: "Extracto Nequi (con contraseña).pdf",
    banco: "NEQUI",
    variante: "Depósito de Bajo Monto",
    account: "Nequi ****7765",
    period: "01/10/2026 – 31/10/2026",
    opening: 320000,
    rowPattern: String.raw`^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+\$\s?(-?[\d.,]+)\s+\$\s?([\d.,]+)$`,
    password: true,
    movs: [
      ["04/10/2026", "RECIBI DE CARLOS PEREZ", 150000, true],
      ["08/10/2026", "PAGO EN COMERCIO", -45900, true],
      ["16/10/2026", "ENVIO A DAVIPLATA", -80000, true],
      ["22/10/2026", "RECARGA DESDE BANCOLOMBIA", 60000, true],
      ["29/10/2026", "PAGO SERVICIOS", -12000, false],
    ],
  },
];
const GENERATE = "__generar__";
const tplLabel = (t) => `${t.banco} · ${t.variante}`;

function Extractos({ sim, log, goTemplates }) {
  const { st, update, sequence, busy } = sim;
  const [choice, setChoice] = useState("");
  const [file, setFile] = useState("bancolombia");
  const ext = st.ext;
  const f = FILES.find((x) => x.id === file);
  const active = st.templates.filter((t) => t.active);

  const run = () =>
    sequence(async (wait) => {
      const src = FILES.find((x) => x.id === file);
      const r = resolveProvider(st, "extractos");
      update((x) => (x.ext = { file: src, steps: [], progress: null, result: null, warnings: [], needPassword: false, conc: null }));
      const step = async (text, ms = 700) => {
        update((x) => x.ext.steps.push(text));
        await wait(ms);
      };
      await step("Subiendo PDF…", 500);
      await step("Iniciando…", 400);
      await step("Leyendo PDF…", 700);
      if (src.password) {
        update((x) => (x.ext.needPassword = true));
        log("PDF protegido con contraseña: se pide la clave al usuario", "warn");
        return;
      }
      await parse(src, r, wait, step);
    });

  const unlock = () =>
    sequence(async (wait) => {
      const src = ext.file;
      const r = resolveProvider(st, "extractos");
      update((x) => (x.ext.needPassword = false));
      const step = async (text, ms = 700) => {
        update((x) => x.ext.steps.push(text));
        await wait(ms);
      };
      await step("Desbloqueando con la contraseña…", 600);
      log("PDF desbloqueado con la cédula del titular");
      await parse(src, r, wait, step);
    });

  const parse = async (src, r, wait, step) => {
    const existing = st.templates.find((t) => t.active && t.banco === src.banco && t.variante === src.variante);
    let used = existing;
    if (choice === GENERATE) {
      await step("Buscando plantilla existente que aplique…", 900);
      if (existing) {
        update((x) => x.ext.warnings.push(`Ya existía la plantilla "${tplLabel(existing)}" y aplica a este PDF (cuadra). Se usó esa en lugar de generar una nueva — ahorra tiempo y tokens de IA.`));
        log(`Ya existía la plantilla ${tplLabel(existing)}: no se gasta IA`, "ok");
      }
    } else {
      const chosen = st.templates.find((t) => tplLabel(t) === choice);
      await step("Aplicando plantilla del banco…", 900);
      if (chosen && chosen !== existing) {
        update((x) => {
          x.templates.find((t) => tplLabel(t) === choice).fallos += 1;
        });
        log(`La firma del PDF no coincide con ${choice}: fallos_count + 1`, "warn");
        if (existing) {
          update((x) => x.ext.warnings.push(`Elegiste "${choice}" pero el PDF corresponde a "${tplLabel(existing)}". Se usó la plantilla correcta automáticamente.`));
          log(`Se probó con las demás plantillas activas: aplica ${tplLabel(existing)}`, "ok");
        } else {
          update((x) => x.ext.warnings.push("La plantilla anterior falló en este PDF; se regeneró automáticamente con IA. Verifica los movimientos y saldos antes de conciliar."));
          log("Ninguna plantilla activa aplica: se genera una nueva con IA", "warn");
        }
      }
    }

    if (!used) {
      // No hay plantilla: la IA la genera una sola vez (hasta 3 intentos) y queda global
      if (r.failed) {
        update((x) => x.ext.warnings.push(`No se pudo generar la plantilla: la cuota de ${PROVIDERS[r.provider].label} se agotó y no hay respaldo configurado.`));
        log("Extractos: falló el proveedor y no hay respaldo", "warn");
        return;
      }
      const using = `${PROVIDERS[r.provider].label} · ${r.model}${r.fallbackUsed ? " (respaldo)" : ""}`;
      update((x) => (x.ext.progress = { n: 1, using }));
      await step("Generando plantilla del banco con IA…", 1300);
      update((x) => (x.ext.progress.n = 2));
      await step("Reintentando plantilla (intento 2/3)… el intento anterior no cuadró los saldos", 1300);
      log("Intento 1: el parser no cuadró los saldos; se le envía la corrección al modelo", "warn");
      update((x) => (x.ext.progress.n = 3));
      await step("Plantilla generada — guardando…", 900);
      update((x) => {
        x.templates.push({ banco: src.banco, variante: src.variante, version: 1, usos: 0, fallos: 0, active: true, generated: true });
        x.ext.progress = null;
      });
      log(`Plantilla nueva ${src.banco} · ${src.variante} v1 «Auto-generada por IA v1» con ${using}. Desde ahora la usan todas las empresas`, "ok");
      used = { banco: src.banco, variante: src.variante };
    }

    await step("Leyendo movimientos con la plantilla (sin IA)…", 900);
    update((x) => (x.templates.find((t) => t.banco === used.banco && t.variante === used.variante && t.active).usos += 1));
    const totalIn = src.movs.filter((m) => m[2] > 0).reduce((a, m) => a + m[2], 0);
    const totalOut = src.movs.filter((m) => m[2] < 0).reduce((a, m) => a - m[2], 0);
    const closing = src.opening + totalIn - totalOut;
    const system = src.opening + src.movs.filter((m) => m[3]).reduce((a, m) => a + m[2], 0);
    await step("Validando saldos (tolerancia ±$100)…", 700);
    await step("Completado", 300);
    update((x) => (x.ext.result = { template: used, totalIn, totalOut, closing, system, items: src.movs.map((m) => ({ m, status: "PENDING" })) }));
    log(`${src.banco} — ${src.movs.length} movimientos · el extracto cuadra`, "ok");
  };

  const create = () => {
    update((x) => (x.ext.conc = { number: "CB-0012", registered: false }));
    log("Conciliación CB-0012 creada");
  };
  const matchByDateAndValue = () => {
    update((x) => x.ext.result.items.forEach((it) => (it.status = it.m[3] ? "MATCHED" : "PENDING")));
    log(`Cruce «Fecha y valor»: ${ext.result.items.filter((it) => it.m[3]).length} conciliados, ${ext.result.items.filter((it) => !it.m[3]).length} pendientes`, "ok");
  };
  const registerPending = () => {
    update((x) => {
      x.ext.result.items.forEach((it) => it.status === "PENDING" && (it.status = "MATCHED"));
      x.ext.result.system = x.ext.result.closing;
      x.ext.conc.registered = true;
    });
    log("Registrar extractos en sistema: los cargos bancarios se registran y la diferencia queda en $0", "ok");
  };

  const statusColor = { PENDING: "#F59E0B", MATCHED: "#10B981" };

  return (
    <Shell
      hint="Elige el tipo de extracto y un PDF. Si el banco no tiene plantilla, la IA la genera una sola vez; después se lee sin IA."
      log={st.log}
      side={
        <>
          <Panel title="Modelo de extractos">
            {(() => {
              const r = resolveProvider(st, "extractos");
              return <p className={`text-xs font-semibold ${r.failed ? "text-[#EF4444]" : r.fallbackUsed ? "text-warm" : ""}`}>{r.failed ? "Sin respaldo: fallará al generar" : `${PROVIDERS[r.provider].label} · ${r.model}${r.fallbackUsed ? " (respaldo)" : ""}`}</p>;
            })()}
            <p className="text-[11px] text-muted">Solo se usa para generar plantillas nuevas. Leer un extracto con plantilla no gasta IA.</p>
          </Panel>
          {ext?.result && (
            <Panel title="Plantilla aplicada">
              <p className="text-xs font-semibold">{tplLabel(ext.result.template)}</p>
              <p className="text-[10px] text-muted">rowPattern</p>
              <code className="block break-all rounded bg-bg/80 p-1.5 font-mono text-[10px] text-accent">{ext.file.rowPattern}</code>
              <button onClick={goTemplates} className="text-[11px] text-accent hover:underline">
                Ver en Plantillas · admin →
              </button>
            </Panel>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Tipo de extracto (plantilla)" value={choice} onChange={setChoice}>
            <option value="">— elige una opción —</option>
            <option value={GENERATE}>✨ Mi banco/variante no aparece — generar plantilla nueva con IA</option>
            {active.map((t) => (
              <option key={tplLabel(t)} value={tplLabel(t)}>
                {tplLabel(t)} · {t.usos} usos
              </option>
            ))}
          </Select>
          <Select label="Archivo de ejemplo" value={file} onChange={setFile}>
            {FILES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-[11px] text-muted">Las plantillas son globales — si no está la de tu banco, genera una nueva y todas las empresas la usarán después.</p>
        <button
          onClick={() => (choice ? run() : log("Elige primero el tipo de extracto (dropdown de arriba).", "warn"))}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
        >
          <Icon name="download" className="h-4 w-4 rotate-180" />
          Subir «{f.name}»
        </button>

        {ext && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line p-3">
              <ol className="space-y-1 text-xs">
                {ext.steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icon name={i === ext.steps.length - 1 && busy ? "refresh" : "check"} className={`h-3.5 w-3.5 ${i === ext.steps.length - 1 && busy ? "animate-spin text-warm" : "text-accent"}`} />
                    {s}
                  </li>
                ))}
              </ol>
              {ext.progress && (
                <div className="mt-2">
                  <div className="flex justify-between text-[11px]">
                    <span>Paso {ext.progress.n} de 3</span>
                    <Badge color="#6366F1">Usando {ext.progress.using}</Badge>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/60">
                    <div className="h-full bg-accent transition-all duration-700" style={{ width: `${(ext.progress.n / 3) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            {ext.needPassword && (
              <div className="animate-pop rounded-xl border border-warm/50 bg-warm/10 p-3 text-xs">
                <p className="font-semibold">PDF protegido con contraseña</p>
                <p className="text-muted">Algunos bancos usan tu cédula o NIT como clave.</p>
                <div className="mt-2 flex gap-2">
                  <input readOnly value="1020333444" className="w-40 rounded-lg border border-line bg-bg px-2 py-1 font-mono" />
                  <button onClick={unlock} disabled={busy} className="rounded-full bg-warm px-3 py-1 font-semibold text-bg disabled:opacity-40">
                    Desbloquear
                  </button>
                </div>
              </div>
            )}

            {ext.warnings.map((w) => (
              <div key={w} className="animate-pop rounded-xl border border-warm/50 bg-warm/10 p-3 text-xs">
                <p className="font-semibold text-warm">Advertencia del procesamiento</p>
                <p>{w}</p>
              </div>
            ))}

            {ext.result && (
              <div className="animate-pop space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    ["Período detectado", ext.file.period],
                    ["Saldo inicial extracto", cop(ext.file.opening)],
                    ["Saldo final extracto", cop(ext.result.closing)],
                    ["Saldo final sistema", cop(ext.result.system)],
                    ["Diferencia", cop(ext.result.closing - ext.result.system)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-line p-2">
                      <p className="text-[10px] text-muted">{k}</p>
                      <p className={`text-xs font-semibold ${k === "Diferencia" && ext.result.closing !== ext.result.system ? "text-warm" : ""}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-xs">
                    <thead className="text-left text-[11px] text-muted">
                      <tr className="border-b border-line">
                        <th className="py-1.5">Fecha</th>
                        <th>Descripción</th>
                        <th className="text-right">Valor</th>
                        <th className="text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ext.result.items.map((it, i) => (
                        <tr key={i} className="border-b border-line/50">
                          <td className="py-1.5">{it.m[0]}</td>
                          <td>{it.m[1]}</td>
                          <td className={`text-right font-medium ${it.m[2] > 0 ? "text-accent" : "text-[#EF4444]"}`}>{(it.m[2] > 0 ? "+" : "−") + cop(Math.abs(it.m[2]))}</td>
                          <td className="text-right">{ext.conc && <Badge color={statusColor[it.status]}>{it.status === "MATCHED" ? "Conciliado" : "Pendiente"}</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!ext.conc && (
                    <button onClick={create} className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg">
                      Crear conciliación
                    </button>
                  )}
                  {ext.conc && ext.result.items.every((it) => it.status === "PENDING") && (
                    <button onClick={matchByDateAndValue} className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg">
                      Cruzar por «Fecha y valor»
                    </button>
                  )}
                  {ext.conc && !ext.conc.registered && ext.result.items.some((it) => it.status === "MATCHED") && (
                    <button onClick={registerPending} className="rounded-full bg-warm px-4 py-2 text-xs font-semibold text-bg">
                      Registrar extractos en sistema
                    </button>
                  )}
                  {ext.conc?.registered && <span className="self-center text-xs text-accent">✓ Conciliación {ext.conc.number} cuadrada: diferencia $0</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ───────────────────────────── 4. Plantillas (admin) ───────────────────────────── */

function Templates({ sim, log }) {
  const { st, update } = sim;
  const [json, setJson] = useState(null);
  const sample = (t) => {
    const fileMatch = FILES.find((x) => x.banco === t.banco && x.variante === t.variante);
    return JSON.stringify(
      {
        detection: { signature: [t.banco, t.variante.toUpperCase()] },
        movimientos: {
          rowPattern: fileMatch?.rowPattern ?? String.raw`^(\d{2}/\d{2})\s+(.+?)\s+(-?[\d.,]+)\s+([\d.,]+)$`,
          fields: ["fecha", "descripcion", "monto", "saldo"],
          tipoInference: { method: t.banco === "BBVA" || t.banco === "AV-VILLAS" ? "delta_saldo" : "sign" },
        },
        numberFormat: "colombiano",
      },
      null,
      2
    );
  };

  return (
    <Shell
      hint="Plantillas globales: una vez creada, la usan todas las empresas. Las que generes en «Extractos bancarios» aparecen aquí."
      log={st.log}
      side={
        <Panel title="template_json">
          {json ? (
            <>
              <p className="text-xs font-semibold">{tplLabel(json)}</p>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded bg-bg/80 p-2 font-mono text-[10px] text-accent">{sample(json)}</pre>
            </>
          ) : (
            <p className="text-xs text-muted">Usa «Ver JSON» en una plantilla para ver sus patrones.</p>
          )}
        </Panel>
      }
    >
      <p className="font-display text-lg font-bold">Plantillas de extractos bancarios</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] text-xs">
          <thead className="text-left text-[11px] text-muted">
            <tr className="border-b border-line">
              <th className="py-2">Banco</th>
              <th>Variante</th>
              <th>Versión</th>
              <th>Descripción</th>
              <th>Usos / Fallos</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {st.templates.map((t, i) => (
              <tr key={tplLabel(t) + t.version} className={`border-b border-line/50 ${t.generated ? "bg-accent/5" : ""}`}>
                <td className="py-2 font-semibold">{t.banco}</td>
                <td>{t.variante}</td>
                <td>v{t.version}</td>
                <td className="text-muted">{t.generated ? "Auto-generada por IA v1" : "Plantilla del banco"}</td>
                <td>
                  {t.usos} / <span className={t.fallos > 5 ? "text-[#EF4444]" : ""}>{t.fallos}</span>
                </td>
                <td>
                  <Badge color={t.active ? "#10B981" : "#94A3B8"}>{t.active ? "Activa" : "Inactiva"}</Badge>
                </td>
                <td className="space-x-2 text-right">
                  <button onClick={() => setJson(t)} className="text-accent hover:underline">
                    Ver JSON
                  </button>
                  <button
                    onClick={() => {
                      update((x) => (x.templates[i].active = !x.templates[i].active));
                      log(`${tplLabel(t)} ${t.active ? "desactivada" : "reactivada"}`);
                    }}
                    className="text-muted hover:text-ink"
                  >
                    {t.active ? "Desactivar" : "Reactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

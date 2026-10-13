"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";

// Réplica del flujo de biblioteca "Ventas por WhatsApp: campaña, equipo comercial e IA" de Contagracia.
// Los nodos, ramas y etiquetas siguen el flujo real; las respuestas de la IA están guionizadas.

const ADVISORS = ["Laura Gómez", "Andrés Ruiz"];
const CAMPAIGN = "Instagram · Lanzamiento octubre";
const PHONE = "+57 300 123 4567";
const SLOTS = ["Mañana 9:00 a. m.", "Mañana 3:00 p. m.", "Jueves 10:00 a. m."];
const HANDOFF = "un asesor te escribirá en breve";
const MEET = "meet.google.com/xkt-fqbv-nrp";

const NODES = {
  trigger: { kind: "Disparador", title: "WhatsApp: mensaje recibido", icon: "bolt" },
  sinAsesor: { kind: "Si / entonces", title: "¿El lead no tiene asesor?", icon: "branch" },
  dispersor: { kind: "Dispersor", title: "Repartir 50 / 50", icon: "users" },
  asignar: { kind: "Acción", title: "Asignar lead a un usuario", icon: "user" },
  agente: { kind: "Agente IA", title: "Sofía", icon: "sparkles" },
  enviar: { kind: "Acción", title: "WhatsApp: enviar mensaje", icon: "whatsapp" },
  traspaso: { kind: "Si / entonces", title: "¿Pidió un asesor?", icon: "branch" },
  pausar: { kind: "Acción", title: "WhatsApp: apagar la IA", icon: "pause" },
};

const TOOLS = {
  disponibilidad: "Agenda: ver disponibilidad",
  agendar: "Agenda: agendar reunión",
};

const QUICK = ["Hola, vi el anuncio en Instagram", "¿Cuánto cuesta?", "Quiero agendar una reunión", "Prefiero hablar con un asesor"];

const initialState = () => ({
  contact: null,
  lead: null,
  aiActive: true,
  meeting: null,
  awaitingOffer: false,
  awaitingSlot: false,
  messages: [],
  typing: false,
  nodes: Object.fromEntries(Object.keys(NODES).map((k) => [k, "idle"])),
  branches: {},
  tools: {},
  log: [],
  notifications: [],
  turn: 0,
});

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// Decide qué contesta Sofía (guion) y qué herramientas usa
function decide(text, s) {
  const t = norm(text);

  if (s.awaitingSlot) {
    const i = /jueves|10/.test(t) ? 2 : /3|tarde|segundo/.test(t) ? 1 : /9|manana|primero|temprano/.test(t) ? 0 : -1;
    if (i >= 0) {
      return {
        tools: ["agendar"],
        meeting: SLOTS[i],
        reply: `¡Listo! Quedó tu reunión para ${SLOTS[i].toLowerCase()}, 30 minutos por Meet. Este es el enlace: ${MEET}`,
      };
    }
  }
  if (/asesor|humano|persona|alguien|llam/.test(t)) {
    return { tools: [], reply: `¡Claro que sí! Ya le avisé al equipo: ${HANDOFF}.` };
  }
  if (/precio|cuanto|cuesta|costo|vale|tarifa|plan/.test(t)) {
    return {
      tools: [],
      awaitingOffer: true,
      reply: "Los precios dependen de lo que necesites, por eso los revisa un asesor contigo. ¿Te agendo una reunión de 30 minutos por Meet para verlo?",
    };
  }
  if (/agend|reuni|cita|meet|demo/.test(t) || (s.awaitingOffer && /^(si|sii|dale|ok|claro|bueno|listo|de una|perfecto)/.test(t))) {
    return {
      tools: ["disponibilidad"],
      awaitingSlot: true,
      reply: `Tengo estos espacios: ${SLOTS[0].toLowerCase()}, ${SLOTS[1].toLowerCase()} o el ${SLOTS[2].toLowerCase()} ¿Cuál te sirve?`,
    };
  }
  if (s.turn === 0 || /hola|buenas|buen dia|info|anuncio/.test(t)) {
    return {
      tools: [],
      awaitingOffer: true,
      reply: "¡Hola! Soy Sofía, del equipo comercial. Qué bueno que nos escribes por la campaña. ¿Quieres que te agende 30 minutos con un asesor para contarte cómo funciona?",
    };
  }
  return {
    tools: [],
    awaitingOffer: true,
    reply: "Te entiendo. Para darte una respuesta precisa, ¿te agendo 30 minutos con un asesor? Si prefieres, le pido que te escriba directamente.",
  };
}

const CANCEL = Symbol("cancel");

export default function CrmSimulator() {
  const [, setTick] = useState(0);
  const s = useRef(initialState());
  const run = useRef(0);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState("chat");
  const chatEnd = useRef(null);
  const logEnd = useRef(null);

  const update = (fn) => {
    fn(s.current);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [s.current.messages.length, s.current.typing]);
  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [s.current.log.length]);
  // Al desmontar se cancela cualquier ejecución en curso
  useEffect(() => () => void run.current++, []);

  const reset = () => {
    run.current++;
    s.current = initialState();
    setBusy(false);
    setInput("");
    setTick((t) => t + 1);
  };

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    const id = ++run.current;
    const wait = (ms) =>
      new Promise((resolve, reject) => setTimeout(() => (run.current === id ? resolve() : reject(CANCEL)), ms));
    const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));
    const notify = (msg) => update((x) => x.notifications.unshift({ msg, id: Date.now() + Math.random() }));
    const step = async (node, ms = 650) => {
      update((x) => (x.nodes[node] = "active"));
      await wait(ms);
      update((x) => (x.nodes[node] = "done"));
    };
    const skip = (...nodes) => update((x) => nodes.forEach((n) => (x.nodes[n] = "skipped")));

    setBusy(true);
    setInput("");
    update((x) => {
      x.messages.push({ from: "cliente", text });
      x.nodes = initialState().nodes;
      x.branches = {};
      x.tools = {};
    });

    try {
      await wait(350);
      // Lo que hace el CRM antes del flujo (crm-service)
      if (!s.current.contact) {
        update((x) => {
          x.contact = { name: "Cliente demo", phone: PHONE };
          x.lead = { stage: "Nuevo", source: "WhatsApp", campaign: CAMPAIGN, assignedTo: null };
        });
        log(`Contacto nuevo creado (${PHONE})`);
        log(`Lead creado · origen WhatsApp · etapa Nuevo · campaña ${CAMPAIGN}`);
        notify(`Contacto nuevo (${PHONE})`);
      } else {
        notify("Mensaje de Cliente demo");
      }

      await step("trigger");
      log("Se dispara el flujo: WhatsApp: mensaje recibido");

      if (!s.current.aiActive) {
        skip("sinAsesor", "dispersor", "asignar", "agente", "enviar", "traspaso", "pausar");
        log("La IA está apagada en esta conversación: el flujo no responde y el asesor contesta desde el CRM.", "warn");
        notify(`${s.current.lead.assignedTo}: el cliente escribió de nuevo`);
        return;
      }

      await step("sinAsesor");
      if (!s.current.lead.assignedTo) {
        update((x) => (x.branches.sinAsesor = "si"));
        await step("dispersor");
        const advisor = ADVISORS[Math.floor(Math.random() * ADVISORS.length)];
        log(`El dispersor eligió a ${advisor} (50 / 50 entre el equipo)`);
        await step("asignar");
        update((x) => (x.lead.assignedTo = advisor));
        log(`Lead asignado a ${advisor}`);
        notify(`${advisor}: te asignaron un lead nuevo (en el sistema y por correo)`);
      } else {
        update((x) => (x.branches.sinAsesor = "no"));
        skip("dispersor", "asignar");
        log(`El lead ya tiene asesor (${s.current.lead.assignedTo}): se salta el reparto`);
      }

      const d = decide(text, s.current);
      update((x) => {
        x.nodes.agente = "active";
        x.typing = true;
      });
      for (const tool of d.tools) {
        await wait(450);
        update((x) => (x.tools[tool] = "active"));
        log(`Sofía usa la herramienta «${TOOLS[tool]}»`);
        await wait(650);
        update((x) => (x.tools[tool] = "done"));
      }
      await wait(800);
      update((x) => (x.nodes.agente = "done"));
      log("Sofía redactó la respuesta");

      await step("enviar", 450);
      update((x) => {
        x.typing = false;
        x.messages.push({ from: "sofia", text: d.reply });
        x.awaitingOffer = !!d.awaitingOffer;
        x.awaitingSlot = !!d.awaitingSlot;
        x.turn += 1;
        if (d.meeting) x.meeting = d.meeting;
      });
      if (d.meeting) {
        log(`Reunión agendada: ${d.meeting} (30 min, Meet)`, "ok");
        notify(`${s.current.lead.assignedTo}: reunión agendada para ${d.meeting.toLowerCase()}`);
      }

      await step("traspaso");
      if (d.reply.includes(HANDOFF)) {
        update((x) => (x.branches.traspaso = "si"));
        await step("pausar");
        update((x) => (x.aiActive = false));
        log("IA apagada en la conversación: desde ahora responde el asesor", "warn");
        notify(`${s.current.lead.assignedTo}: el cliente pidió hablar con un asesor`);
      } else {
        update((x) => (x.branches.traspaso = "no"));
        skip("pausar");
      }
    } catch (e) {
      if (e !== CANCEL) throw e;
    } finally {
      if (run.current === id) {
        update((x) => (x.typing = false));
        setBusy(false);
      }
    }
  };

  const st = s.current;
  const suggestions = st.awaitingSlot ? SLOTS : st.aiActive ? QUICK : [];

  const pane = (name) => (tab === name ? "flex" : "hidden lg:flex");

  return (
    <div className="flex h-full flex-col">
      {/* Pestañas solo en pantallas pequeñas */}
      <div className="flex shrink-0 gap-1 border-b border-line p-2 lg:hidden">
        {[
          ["chat", "Chat"],
          ["flujo", "Flujo"],
          ["crm", "CRM"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`relative flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === k ? "bg-accent/15 text-accent" : "text-muted"
            }`}
          >
            {label}
            {/* Avisa que el flujo está corriendo mientras se mira otra pestaña */}
            {k === "flujo" && busy && tab !== "flujo" && (
              <span className="absolute right-3 top-1.5 h-2 w-2 animate-ping rounded-full bg-warm" />
            )}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_1fr_270px]">
        {/* Chat de WhatsApp: el usuario es el cliente */}
        <section className={`${pane("chat")} min-h-0 flex-col border-line lg:border-r`}>
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <Icon name="whatsapp" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Equipo comercial</p>
              <p className={`text-xs ${st.aiActive ? "text-accent" : "text-warm"}`}>{st.aiActive ? "Agente IA activo" : "IA apagada · te atiende un asesor"}</p>
            </div>
            <button onClick={reset} title="Reiniciar" aria-label="Reiniciar simulación" className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent">
              <Icon name="refresh" className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-bg/60 p-4">
            {st.messages.length === 0 && (
              <p className="mx-auto mt-6 max-w-[15rem] text-center text-xs text-muted">
                Eres un cliente que vio un anuncio. Escríbele al equipo o usa una de las sugerencias.
              </p>
            )}
            {st.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "cliente" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                    m.from === "cliente" ? "rounded-br-sm bg-accent text-bg" : "rounded-bl-sm border border-line bg-surface"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            {st.typing && (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-2 text-xs text-muted">Sofía está escribiendo…</p>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {suggestions.length > 0 && (
            <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-line px-3 py-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  disabled={busy}
                  onClick={() => send(q)}
                  className="shrink-0 rounded-full border border-accent/40 px-3 py-1 text-xs text-accent transition hover:bg-accent/10 disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje…"
              maxLength={200}
              className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2 text-sm outline-none transition focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Enviar"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-bg transition disabled:opacity-40"
            >
              <Icon name="send" className="h-4 w-4" />
            </button>
          </form>
        </section>

        {/* Flujo de automatización */}
        <section className={`${pane("flujo")} min-h-0 flex-col`}>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
              Flujo · Ventas por WhatsApp: campaña, equipo comercial e IA
            </p>
            <div className="mx-auto flex max-w-md flex-col items-stretch">
              <Node id="trigger" state={st.nodes.trigger} />
              <Line on={st.nodes.sinAsesor !== "idle"} />
              <Node id="sinAsesor" state={st.nodes.sinAsesor} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <BranchLabel label="Sí" active={st.branches.sinAsesor === "si"} />
                  <Node id="dispersor" state={st.nodes.dispersor} compact />
                  <Line on={st.nodes.asignar !== "idle" && st.nodes.asignar !== "skipped"} short />
                  <Node id="asignar" state={st.nodes.asignar} compact />
                </div>
                <div className="flex flex-col">
                  <BranchLabel label="No" active={st.branches.sinAsesor === "no"} />
                  <div
                    className={`grid flex-1 place-items-center rounded-xl border border-dashed px-2 text-center text-xs transition ${
                      st.branches.sinAsesor === "no" ? "border-accent/60 text-accent" : "border-line text-muted"
                    }`}
                  >
                    Sigue directo al agente
                  </div>
                </div>
              </div>
              <Line on={st.nodes.agente !== "idle"} />
              <Node id="agente" state={st.nodes.agente}>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(TOOLS).map(([k, label]) => (
                    <span
                      key={k}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                        st.tools[k] === "active"
                          ? "animate-pulse border-warm bg-warm/15 text-warm"
                          : st.tools[k] === "done"
                          ? "border-warm/60 text-warm"
                          : "border-line text-muted"
                      }`}
                    >
                      <Icon name="calendar" className="h-3 w-3" />
                      {label}
                    </span>
                  ))}
                </div>
              </Node>
              <Line on={st.nodes.enviar !== "idle"} />
              <Node id="enviar" state={st.nodes.enviar} />
              <Line on={st.nodes.traspaso !== "idle" && st.nodes.traspaso !== "skipped"} />
              <Node id="traspaso" state={st.nodes.traspaso} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <BranchLabel label="Sí" active={st.branches.traspaso === "si"} />
                  <Node id="pausar" state={st.nodes.pausar} compact />
                </div>
                <div className="flex flex-col">
                  <BranchLabel label="No" active={st.branches.traspaso === "no"} />
                  <div
                    className={`grid flex-1 place-items-center rounded-xl border border-dashed px-2 text-center text-xs transition ${
                      st.branches.traspaso === "no" ? "border-accent/60 text-accent" : "border-line text-muted"
                    }`}
                  >
                    Sofía sigue atendiendo
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-36 shrink-0 overflow-y-auto border-t border-line bg-bg/60 px-5 py-3 font-mono text-xs">
            <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-widest text-muted">Registro de ejecución</p>
            {st.log.length === 0 && <p className="text-muted">Esperando el primer mensaje…</p>}
            {st.log.map((l) => (
              <p key={l.id} className={l.tone === "warn" ? "text-warm" : l.tone === "ok" ? "text-accent" : "text-muted"}>
                › {l.msg}
              </p>
            ))}
            <div ref={logEnd} />
          </div>
        </section>

        {/* Lo que queda guardado en el CRM */}
        <section className={`${pane("crm")} min-h-0 flex-col gap-3 overflow-y-auto border-line p-4 lg:border-l`}>
          <Panel title="Contacto">
            {st.contact ? (
              <>
                <Row k="Nombre" v={st.contact.name} />
                <Row k="Teléfono" v={st.contact.phone} />
              </>
            ) : (
              <p className="text-xs text-muted">Aún no existe. Se crea con el primer mensaje.</p>
            )}
          </Panel>

          <Panel title="Lead">
            {st.lead ? (
              <>
                <Row k="Origen" v={st.lead.source} />
                <Row k="Etapa" v={<span className="rounded-full bg-[#3B82F6]/15 px-2 py-0.5 text-[#60A5FA]">{st.lead.stage}</span>} />
                <Row k="Campaña" v={st.lead.campaign} />
                <Row k="Asesor" v={st.lead.assignedTo ?? <span className="text-muted">Sin asignar</span>} />
              </>
            ) : (
              <p className="text-xs text-muted">Sin lead todavía.</p>
            )}
          </Panel>

          <Panel title="Conversación">
            <Row k="Estado" v={st.aiActive ? <span className="text-accent">Agente IA activo</span> : <span className="text-warm">IA apagada</span>} />
            <Row k="Reunión" v={st.meeting ?? <span className="text-muted">—</span>} />
          </Panel>

          <Panel title="Notificaciones del equipo" icon="bell">
            {st.notifications.length === 0 ? (
              <p className="text-xs text-muted">Nada por ahora.</p>
            ) : (
              <ul className="space-y-1.5">
                {st.notifications.slice(0, 5).map((n) => (
                  <li key={n.id} className="rounded-lg bg-bg/70 px-2 py-1.5 text-xs">
                    {n.msg}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Node({ id, state, compact, children }) {
  const n = NODES[id];
  const ref = useRef(null);
  // Mantiene a la vista el paso que se está ejecutando
  useEffect(() => {
    if (state === "active") ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state]);
  const styles = {
    idle: "border-line bg-bg/60",
    active: "border-accent bg-accent/10 ring-4 ring-accent/20",
    done: "border-accent/60 bg-accent/5",
    skipped: "border-dashed border-line opacity-40",
  };
  return (
    <div ref={ref} className={`scroll-my-4 rounded-xl border transition-all duration-300 ${compact ? "p-2.5" : "p-3"} ${styles[state]}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`grid shrink-0 place-items-center rounded-lg transition ${compact ? "h-7 w-7" : "h-8 w-8"} ${
            state === "active" || state === "done" ? "bg-accent text-bg" : "bg-line/60 text-muted"
          }`}
        >
          <Icon name={state === "done" ? "check" : n.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{n.kind}</p>
          <p className={`truncate font-semibold ${compact ? "text-xs" : "text-sm"}`}>{n.title}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Line({ on, short }) {
  return <div className={`mx-auto w-0.5 transition-colors duration-300 ${short ? "h-3" : "h-5"} ${on ? "bg-accent" : "bg-line"}`} />;
}

function BranchLabel({ label, active }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`h-3 w-0.5 ${active ? "bg-accent" : "bg-line"}`} />
      <span className={`mb-1 rounded-full px-2 text-[10px] font-semibold ${active ? "bg-accent/15 text-accent" : "text-muted"}`}>{label}</span>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
        {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="truncate text-right font-medium">{v}</span>
    </div>
  );
}

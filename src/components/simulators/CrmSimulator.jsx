"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";

// Demo propia de un CRM con atención de leads por WhatsApp y asistente IA, con datos ficticios.
// Flujo, etapas y textos son ilustrativos (no replican ningún producto); el chat es guiado (solo opciones).

const ADVISORS = ["Valentina Ríos", "Camilo Ortiz"];
const CAMPAIGN = "Anuncio · Promo de temporada";
const PHONE = "+57 300 123 4567";
const SLOTS = ["Mañana 9:00 a. m.", "Mañana 3:00 p. m.", "Jueves 10:00 a. m."];
const HANDOFF = "te paso con una persona del equipo";
const MEET = "meet.example.com/demo-ana";
const QUOTE = { id: "PROP-0027", name: "Plan Empresa · 12 meses", value: "$4.800.000" };

// Ritmo de la animación (ms)
const T = { node: 1100, tool: 1000, think: 1200, beat: 900 };

const NODES = {
  trigger: { kind: "Disparador", title: "WhatsApp: mensaje recibido", icon: "bolt" },
  sinAsesor: { kind: "Condición", title: "¿Ya tiene asesor asignado?", icon: "branch" },
  dispersor: { kind: "Reparto", title: "Turno rotativo", icon: "users" },
  asignar: { kind: "Acción", title: "Asignar asesor", icon: "user" },
  agente: { kind: "Asistente IA", title: "Ana", icon: "sparkles" },
  enviar: { kind: "Acción", title: "Responder por WhatsApp", icon: "whatsapp" },
  traspaso: { kind: "Condición", title: "¿Quiere hablar con una persona?", icon: "branch" },
  pausar: { kind: "Acción", title: "Pasar a un asesor", icon: "pause" },
};

const TOOLS = {
  disponibilidad: "Consultar agenda",
  agendar: "Reservar cita",
};

// Etapas del embudo de la demo
const STAGES = [
  { name: "Nuevo", color: "#3B82F6" },
  { name: "Calificado", color: "#8B5CF6" },
  { name: "Propuesta", color: "#F59E0B" },
  { name: "Ganado", color: "#10B981" },
  { name: "Perdido", color: "#6B7280" },
];
const stageColor = (name) => STAGES.find((s) => s.name === name)?.color ?? "#3B82F6";

// Lo que el cliente puede decir
const OPTIONS = {
  saludo: "Hola, vi el anuncio en Instagram",
  precio: "¿Cuánto cuesta?",
  agendar: "Sí, agendemos una reunión",
  asesor: "Prefiero hablar con un asesor",
  slot0: SLOTS[0],
  slot1: SLOTS[1],
  slot2: SLOTS[2],
  aceptar: "¡Acepto la cotización!",
  rechazar: "No por ahora, gracias",
};

// Respuesta guionizada de Ana para cada opción
function sofia(option, s) {
  if (option.startsWith("slot")) {
    const slot = SLOTS[Number(option.slice(4))];
    return {
      tools: ["agendar"],
      meeting: slot,
      reply: `¡Listo! Quedó tu reunión para ${slot.toLowerCase()}, 30 minutos por Meet. Este es el enlace: ${MEET}`,
    };
  }
  switch (option) {
    case "asesor":
      return { tools: [], reply: `¡Claro que sí! Ya le avisé al equipo: ${HANDOFF}.` };
    case "precio":
      return {
        tools: [],
        awaitingOffer: true,
        reply: "Los precios dependen de lo que necesites, por eso los revisa un asesor contigo. ¿Te agendo una reunión de 30 minutos por Meet para verlo?",
      };
    case "agendar":
      return {
        tools: ["disponibilidad"],
        awaitingSlot: true,
        reply: `Tengo estos espacios: ${SLOTS[0].toLowerCase()}, ${SLOTS[1].toLowerCase()} o el ${SLOTS[2].toLowerCase()} ¿Cuál te sirve?`,
      };
    default:
      return {
        tools: [],
        awaitingOffer: true,
        reply: "¡Hola! Soy Ana, la asistente virtual del equipo. Qué bueno que nos escribes por la campaña. ¿Quieres que te agende 30 minutos con un asesor para contarte cómo funciona?",
      };
  }
}

const initialState = () => ({
  phase: "chat", // chat → cotizacion → fin
  contact: null,
  lead: null,
  opportunity: null,
  aiActive: true,
  meeting: null,
  awaitingOffer: false,
  awaitingSlot: false,
  askedPrice: false,
  messages: [],
  typing: null,
  nodes: Object.fromEntries(Object.keys(NODES).map((k) => [k, "idle"])),
  branches: {},
  tools: {},
  events: [],
  log: [],
  notifications: [],
  turn: 0,
});

const CANCEL = Symbol("cancel");

export default function CrmSimulator() {
  const [, setTick] = useState(0);
  const s = useRef(initialState());
  const run = useRef(0);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("chat"); // pestañas en móvil
  const [view, setView] = useState("flujo"); // vista central: flujo | embudo
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
    setView("flujo");
    setTick((t) => t + 1);
  };

  // Envuelve una secuencia animada: se cancela si se reinicia o se cierra el modal
  const sequence = async (body) => {
    const id = ++run.current;
    const wait = (ms) => new Promise((resolve, reject) => setTimeout(() => (run.current === id ? resolve() : reject(CANCEL)), ms));
    setBusy(true);
    try {
      await body(wait);
    } catch (e) {
      if (e !== CANCEL) throw e;
    } finally {
      if (run.current === id) {
        update((x) => (x.typing = null));
        setBusy(false);
      }
    }
  };

  const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));
  const notify = (msg) => update((x) => x.notifications.unshift({ msg, id: x.notifications.length }));
  const event = (label, detail) => update((x) => x.events.push({ label, detail, id: x.events.length }));
  const say = (from, text) => update((x) => x.messages.push({ from, text }));

  // Etapa 1: el cliente escribe y corre el flujo de WhatsApp
  const answer = (option) =>
    sequence(async (wait) => {
      const step = async (node, ms = T.node) => {
        update((x) => (x.nodes[node] = "active"));
        await wait(ms);
        update((x) => (x.nodes[node] = "done"));
      };
      const skip = (...nodes) => update((x) => nodes.forEach((n) => (x.nodes[n] = "skipped")));

      setView("flujo");
      say("cliente", OPTIONS[option]);
      update((x) => {
        x.nodes = initialState().nodes;
        x.branches = {};
        x.tools = {};
        if (option === "precio") x.askedPrice = true;
      });
      await wait(500);

      // Lo que hace el CRM antes del flujo (crm-service)
      if (!s.current.contact) {
        update((x) => {
          x.contact = { name: "Cliente demo", phone: PHONE, role: "Contacto" };
          x.lead = { stage: "Nuevo", source: "WhatsApp", campaign: CAMPAIGN, assignedTo: null };
        });
        log(`Contacto nuevo creado (${PHONE})`);
        log(`Lead creado · origen WhatsApp · etapa Nuevo · campaña ${CAMPAIGN}`);
        event("Lead creado", "origen WhatsApp");
        notify(`Contacto nuevo (${PHONE})`);
      } else {
        notify("Mensaje de Cliente demo");
      }

      await step("trigger");
      log("Se dispara el flujo: WhatsApp: mensaje recibido");

      await step("sinAsesor");
      if (!s.current.lead.assignedTo) {
        update((x) => (x.branches.sinAsesor = "si"));
        await step("dispersor");
        const advisor = ADVISORS[Math.floor(Math.random() * ADVISORS.length)];
        log(`Turno rotativo: le toca a ${advisor}`);
        await step("asignar");
        update((x) => (x.lead.assignedTo = advisor));
        log(`Asesor asignado: ${advisor}`);
        notify(`${advisor}: te asignaron un lead nuevo (en el sistema y por correo)`);
      } else {
        update((x) => (x.branches.sinAsesor = "no"));
        skip("dispersor", "asignar");
        log(`El lead ya tiene asesor (${s.current.lead.assignedTo}): se salta el reparto`);
      }

      const d = sofia(option, s.current);
      update((x) => {
        x.nodes.agente = "active";
        x.typing = "Ana";
      });
      for (const tool of d.tools) {
        await wait(T.beat / 2);
        update((x) => (x.tools[tool] = "active"));
        log(`Ana usa la herramienta «${TOOLS[tool]}»`);
        await wait(T.tool);
        update((x) => (x.tools[tool] = "done"));
      }
      await wait(T.think);
      update((x) => (x.nodes.agente = "done"));
      log("Ana redactó la respuesta");

      await step("enviar", T.node * 0.7);
      update((x) => {
        x.typing = null;
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
        log("La conversación pasa a un asesor: el asistente deja de responder", "warn");
        notify(`${s.current.lead.assignedTo}: el cliente pidió hablar con un asesor`);
      } else {
        update((x) => (x.branches.traspaso = "no"));
        skip("pausar");
      }
    });

  // Etapa 2: el asesor toma la conversación, cotiza y la oportunidad avanza por el embudo
  const advance = () =>
    sequence(async (wait) => {
      const advisor = s.current.lead.assignedTo;
      const move = async (stage, label, detail) => {
        update((x) => {
          x.opportunity.stage = stage;
          x.opportunity.history.push(stage);
        });
        event(label, detail);
        log(`Oportunidad en etapa ${stage}`);
        await wait(T.node * 1.3);
      };

      setView("embudo");
      log(s.current.meeting ? `Pasa la reunión de ${s.current.meeting.toLowerCase()} con ${advisor}` : `${advisor} toma la conversación`, "ok");
      if (s.current.aiActive) {
        update((x) => (x.aiActive = false));
        log("El asesor toma la conversación y el asistente deja de responder", "warn");
      }
      await wait(T.node);

      update((x) => {
        x.lead.stage = "Convertido";
        x.opportunity = { name: QUOTE.name, value: QUOTE.value, stage: "Nuevo", history: ["Nuevo"] };
      });
      event("Lead → oportunidad", QUOTE.name);
      log(`Nueva oportunidad: ${QUOTE.name} · ${QUOTE.value}`);
      await wait(T.node * 1.3);

      await move("Calificado", "Cambio de etapa", "Nuevo → Calificado");
      await move("Propuesta", "Cambio de etapa", "Calificado → Propuesta");

      update((x) => (x.typing = advisor));
      await wait(T.think);
      update((x) => (x.typing = null));
      say(
        "asesor",
        `${s.current.meeting ? "¡Gracias por la reunión! Como lo hablamos, te" : `Hola, soy ${advisor.split(" ")[0]} y ya revisé tu caso. Te`} comparto la cotización ${QUOTE.id}: ${QUOTE.name} por ${QUOTE.value} + IVA. 📄`
      );
      log(`${advisor} envió la cotización ${QUOTE.id} por WhatsApp`);
      update((x) => (x.phase = "cotizacion"));
    });

  // Respuesta del cliente a la cotización
  const decide = (option) =>
    sequence(async (wait) => {
      const advisor = s.current.lead.assignedTo;
      setView("embudo");
      say("cliente", OPTIONS[option]);
      notify("Mensaje de Cliente demo");
      log("Llega el mensaje, pero la IA está apagada: el flujo de WhatsApp no responde y contesta el asesor", "warn");
      await wait(T.node);

      if (option === "aceptar") {
        update((x) => {
          x.opportunity.stage = "Ganado";
          x.opportunity.history.push("Ganado");
        });
        event("Venta ganada", `${QUOTE.value}`);
        log(`Venta ganada: ${QUOTE.name} · ${QUOTE.value}`, "ok");
        await wait(T.node);
        update((x) => (x.contact.role = "Cliente"));
        event("Ahora es cliente", "Cliente demo");
        log("El contacto pasó a ser cliente", "ok");
        notify(`Líder del equipo: ${advisor} ganó una oportunidad por ${QUOTE.value}`);
        await wait(T.beat);
        update((x) => (x.typing = advisor));
        await wait(T.think);
        update((x) => (x.typing = null));
        say("asesor", "¡Excelente, te damos la bienvenida! 🎉 En un momento te llegan la factura y el acceso a la plataforma.");
      } else {
        update((x) => {
          x.opportunity.stage = "Perdido";
          x.opportunity.lostReason = "Presupuesto";
          x.opportunity.history.push("Perdido");
        });
        event("Venta perdida", "motivo: Presupuesto");
        log("Venta perdida · motivo: Presupuesto", "warn");
        await wait(T.node);
        event("Seguimiento programado", "volver a escribirle en 30 días");
        log("Se programa un seguimiento para escribirle de nuevo en 30 días");
        await wait(T.beat);
        update((x) => (x.typing = advisor));
        await wait(T.think);
        update((x) => (x.typing = null));
        say("asesor", "Entiendo, gracias por contarme. Aquí estaré si más adelante quieres retomarlo.");
      }
      update((x) => (x.phase = "fin"));
    });

  const st = s.current;

  // Opciones disponibles según el momento de la conversación
  let choices = [];
  let action = null;
  if (!busy) {
    if (st.phase === "chat") {
      if (st.meeting || !st.aiActive) {
        action = { label: st.meeting ? "Avanzar: el asesor hace la reunión" : "Avanzar: el asesor atiende al cliente", run: advance };
      } else if (st.turn === 0) {
        choices = ["saludo", "precio", "asesor"];
      } else if (st.awaitingSlot) {
        choices = ["slot0", "slot1", "slot2", "asesor"];
      } else {
        choices = ["agendar", ...(st.askedPrice ? [] : ["precio"]), "asesor"];
      }
    } else if (st.phase === "cotizacion") {
      choices = ["aceptar", "rechazar"];
    }
  }
  const pick = (option) => (st.phase === "cotizacion" ? decide(option) : answer(option));

  const status = st.phase !== "chat" || !st.aiActive
    ? { text: st.lead?.assignedTo ? `Te atiende ${st.lead.assignedTo}` : "Te atiende un asesor", tone: "text-warm" }
    : { text: "Asistente virtual activo", tone: "text-accent" };

  const pane = (name) => (tab === name ? "flex" : "hidden lg:flex");

  return (
    <div className="flex h-full flex-col">
      {/* Pestañas solo en pantallas pequeñas */}
      <div className="flex shrink-0 gap-1 border-b border-line p-2 lg:hidden">
        {[
          ["chat", "Chat"],
          ["flujo", "Proceso"],
          ["crm", "CRM"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`relative flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${tab === k ? "bg-accent/15 text-accent" : "text-muted"}`}
          >
            {label}
            {/* Avisa que algo está corriendo mientras se mira otra pestaña */}
            {k === "flujo" && busy && tab !== "flujo" && <span className="absolute right-3 top-1.5 h-2 w-2 animate-ping rounded-full bg-warm" />}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_1fr_290px]">
        {/* Chat de WhatsApp: el usuario es el cliente */}
        <section className={`${pane("chat")} min-h-0 flex-col border-line lg:border-r`}>
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <Icon name="whatsapp" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Equipo comercial</p>
              <p className={`truncate text-xs ${status.tone}`}>{status.text}</p>
            </div>
            <button
              onClick={reset}
              title="Reiniciar"
              aria-label="Reiniciar simulación"
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
            >
              <Icon name="refresh" className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-bg/60 p-4">
            {st.messages.length === 0 && (
              <p className="mx-auto mt-6 max-w-[16rem] text-center text-xs text-muted">
                Eres un cliente que vio un anuncio de la campaña. Elige qué escribirle al equipo.
              </p>
            )}
            {st.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "cliente" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  {m.from !== "cliente" && (
                    <p className={`mb-0.5 px-1 text-[10px] font-semibold ${m.from === "sofia" ? "text-accent" : "text-warm"}`}>
                      {m.from === "sofia" ? "Ana · asistente IA" : `${st.lead?.assignedTo} · asesor`}
                    </p>
                  )}
                  <p
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                      m.from === "cliente" ? "rounded-br-sm bg-accent text-bg" : "rounded-bl-sm border border-line bg-surface"
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              </div>
            ))}
            {st.typing && (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-2 text-xs text-muted">{st.typing} está escribiendo…</p>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* Respuestas guiadas */}
          <div data-guide="crm-choices" className="shrink-0 border-t border-line px-3 py-2.5">
            {choices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {choices.map((c) => (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    className="rounded-full border border-accent/40 px-3 py-1 text-xs text-accent transition hover:bg-accent/10"
                  >
                    {OPTIONS[c]}
                  </button>
                ))}
              </div>
            )}
            {action && (
              <button
                onClick={action.run}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-warm px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110"
              >
                <Icon name="play" className="h-3.5 w-3.5" />
                {action.label}
              </button>
            )}
            {st.phase === "fin" && !busy && (
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110"
              >
                <Icon name="refresh" className="h-3.5 w-3.5" />
                Reiniciar la demo
              </button>
            )}
            {busy && <p className="py-1 text-center text-xs text-muted">Mira cómo se mueve el proceso…</p>}
          </div>

          {/* Se ve como WhatsApp, pero el chat es guiado */}
          <div className="flex shrink-0 items-center gap-2 border-t border-line p-3">
            <input
              disabled
              placeholder="Elige una opción arriba"
              className="min-w-0 flex-1 cursor-not-allowed rounded-full border border-line bg-bg px-4 py-2 text-sm opacity-60"
            />
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/40 text-bg">
              <Icon name="send" className="h-4 w-4" />
            </span>
          </div>
        </section>

        {/* Proceso: flujo de WhatsApp o embudo de ventas */}
        <section data-guide="crm-flow" className={`${pane("flujo")} min-h-0 flex-col`}>
          <div data-guide="crm-views" className="flex shrink-0 gap-1 border-b border-line px-4 py-2">
            {[
              ["flujo", "Flujo de WhatsApp"],
              ["embudo", "Embudo de ventas"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${view === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">{view === "flujo" ? <FlowView st={st} /> : <PipelineView st={st} />}</div>

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
        <section data-guide="crm-panel" className={`${pane("crm")} min-h-0 flex-col gap-3 overflow-y-auto border-line p-4 lg:border-l`}>
          <Panel title="Contacto">
            {st.contact ? (
              <>
                <Row k="Nombre" v={st.contact.name} />
                <Row k="Teléfono" v={st.contact.phone} />
                <Row k="Rol" v={<span className={st.contact.role === "Cliente" ? "text-accent" : ""}>{st.contact.role}</span>} />
              </>
            ) : (
              <p className="text-xs text-muted">Aún no existe. Se crea con el primer mensaje.</p>
            )}
          </Panel>

          <Panel title="Lead">
            {st.lead ? (
              <>
                <Row k="Origen" v={st.lead.source} />
                <Row k="Etapa" v={<Badge color={st.lead.stage === "Convertido" ? "#10B981" : "#3B82F6"}>{st.lead.stage}</Badge>} />
                <Row k="Campaña" v={st.lead.campaign} />
                <Row k="Asesor" v={st.lead.assignedTo ?? <span className="text-muted">Sin asignar</span>} />
              </>
            ) : (
              <p className="text-xs text-muted">Sin lead todavía.</p>
            )}
          </Panel>

          <Panel title="Oportunidad">
            {st.opportunity ? (
              <>
                <Row k="Nombre" v={st.opportunity.name} />
                <Row k="Valor" v={st.opportunity.value} />
                <Row k="Etapa" v={<Badge color={stageColor(st.opportunity.stage)}>{st.opportunity.stage}</Badge>} />
                {st.opportunity.lostReason && <Row k="Motivo" v={st.opportunity.lostReason} />}
              </>
            ) : (
              <p className="text-xs text-muted">Se crea cuando el asesor convierte el lead.</p>
            )}
          </Panel>

          <Panel title="Conversación">
            <Row k="Estado" v={st.aiActive ? <span className="text-accent">Asistente activo</span> : <span className="text-warm">Con un asesor</span>} />
            <Row k="Reunión" v={st.meeting ?? <span className="text-muted">—</span>} />
          </Panel>

          <Panel title="Notificaciones del equipo" icon="bell">
            {st.notifications.length === 0 ? (
              <p className="text-xs text-muted">Nada por ahora.</p>
            ) : (
              <ul className="space-y-1.5">
                {st.notifications.slice(0, 5).map((n) => (
                  <li key={n.id} className="animate-pop rounded-lg bg-bg/70 px-2 py-1.5 text-xs">
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

function FlowView({ st }) {
  return (
    <>
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Atención de leads por WhatsApp</p>
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
            <Placeholder active={st.branches.sinAsesor === "no"}>Sigue directo a la asistente</Placeholder>
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
            <Placeholder active={st.branches.traspaso === "no"}>Ana sigue atendiendo</Placeholder>
          </div>
        </div>
      </div>
    </>
  );
}

function PipelineView({ st }) {
  const opp = st.opportunity;
  return (
    <>
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Embudo de oportunidades</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {STAGES.map((stage) => {
          const here = opp?.stage === stage.name;
          const passed = opp?.history.includes(stage.name) && !here;
          return (
            <div key={stage.name} className="flex min-w-0 items-start gap-3 sm:flex-col sm:items-stretch sm:gap-0">
              <div className="flex w-28 shrink-0 items-center gap-1.5 border-b-2 pb-1.5 pt-2 sm:mb-2 sm:w-auto sm:pt-0" style={{ borderColor: stage.color }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: stage.color }} />
                <span className="truncate text-[11px] font-semibold">{stage.name}</span>
              </div>
              <div className={`min-h-[2.5rem] flex-1 rounded-xl p-1.5 transition sm:min-h-[7.5rem] ${here ? "bg-white/5" : "bg-bg/40"}`}>
                {here && (
                  <div key={stage.name} className="animate-pop rounded-lg border bg-surface p-2 shadow-lg" style={{ borderColor: stage.color }}>
                    <p className="truncate text-[11px] font-semibold">Cliente demo</p>
                    <p className="truncate text-[10px] text-muted">{opp.name}</p>
                    <p className="mt-1 text-xs font-bold" style={{ color: stage.color }}>
                      {opp.value}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-muted">{st.lead?.assignedTo}</p>
                  </div>
                )}
                {passed && <p className="py-1.5 text-center text-[10px] text-muted sm:pt-2">✓ pasó por aquí</p>}
              </div>
            </div>
          );
        })}
      </div>
      {!opp && (
        <p className="mx-auto mt-4 max-w-sm text-center text-xs text-muted">
          Todavía no hay oportunidad. Se crea cuando el asesor convierte el lead después de la reunión.
        </p>
      )}

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted">Disparadores del CRM</p>
      {st.events.length === 0 ? (
        <p className="text-xs text-muted">Aún no se ha disparado ninguno.</p>
      ) : (
        <ol className="space-y-1.5">
          {st.events.map((e, i) => (
            <li
              key={e.id}
              className={`flex animate-pop items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                i === st.events.length - 1 ? "border-accent/60 bg-accent/10" : "border-line"
              }`}
            >
              <Icon name="bolt" className="h-3.5 w-3.5 shrink-0 text-warm" />
              <span className="font-semibold">{e.label}</span>
              <span className="truncate text-muted">· {e.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </>
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
    <div ref={ref} className={`scroll-my-4 rounded-xl border transition-all duration-500 ${compact ? "p-2.5" : "p-3"} ${styles[state]}`}>
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
  return <div className={`mx-auto w-0.5 transition-colors duration-500 ${short ? "h-3" : "h-5"} ${on ? "bg-accent" : "bg-line"}`} />;
}

function BranchLabel({ label, active }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`h-3 w-0.5 ${active ? "bg-accent" : "bg-line"}`} />
      <span className={`mb-1 rounded-full px-2 text-[10px] font-semibold ${active ? "bg-accent/15 text-accent" : "text-muted"}`}>{label}</span>
    </div>
  );
}

function Placeholder({ active, children }) {
  return (
    <div
      className={`grid flex-1 place-items-center rounded-xl border border-dashed px-2 text-center text-xs transition ${
        active ? "border-accent/60 text-accent" : "border-line text-muted"
      }`}
    >
      {children}
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span className="rounded-full px-2 py-0.5" style={{ background: `${color}26`, color }}>
      {children}
    </span>
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

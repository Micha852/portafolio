"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, ExecLog, Panel, Badge } from "./ui";

// Réplica del hub de automatizaciones de Contagracia: asistente "Crear con IA" que propone un flujo
// sobre el catálogo real, lienzo tipo n8n, borradores, simulación, encendido y peticiones de lo que no existe.
// Prompts, nodos, etiquetas y reglas salen del código; las respuestas de la IA están guionizadas.

const MODULES = {
  crm: { label: "CRM", icon: "users" },
  ph: { label: "Propiedad horizontal", icon: "grid" },
  restaurant: { label: "Restaurante", icon: "calendar" },
};

// Tipos de nodo: colores del lienzo real
const KIND = {
  trigger: { border: "#F59E0B", icon: "#F59E0B", role: "CUANDO" },
  action: { border: "#64748B", icon: "#3B82F6", role: "ENTONCES" },
  control: { border: "#8B5CF6", icon: "#8B5CF6", role: "SI" },
  ai: { border: "#64748B", icon: "#3B82F6", role: "ENTONCES" },
  sub: { border: "#10B981", icon: "#10B981", role: "" },
};

const T = (id, label, icon, x, y = 0) => ({ id, kind: "trigger", label, icon, x, y });
const A = (id, label, icon, x, y = 0, role) => ({ id, kind: "action", label, icon, x, y, role });
const C = (id, label, icon, x, y = 0, role) => ({ id, kind: "control", label, icon, x, y, role });

// Ejemplos por módulo: los posibles salen de los flujos de biblioteca; el último termina en petición
const EXAMPLES = {
  crm: [
    {
      id: "crm-lead",
      prompt: "Cuando llegue un lead nuevo, crear una tarea para el asesor y avisarle.",
      reply:
        "Le propongo un flujo que arranca con cada **lead creado** y, en paralelo, crea una tarea de llamada para el asesor responsable y le envía una notificación en el sistema.\n\nRevise la propuesta a la derecha; si le sirve, pulse **Aceptar**. Le recomiendo **Simular** antes de prenderlo.",
      flow: {
        name: "Primer contacto con un lead nuevo",
        description: "Crea una tarea de llamada y avisa al asesor cuando entra un lead.",
        does: ["Se dispara cuando se crea un lead (cualquier origen).", "Crea una actividad de llamada asignada al responsable.", "Le avisa al responsable con una notificación."],
        nodes: [T("t", "Lead creado", "users", 0), A("a1", "Crear actividad", "calendar", 1, -0.6), A("a2", "Notificar en el sistema", "bell", 1, 0.6)],
        edges: [["t", "a1"], ["t", "a2"]],
      },
    },
    {
      id: "crm-stalled",
      prompt: "Si una oportunidad lleva 15 días quieta, avisarle al responsable y al líder del equipo.",
      reply:
        "Listo: el disparador **«Una oportunidad lleva días sin moverse»** con 15 días se activa una sola vez por oportunidad. De ahí salen dos avisos en paralelo: uno para el responsable y otro para el líder de su equipo.\n\nSi le sirve, pulse **Aceptar**.",
      flow: {
        name: "Avisar a responsable y líder si la oportunidad lleva 15 días quieta",
        description: "Dos notificaciones en paralelo cuando una oportunidad no se mueve en 15 días.",
        does: ["Cuenta como movimiento: etapa, responsable, valor o fecha de cierre.", "No aplica a oportunidades ganadas o perdidas.", "Avisa al responsable y al líder del equipo."],
        nodes: [T("t", "Oportunidad quieta 15 días", "bolt", 0), A("a1", "Notificar al responsable", "bell", 1, -0.6), A("a2", "Notificar al líder", "bell", 1, 0.6)],
        edges: [["t", "a1"], ["t", "a2"]],
      },
    },
    {
      id: "crm-birthday",
      prompt: "El día del cumpleaños de un cliente, mandarle un correo de felicitación.",
      reply:
        "Le armé el flujo con el disparador **«Cumpleaños de un contacto»** y un correo al contacto. Falta elegir **qué plantilla** usar, así que se crea en **borrador**: puede guardarse, pero no prenderse hasta completarla.\n\nPulse **Aceptar** para crearlo.",
      flow: {
        name: "Felicitación de cumpleaños",
        description: "Correo de felicitación el día del cumpleaños de cada contacto.",
        does: ["Se dispara el día del cumpleaños del contacto.", "Le envía un correo con una plantilla del CRM."],
        pending: [{ node: "Enviar email", field: "Plantilla", fix: "Feliz cumpleaños" }],
        nodes: [T("t", "Cumpleaños de un contacto", "calendar", 0), A("a1", "Enviar email", "mail", 1)],
        edges: [["t", "a1"]],
      },
    },
    {
      id: "crm-no",
      prompt: "Cuando se gane una oportunidad, registrar el asiento contable de la comisión del asesor.",
      impossible: {
        reply:
          "Puedo arrancar con **«Oportunidad ganada»**, pero el módulo de Contabilidad todavía no tiene acciones para registrar asientos desde un flujo.\n\nLo más cercano que existe es avisarle al equipo contable con una notificación para que lo registre a mano.",
        falta: "Una acción de Contabilidad para registrar asientos desde un flujo",
        alternativa: "Notificar al equipo contable cuando se gane la oportunidad",
      },
    },
  ],
  ph: [
    {
      id: "ph-reminder",
      prompt: "A comienzo de mes, enviar a propietarios y arrendatarios un recordatorio de pago.",
      reply:
        "Le propongo un flujo **«En un horario»** el día 1 de cada mes a las 8:00 a. m., que envía un **comunicado** a propietarios y arrendatarios de la copropiedad recordando el pago de la administración.\n\nRevíselo a la derecha y pulse **Aceptar**.",
      flow: {
        name: "Recordatorio mensual de pago de administración",
        description: "Comunicado el primer día de cada mes a propietarios y arrendatarios.",
        does: ["Corre el día 1 de cada mes a las 8:00 a. m.", "Envía un comunicado por correo a propietarios y arrendatarios."],
        nodes: [T("t", "En un horario · día 1", "calendar", 0), A("a1", "Enviar comunicado", "megaphone", 1)],
        edges: [["t", "a1"]],
      },
    },
    {
      id: "ph-ai",
      prompt: "Cuando entre una PQRS nueva, que la IA me resuma en una línea de qué se trata y me lo mande por la campanita.",
      reply:
        "Armé el flujo con **«PQRS radicada»**, un **Agente IA** con su Chat Model que resume la PQRS en una línea, y una **notificación** con ese resumen para usted.\n\nSi le sirve, pulse **Aceptar**.",
      flow: {
        name: "Resumen de PQRS nueva en la campanita",
        description: "La IA resume cada PQRS nueva y la manda como notificación.",
        does: ["Se dispara con cada PQRS radicada.", "El agente IA resume de qué se trata en una línea.", "Le llega como notificación en la campanita."],
        nodes: [
          T("t", "PQRS radicada", "mail", 0),
          { id: "ai", kind: "ai", label: "Agente IA", icon: "sparkles", x: 1 },
          { id: "cm", kind: "sub", label: "Chat Model", icon: "sparkles", x: 1, y: 1.05 },
          A("a1", "Enviar notificación", "bell", 2),
        ],
        edges: [["t", "ai"], ["ai", "a1"], ["ai", "cm", { dashed: true }]],
      },
    },
    {
      id: "ph-overdue",
      prompt: "Cuando una cuota de administración lleve 5 días vencida, mandarle un correo al residente y avisarme a mí con una notificación.",
      reply:
        "Usé **«La cuota de una unidad está por vencer»** configurado **5 días después de vencida**, con dos pasos en paralelo: un correo al residente y una notificación para usted.\n\nFalta elegir la **plantilla del correo**, así que queda en **borrador**. Pulse **Aceptar** para crearlo.",
      flow: {
        name: "Aviso de cuota vencida a los 5 días",
        description: "Correo al residente y aviso interno cuando la cuota lleva 5 días vencida.",
        does: ["Se dispara 5 días después del vencimiento de la cuota.", "Envía un correo al responsable de pagos de la unidad.", "Le avisa a la administración con una notificación."],
        pending: [{ node: "Enviar email", field: "Plantilla", fix: "Cuota vencida" }],
        nodes: [T("t", "Cuota vencida +5 días", "calendar", 0), A("a1", "Enviar email", "mail", 1, -0.6), A("a2", "Enviar notificación", "bell", 1, 0.6)],
        edges: [["t", "a1"], ["t", "a2"]],
      },
    },
    {
      id: "ph-no",
      prompt: "Avisarme 15 días antes de que se venza la póliza de áreas comunes y mandarle un WhatsApp al revisor fiscal.",
      impossible: {
        reply:
          "Revisé el catálogo de Propiedad horizontal: hay disparadores cuando una póliza se crea, se edita o se borra, pero **no uno por vencimiento**. Por eso no le puedo armar este flujo todavía.\n\nMientras tanto, existen flujos parecidos por fecha, como el aviso de cuota por vencer.",
        falta: "Un disparador por vencimiento de póliza (días antes de la fecha)",
        alternativa: "Flujos por fecha que ya existen, como «La cuota de una unidad está por vencer»",
      },
    },
  ],
  restaurant: [
    {
      id: "rest-reservation",
      prompt: "Cuando se cree una reserva, enviarle un WhatsApp de confirmación al cliente.",
      reply:
        "Le propongo **«Reserva tomada»** y un **WhatsApp** de confirmación al cliente con la fecha, hora y número de personas.\n\nComo el flujo le escribe a clientes, ¿quiere que además le avise al equipo con una notificación interna? Por ahora pulse **Aceptar** para crearlo así.",
      flow: {
        name: "Confirmación de reserva por WhatsApp",
        description: "WhatsApp al cliente cada vez que se toma una reserva.",
        does: ["Se dispara cuando se toma una reserva.", "Envía un WhatsApp de confirmación al cliente."],
        nodes: [T("t", "Reserva tomada", "calendar", 0), A("a1", "Enviar WhatsApp", "whatsapp", 1)],
        edges: [["t", "a1"]],
      },
    },
    {
      id: "rest-stuck",
      prompt: "Cada 10 minutos, avisarme de las comandas que llevan más de 15 minutos sin marcarse listas, una sola vez por comanda.",
      reply:
        "Armé un flujo **«En un horario»** cada 10 minutos que **busca comandas atascadas** de más de 15 minutos y, **por cada una**, le envía una notificación con su consecutivo. Cada comanda se avisa una sola vez.\n\nSi le sirve, pulse **Aceptar**.",
      flow: {
        name: "Aviso de comandas atascadas",
        description: "Revisa cada 10 minutos y avisa por cada comanda demorada.",
        does: ["Corre cada 10 minutos.", "Busca comandas enviadas o en preparación hace más de 15 minutos.", "Envía una notificación por cada una: «Comanda atascada: {{consecutivo}}»."],
        nodes: [
          T("t", "En un horario · cada 10 min", "calendar", 0),
          A("a1", "Buscar comandas atascadas", "filter", 1),
          C("c1", "Por cada uno", "repeat", 2, 0, "POR CADA"),
          A("a2", "Enviar notificación", "bell", 3),
        ],
        edges: [["t", "a1"], ["a1", "c1"], ["c1", "a2", { label: "cada", color: "#8B5CF6" }]],
      },
    },
    {
      id: "rest-upcoming",
      prompt: "El día antes de una reserva, mandarle un recordatorio al cliente.",
      reply:
        "Usé **«Se acerca una reserva»** con 1 día de anticipación (solo reservas confirmadas), un **filtro** para seguir solo si el cliente tiene correo, y un **correo** de recordatorio.\n\nFalta elegir la **plantilla**, así que queda en **borrador**. Pulse **Aceptar** para crearlo.",
      flow: {
        name: "Recordatorio un día antes de la reserva",
        description: "Correo al cliente el día antes de su reserva confirmada.",
        does: ["Se dispara 1 día antes de cada reserva confirmada.", "Sigue solo si el cliente tiene correo.", "Le envía el recordatorio por correo."],
        pending: [{ node: "Enviar email", field: "Plantilla", fix: "Recordatorio de reserva" }],
        nodes: [
          T("t", "Se acerca una reserva", "calendar", 0),
          C("c1", "Filtrar: tiene correo", "filter", 1, 0, "FILTRAR"),
          A("a1", "Enviar email", "mail", 2),
        ],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
      },
    },
    {
      id: "rest-no",
      prompt: "Al cerrar la caja, registrar un asiento contable con las propinas del día.",
      impossible: {
        reply:
          "El cierre de caja y las propinas existen en el sistema, pero **Contabilidad todavía no tiene acciones** para registrar asientos desde un flujo, así que no puedo armarlo.\n\nComo alternativa, puedo enviarle cada noche un correo con el resumen para que lo registre usted.",
        falta: "Una acción de Contabilidad para registrar asientos desde un flujo",
        alternativa: "Un correo diario con el resumen del cierre",
      },
    },
  ],
};

const PETICION_STATUS = {
  pendiente: ["Pendiente", "#F59E0B"],
  en_revision: ["En revisión", "#0EA5E9"],
  disponible: ["Disponible", "#10B981"],
  descartada: ["Descartada", "#94A3B8"],
};

const SIM_STATUS = { trigger: "Llegó el evento", action: "Se ejecutaría", ai: "Se ejecutaría", control: "Se evaluó", sub: "Conectado" };

const initialState = () => ({
  module: "crm",
  messages: [],
  thinking: false,
  proposal: null,
  drawn: 0,
  simStatus: {},
  showDraft: false,
  flows: [],
  peticiones: [
    {
      id: 1,
      module: "Facturación",
      date: "08 oct",
      email: "admin@demo.co",
      pedido: "Cuando se pague un pedido de la tienda, mándele un WhatsApp de agradecimiento al cliente.",
      falta: "El disparador «Pedido de tienda pagado» no trae el teléfono del cliente",
      alternativa: "Una notificación interna cuando se pague el pedido",
      estado: "en_revision",
      nota: "",
    },
  ],
  userNotices: [],
  log: [],
});

export default function AutomationsSimulator() {
  const { st, update, sequence, busy, reset } = useSim(initialState);
  const [view, setView] = useState("asistente");
  const [review, setReview] = useState(null); // petición en revisión: { id, estado, nota }
  const chatEnd = useRef(null);
  const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [st.messages.length, st.thinking]);

  const changeModule = (m) => {
    if (m === st.module) return;
    update((x) => {
      x.module = m;
      x.messages = [];
      x.proposal = null;
      x.simStatus = {};
      x.showDraft = false;
    });
    log(`Módulo del flujo: ${MODULES[m].label} · nueva conversación`);
  };

  const ask = (ex) =>
    sequence(async (wait) => {
      update((x) => {
        x.messages.push({ from: "user", text: ex.prompt });
        x.thinking = true;
        x.proposal = null;
        x.simStatus = {};
        x.showDraft = false;
        x.drawn = 0;
      });
      for (const tool of ex.impossible ? ["listar_nodos", "ver_nodo"] : ["listar_nodos", "ver_nodo", "resolver_opciones", "proponer_flujo"]) {
        await wait(650);
        log(`La IA consulta el catálogo: ${tool}`);
      }
      await wait(500);
      const usage = `DeepSeek · deepseek-chat · ${(2.4 + ex.prompt.length / 90).toFixed(1).replace(".", ",")}k tokens · ${(4 + ex.prompt.length / 60).toFixed(1).replace(".", ",")} s · ${ex.impossible ? 2 : 4} consultas al modelo`;
      if (ex.impossible) {
        update((x) => {
          x.thinking = false;
          x.messages.push({ from: "ai", text: ex.impossible.reply, usage, peticion: { ex, sent: false } });
        });
        log("No existe en el catálogo: la IA ofrece dejarlo como sugerencia", "warn");
        return;
      }
      update((x) => {
        x.thinking = false;
        x.messages.push({ from: "ai", text: ex.reply, usage, proposalOf: ex.id });
        x.proposal = { ex, accepted: false, flowId: null };
      });
      log(`Propuesta: ${ex.flow.name}`, "ok");
      for (let i = 1; i <= ex.flow.nodes.length; i++) {
        await wait(380);
        update((x) => (x.drawn = i));
      }
    });

  const accept = () => {
    const f = st.proposal.ex.flow;
    const id = st.flows.length + 1;
    update((x) => {
      x.flows.unshift({
        id,
        name: f.name,
        module: x.module,
        trigger: f.nodes[0].label,
        pending: f.pending ? [...f.pending] : [],
        active: false,
        runs: 0,
      });
      x.proposal.accepted = true;
      x.proposal.flowId = id;
    });
    log("Flujo creado. Queda apagado hasta que usted lo encienda.", "ok");
    if (f.pending?.length) log(`Queda en Borrador: «${f.pending[0].node}»: falta completar «${f.pending[0].field}»`, "warn");
  };

  const currentFlow = st.proposal?.flowId ? st.flows.find((f) => f.id === st.proposal.flowId) : null;

  const simulate = () =>
    sequence(async (wait) => {
      update((x) => (x.simStatus = {}));
      log(`Simulación de «${st.proposal.ex.flow.name}»: no pasa nada de verdad`);
      for (const n of st.proposal.ex.flow.nodes) {
        await wait(700);
        update((x) => (x.simStatus[n.id] = SIM_STATUS[n.kind]));
        if (n.kind !== "sub") log(`${n.label}: ${SIM_STATUS[n.kind]}`);
      }
      const pending = currentFlow?.pending.length ?? 0;
      log(pending ? `Hay ${pending} cosa para revisar` : "Simulación completa sin advertencias", pending ? "warn" : "ok");
    });

  const turnOn = (flowId) => {
    const f = st.flows.find((y) => y.id === flowId);
    if (f.pending.length) {
      update((x) => (x.showDraft = true));
      log("Este flujo todavía es un borrador y no se puede prender", "warn");
      return;
    }
    update((x) => (x.flows.find((y) => y.id === flowId).active = !f.active));
    log(f.active ? `Se apagó «${f.name}»` : `Se prendió «${f.name}»: sus acciones ya son reales`, f.active ? "warn" : "ok");
  };

  const completePending = (flowId) => {
    const f = st.flows.find((y) => y.id === flowId);
    const p = f.pending[0];
    update((x) => {
      x.flows.find((y) => y.id === flowId).pending = [];
      x.showDraft = false;
    });
    log(`«${p.node}»: se eligió la plantilla «${p.fix}». Ya no es borrador`, "ok");
  };

  const leaveSuggestion = (msgIndex) => {
    const msg = st.messages[msgIndex];
    if (msg.peticion.sent) return;
    const ex = msg.peticion.ex;
    update((x) => {
      x.messages[msgIndex].peticion.sent = true;
      if (!x.peticiones.some((p) => p.pedido === ex.prompt && (p.estado === "pendiente" || p.estado === "en_revision")))
        x.peticiones.unshift({
          id: x.peticiones.length + 1,
          module: MODULES[x.module].label,
          date: "13 oct",
          email: "michael@demo.co",
          pedido: ex.prompt,
          falta: ex.impossible.falta,
          alternativa: ex.impossible.alternativa,
          estado: "pendiente",
          nota: "",
        });
      x.messages.push({ from: "ai", text: "Gracias por su sugerencia. Contagracia la implementará en las próximas horas." });
    });
    log("Petición de automatización creada (Pendiente)", "ok");
  };

  const saveReview = () => {
    const p = st.peticiones.find((y) => y.id === review.id);
    update((x) => {
      const y = x.peticiones.find((z) => z.id === review.id);
      y.estado = review.estado;
      y.nota = review.nota;
      if (review.estado === "disponible")
        x.userNotices.unshift({
          id: Date.now(),
          title: "Ya se puede crear el flujo que pidió",
          body: `Lo que pidió ya está disponible: "${p.pedido}". Ábralo en el asistente y envíelo de nuevo.`,
          pedido: p.pedido,
        });
      if (review.estado === "descartada")
        x.userNotices.unshift({
          id: Date.now(),
          title: "Su sugerencia de automatización fue revisada",
          body: `Por ahora no se va a construir lo que pidió: "${p.pedido}". Motivo: ${review.nota || "no aplica por ahora"}.`,
        });
    });
    log(`Petición #${p.id} → ${PETICION_STATUS[review.estado][0]}${["disponible", "descartada"].includes(review.estado) ? " · se avisó al usuario" : ""}`, "ok");
    setReview(null);
  };

  const examples = EXAMPLES[st.module];

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {[
          ["asistente", "Crear con IA", "sparkles"],
          ["flujos", `Flujos (${st.flows.length})`, "bolt"],
          ["peticiones", `Peticiones · admin (${st.peticiones.filter((p) => p.estado === "pendiente").length})`, "mail"],
        ].map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              view === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name={icon} className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <button onClick={reset} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent" title="Reiniciar" aria-label="Reiniciar simulación">
          <Icon name="refresh" className="h-4 w-4" />
        </button>
      </div>

      {/* ───── Asistente ───── */}
      <div className={view === "asistente" ? "min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[380px_1fr] lg:overflow-hidden" : "hidden"}>
        <section className="flex flex-col border-line lg:min-h-0 lg:border-r">
          <div className="shrink-0 space-y-2 border-b border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Módulo del flujo</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MODULES).map(([k, m]) => (
                <button
                  key={k}
                  disabled={busy}
                  onClick={() => changeModule(k)}
                  className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${st.module === k ? "border-[#6366F1] bg-[#6366F1]/15 text-[#A5B4FC]" : "border-line text-muted hover:text-ink"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {st.messages.length === 0 && (
              <div className="pt-2 text-center">
                <p className="font-display font-bold">¿Qué quiere automatizar en {MODULES[st.module].label}?</p>
                <p className="mt-1 text-xs text-muted">Cuéntele qué debe pasar y cuándo. Elija un ejemplo:</p>
              </div>
            )}
            {st.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[92%]">
                  <div className={`rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "rounded-br-sm bg-[#6366F1] text-white" : "rounded-bl-sm border border-line bg-bg/60"}`}>
                    <Markdown text={m.text} />
                  </div>
                  {m.peticion && (
                    <div className="mt-2 rounded-xl border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-3 text-xs">
                      <p className="font-semibold text-[#F59E0B]">Esto todavía no existe en el sistema</p>
                      <p className="mt-1">
                        <span className="text-muted">Lo que falta:</span> {m.peticion.ex.impossible.falta}
                      </p>
                      <p className="mt-1 text-muted">¿Quiere dejarlo como sugerencia para que Contagracia lo construya?</p>
                      <button
                        onClick={() => leaveSuggestion(i)}
                        disabled={m.peticion.sent}
                        className="mt-2 rounded-full bg-[#F59E0B] px-3 py-1 text-[11px] font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
                      >
                        {m.peticion.sent ? "✓ Sugerencia enviada" : "Dejar como sugerencia"}
                      </button>
                    </div>
                  )}
                  {m.proposalOf && <p className="mt-1 text-[11px] text-[#A5B4FC]">Propuesta: {EXAMPLES[st.module].find((e) => e.id === m.proposalOf)?.flow.name} (a la derecha)</p>}
                  {m.usage && <p className="mt-1 text-[10px] text-muted">{m.usage}</p>}
                </div>
              </div>
            ))}
            {st.thinking && <p className="text-xs text-muted">Armando el flujo… puede tardar unos segundos.</p>}
            <div ref={chatEnd} />
          </div>

          <div className="shrink-0 border-t border-line p-3">
            <div className="flex flex-col gap-1.5">
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  disabled={busy}
                  onClick={() => ask(ex)}
                  className="rounded-xl border border-[#6366F1]/40 px-3 py-1.5 text-left text-xs text-[#A5B4FC] transition hover:bg-[#6366F1]/10 disabled:opacity-40"
                >
                  {ex.prompt}
                  {ex.impossible && <span className="ml-1 text-[10px] text-[#F59E0B]">(no existe aún)</span>}
                </button>
              ))}
            </div>
            <input disabled placeholder="Describa el flujo que necesita… (en la demo, elija un ejemplo)" className="mt-2 w-full cursor-not-allowed rounded-full border border-line bg-bg px-4 py-2 text-xs opacity-60" />
          </div>
        </section>

        <section className="flex flex-col lg:min-h-0">
          <div className="relative min-h-[360px] border-b border-line lg:flex-1">
            <Canvas proposal={st.proposal} drawn={st.drawn} simStatus={st.simStatus} />
          </div>
          <div className="shrink-0 p-4 lg:max-h-[34%] lg:overflow-y-auto">
            {st.proposal ? (
              <ProposalCard
                proposal={st.proposal}
                flow={currentFlow}
                busy={busy}
                showDraft={st.showDraft}
                onAccept={accept}
                onSimulate={simulate}
                onTurnOn={() => turnOn(currentFlow.id)}
                onComplete={() => completePending(currentFlow.id)}
              />
            ) : (
              <p className="text-center text-xs text-muted">Aquí se va a dibujar el flujo que proponga la IA, para que lo vea antes de aceptarlo.</p>
            )}
          </div>
          <ExecLog log={st.log} empty="Elija un ejemplo para empezar…" className="h-24" />
        </section>
      </div>

      {/* ───── Lista de flujos ───── */}
      <div className={view === "flujos" ? "min-h-0 flex-1 overflow-y-auto p-5" : "hidden"}>
        <p className="font-display text-lg font-bold">Automatizaciones</p>
        <p className="mb-4 text-xs text-muted">Motor de flujos. Los flujos nuevos arrancan apagados: pruébelos antes de prenderlos.</p>
        {st.flows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="font-semibold">Todavía no hay flujos</p>
            <p className="mt-1 text-xs text-muted">Créelos con el asistente en «Crear con IA».</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {st.flows.map((f) => {
              const badge = f.pending.length ? ["Borrador", "#F59E0B"] : f.active ? ["Activo", "#10B981"] : ["Apagado", "#94A3B8"];
              return (
                <div key={f.id} className="animate-pop rounded-2xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{f.name}</p>
                    <Badge color={badge[1]}>{badge[0]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {MODULES[f.module].label} · {f.trigger} · {f.runs} ejecuciones
                  </p>
                  {f.pending.length > 0 && (
                    <p className="mt-2 text-[11px] text-[#F59E0B]">
                      «{f.pending[0].node}»: falta completar «{f.pending[0].field}».
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {f.pending.length > 0 ? (
                      <button onClick={() => completePending(f.id)} className="rounded-full border border-line px-3 py-1 text-[11px] transition hover:border-accent hover:text-accent">
                        Elegir plantilla «{f.pending[0].fix}»
                      </button>
                    ) : (
                      <button onClick={() => turnOn(f.id)} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${f.active ? "border border-line text-muted" : "bg-accent text-bg"}`}>
                        {f.active ? "Apagar" : "Prender"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───── Peticiones (admin) ───── */}
      <div className={view === "peticiones" ? "min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[1fr_320px] lg:overflow-hidden" : "hidden"}>
        <section className="space-y-3 p-5 lg:overflow-y-auto">
          <div>
            <p className="font-display text-lg font-bold">Peticiones de automatización</p>
            <p className="text-xs text-muted">Lo que los usuarios pidieron al asistente y todavía no existe. El equipo lo revisa y avisa cuando está disponible.</p>
          </div>
          {st.peticiones.map((p) => {
            const [label, color] = PETICION_STATUS[p.estado];
            const editing = review?.id === p.id;
            return (
              <div key={p.id} className="animate-pop rounded-2xl border border-line p-4 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={color}>{label}</Badge>
                  <Badge color="#6366F1">{p.module}</Badge>
                  <span className="text-muted">
                    {p.date} · Empresa demo · {p.email}
                  </span>
                </div>
                <p className="mt-2 text-sm">{p.pedido}</p>
                <p className="mt-1">
                  <span className="text-muted">Qué falta:</span> {p.falta}
                </p>
                <p>
                  <span className="text-muted">Se le ofreció:</span> {p.alternativa}
                </p>
                {p.nota && (
                  <p>
                    <span className="text-muted">Nota:</span> {p.nota}
                  </p>
                )}
                {!editing && !["disponible", "descartada"].includes(p.estado) && (
                  <button onClick={() => setReview({ id: p.id, estado: p.estado === "pendiente" ? "en_revision" : "disponible", nota: "" })} className="mt-3 rounded-full border border-line px-3 py-1 text-[11px] transition hover:border-accent hover:text-accent">
                    Revisar
                  </button>
                )}
                {editing && (
                  <div className="mt-3 space-y-2 rounded-xl border border-line bg-bg/60 p-3">
                    <p className="font-semibold">Revisar petición</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["en_revision", "disponible", "descartada"].map((k) => (
                        <button
                          key={k}
                          onClick={() =>
                            setReview((r) => ({
                              ...r,
                              estado: k,
                              nota: k === "disponible" ? "Ya agregamos lo que faltaba al catálogo." : k === "descartada" ? "Se sale del alcance del módulo." : "",
                            }))
                          }
                          className="rounded-full border px-2.5 py-0.5 text-[11px]"
                          style={{ borderColor: PETICION_STATUS[k][1], color: review.estado === k ? "#0b0f19" : PETICION_STATUS[k][1], background: review.estado === k ? PETICION_STATUS[k][1] : "transparent" }}
                        >
                          {PETICION_STATUS[k][0]}
                        </button>
                      ))}
                    </div>
                    {review.nota && <p className="text-muted">Nota para el usuario: {review.nota}</p>}
                    <div className="flex gap-2">
                      <button onClick={saveReview} className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-bg">
                        {["disponible", "descartada"].includes(review.estado) ? "Guardar y avisar" : "Guardar"}
                      </button>
                      <button onClick={() => setReview(null)} className="rounded-full border border-line px-3 py-1 text-[11px]">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
        <aside className="space-y-3 border-t border-line p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <Panel title="Avisos al usuario" icon="bell">
            {st.userNotices.length === 0 ? (
              <p className="text-xs text-muted">Cuando una petición pasa a Disponible o Descartada, el usuario recibe un aviso.</p>
            ) : (
              st.userNotices.map((n) => (
                <div key={n.id} className="animate-pop rounded-lg bg-bg/70 p-2 text-xs">
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-muted">{n.body}</p>
                  {n.pedido && (
                    <button onClick={() => setView("asistente")} className="mt-1 text-[11px] text-accent hover:underline">
                      Abrir en el asistente →
                    </button>
                  )}
                </div>
              ))
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

// Negritas simples (**texto**) y saltos de línea
function Markdown({ text }) {
  return text.split("\n").map((line, i) => (
    <p key={i} className={line ? "" : "h-2"}>
      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => (part.startsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part))}
    </p>
  ));
}

function ProposalCard({ proposal, flow, busy, showDraft, onAccept, onSimulate, onTurnOn, onComplete }) {
  const f = proposal.ex.flow;
  const pending = flow ? flow.pending : f.pending ?? [];
  return (
    <div className="animate-pop space-y-2 rounded-2xl border border-[#6366F1]/40 bg-[#6366F1]/5 p-4 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#A5B4FC]">Propuesta de flujo</p>
      <p className="text-sm font-semibold">{f.name}</p>
      <p className="text-muted">{f.description}</p>
      <div>
        <p className="font-semibold">Qué hace</p>
        <ul className="list-inside list-disc text-muted">
          {f.does.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
      {pending.length > 0 && (
        <div>
          <p className="font-semibold text-[#F59E0B]">Queda por completar (se crea en borrador)</p>
          {pending.map((p) => (
            <p key={p.node} className="text-muted">
              «{p.node}»: falta completar «{p.field}».
            </p>
          ))}
        </div>
      )}
      {showDraft && pending.length > 0 && (
        <div className="rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-2">
          <p>Este flujo es un borrador: se guarda, pero no se puede prender.</p>
          <p className="text-muted">
            · «{pending[0].node}»: falta completar «{pending[0].field}».
          </p>
          <button onClick={onComplete} className="mt-1 rounded-full bg-[#F59E0B] px-3 py-1 text-[11px] font-semibold text-bg">
            Elegir plantilla «{pending[0].fix}»
          </button>
        </div>
      )}
      {!proposal.accepted ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
          <p className="text-muted">Se crea apagado: después lo revisa, lo simula y lo enciende desde la pantalla de flujos.</p>
          <button onClick={onAccept} className="rounded-full bg-[#6366F1] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110">
            Aceptar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
          <span className="text-accent">
            ✓ Flujo creado, {flow?.active ? "activo" : pending.length ? "en borrador" : "apagado"}
          </span>
          <button onClick={onSimulate} disabled={busy} className="ml-auto rounded-full border border-line px-3 py-1 text-[11px] transition hover:border-accent hover:text-accent disabled:opacity-40">
            Simular
          </button>
          <button onClick={onTurnOn} disabled={busy} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:opacity-40 ${flow?.active ? "border border-line" : "bg-accent text-bg"}`}>
            {flow?.active ? "Apagar" : "Prender"}
          </button>
        </div>
      )}
    </div>
  );
}

// Lienzo de solo lectura al estilo n8n: nodos cuadrados, conexiones curvas y nota de origen
const COL = 170;
const ROW = 110;
const SIZE = 64;

// Ancho de pantalla grande: deja espacio para la nota de origen
function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

function Canvas({ proposal, drawn, simStatus }) {
  const wide = useWide();
  if (!proposal) return <div className="absolute inset-0 bg-[radial-gradient(rgb(var(--line))_1px,transparent_1px)] [background-size:18px_18px] opacity-60" />;
  const f = proposal.ex.flow;
  const nodes = f.nodes.slice(0, drawn);
  const maxX = Math.max(...f.nodes.map((n) => n.x));
  const left = wide ? 270 : 30; // espacio para la nota de origen
  const width = left + (maxX + 1) * COL;
  const height = 360;
  const cx = (n) => left + n.x * COL + SIZE / 2;
  const cy = (n) => 185 + (n.y ?? 0) * ROW;
  const byId = Object.fromEntries(f.nodes.map((n) => [n.id, n]));

  return (
    <div className="absolute inset-0 overflow-auto bg-[radial-gradient(rgb(var(--line))_1px,transparent_1px)] [background-size:18px_18px]">
      <div className="relative mx-auto" style={{ width: Math.max(width, 420), height }}>
        {/* Nota de origen (StickyNode) */}
        <div className="absolute left-3 top-3 hidden w-[230px] animate-pop rounded-md bg-[#FEF3C7] lg:block p-2.5 text-[10px] leading-snug text-[#78350F] shadow-md">
          <p className="font-semibold">Armado con el asistente de IA.</p>
          <p className="mt-1">Se pidió:</p>
          <p className="italic">«{proposal.ex.prompt}»</p>
        </div>

        <svg className="absolute inset-0" width={Math.max(width, 420)} height={height}>
          {f.edges.map(([a, b, opt = {}]) => {
            const A = byId[a];
            const B = byId[b];
            if (!nodes.includes(A) || !nodes.includes(B)) return null;
            if (opt.dashed) {
              return <path key={a + b} d={`M ${cx(A)} ${cy(A) + SIZE / 2} L ${cx(B)} ${cy(B) - 34}`} stroke="#10B981" strokeWidth="2" strokeDasharray="5 4" fill="none" />;
            }
            const x1 = cx(A) + SIZE / 2;
            const y1 = cy(A);
            const x2 = cx(B) - SIZE / 2;
            const y2 = cy(B);
            const mx = (x1 + x2) / 2;
            return (
              <g key={a + b}>
                <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} stroke={opt.color ?? "rgb(var(--muted))"} strokeOpacity="0.7" strokeWidth="2" fill="none" />
                {opt.label && (
                  <text x={mx} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill={opt.color}>
                    {opt.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {nodes.map((n) => {
          const k = KIND[n.kind];
          const status = simStatus[n.id];
          if (n.kind === "sub") {
            return (
              <div key={n.id} className="absolute grid w-24 animate-pop place-items-center rounded-xl border-2 bg-surface py-2 text-center" style={{ left: cx(n) - 48, top: cy(n) - 34, borderColor: k.border }}>
                <Icon name={n.icon} className="h-5 w-5 text-[#10B981]" />
                <p className="text-[10px] font-semibold">{n.label}</p>
              </div>
            );
          }
          return (
            <div key={n.id} className="absolute w-[120px] animate-pop text-center" style={{ left: cx(n) - 60, top: cy(n) - SIZE / 2 - 16 }}>
              <p className="mb-1 text-[9px] font-bold tracking-widest text-muted">{n.role ?? k.role}</p>
              <div
                className={`relative mx-auto grid place-items-center border-2 bg-surface shadow-md transition ${n.kind === "trigger" ? "rounded-l-[28px] rounded-r-xl" : "rounded-xl"} ${status ? "ring-4 ring-accent/30" : ""}`}
                style={{ width: SIZE, height: SIZE, borderColor: k.border }}
              >
                {n.kind === "trigger" && <span className="absolute -left-5 text-sm">⚡</span>}
                <span style={{ color: k.icon }}>
                  <Icon name={n.icon} className="h-7 w-7" />
                </span>
              </div>
              <p className="mt-1.5 text-[11px] font-semibold leading-tight">{n.label}</p>
              {status && <p className="mt-1 inline-block rounded-full bg-accent/15 px-2 text-[9px] font-semibold text-accent">{status}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

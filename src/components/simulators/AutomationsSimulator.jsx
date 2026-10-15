"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, ExecLog, Panel, Badge } from "./ui";

// Demo propia de un hub de automatizaciones: un asistente con IA propone flujos, se dibujan en un lienzo
// tipo n8n, se prueban y se activan; lo que no se puede hacer queda como solicitud. Todo es guionizado y ficticio.

const MODULES = {
  crm: { label: "CRM", icon: "users" },
  ph: { label: "Propiedad horizontal", icon: "grid" },
  restaurant: { label: "Restaurante", icon: "calendar" },
};

// Tipos de nodo y su color en el lienzo
const KIND = {
  trigger: { border: "#F59E0B", icon: "#F59E0B", role: "DISPARADOR" },
  action: { border: "#64748B", icon: "#3B82F6", role: "ACCIÓN" },
  control: { border: "#8B5CF6", icon: "#8B5CF6", role: "CONDICIÓN" },
  ai: { border: "#64748B", icon: "#3B82F6", role: "IA" },
  sub: { border: "#10B981", icon: "#10B981", role: "" },
};

const T = (id, label, icon, x, y = 0) => ({ id, kind: "trigger", label, icon, x, y });
const A = (id, label, icon, x, y = 0, role) => ({ id, kind: "action", label, icon, x, y, role });
const C = (id, label, icon, x, y = 0, role) => ({ id, kind: "control", label, icon, x, y, role });

// Ejemplos propios de la demo: tres que se pueden armar y uno que queda como solicitud, por módulo
const EXAMPLES = {
  crm: [
    {
      id: "crm-form",
      prompt: "Cuando llegue un lead desde el formulario web, enviarle un correo de bienvenida y crear una tarea de llamada.",
      reply:
        "Te propongo un flujo que arranca con cada **formulario recibido** y hace dos cosas en paralelo: le envía un **correo de bienvenida** al lead y crea una **tarea de llamada** para el equipo.\n\nRevísalo a la derecha y, si te sirve, crea el flujo. Antes de activarlo, pruébalo.",
      flow: {
        name: "Bienvenida a leads del formulario web",
        description: "Correo de bienvenida y tarea de llamada para cada lead nuevo del sitio web.",
        does: ["Se dispara con cada formulario recibido.", "Envía un correo de bienvenida al lead.", "Crea una tarea de llamada para el equipo comercial."],
        nodes: [T("t", "Formulario recibido", "mail", 0), A("a1", "Enviar correo", "mail", 1, -0.6), A("a2", "Crear tarea", "calendar", 1, 0.6)],
        edges: [["t", "a1"], ["t", "a2"]],
      },
    },
    {
      id: "crm-quote",
      prompt: "Si un cliente no responde una cotización en 7 días, recordársela por WhatsApp.",
      reply:
        "Listo: el disparador **«Cotización sin respuesta»** configurado a **7 días** y un **WhatsApp** de recordatorio con el número de la cotización.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Recordatorio de cotización a los 7 días",
        description: "WhatsApp al cliente cuando una cotización lleva una semana sin respuesta.",
        does: ["Se dispara 7 días después de enviar una cotización sin respuesta.", "Le recuerda la cotización al cliente por WhatsApp."],
        nodes: [T("t", "Cotización sin respuesta · 7 días", "bolt", 0), A("a1", "Enviar WhatsApp", "whatsapp", 1)],
        edges: [["t", "a1"]],
      },
    },
    {
      id: "crm-weekly",
      prompt: "Cada lunes a las 8 a. m., enviarme por correo el resumen de ventas de la semana.",
      reply:
        "Armé un flujo **programado los lunes a las 8:00** que calcula el **resumen de ventas** de la semana y te lo envía por **correo**.\n\nFalta elegir la **plantilla del correo**, así que se guarda como **borrador**.",
      flow: {
        name: "Resumen semanal de ventas",
        description: "Correo con las ventas de la semana, cada lunes a primera hora.",
        does: ["Corre los lunes a las 8:00 a. m.", "Calcula las ventas de la semana anterior.", "Te envía el resumen por correo."],
        pending: [{ node: "Enviar correo", field: "Plantilla", fix: "Resumen semanal" }],
        nodes: [T("t", "Programado · lunes 8:00", "calendar", 0), A("a1", "Resumen de ventas", "filter", 1), A("a2", "Enviar correo", "mail", 2)],
        edges: [["t", "a1"], ["a1", "a2"]],
      },
    },
    {
      id: "crm-no",
      prompt: "Cuando se gane una venta, emitir la factura electrónica automáticamente.",
      impossible: {
        reply:
          "Puedo arrancar con **«Venta ganada»**, pero por ahora los flujos no tienen una acción para **emitir facturas**.\n\nLo más cercano es avisarle al equipo de facturación para que la emita.",
        falta: "Una acción para emitir facturas desde un flujo",
        alternativa: "Avisar al equipo de facturación cuando se gane la venta",
        resolved: {
          reply: "¡Ya se puede! Ahora existe la acción **«Emitir factura»**. Te propongo arrancar con **«Venta ganada»** y emitir la factura del cliente.\n\nRevísalo y crea el flujo.",
          flow: {
            name: "Factura automática al ganar una venta",
            description: "Emite la factura en cuanto una venta pasa a ganada.",
            does: ["Se dispara cuando una venta pasa a Ganado.", "Emite la factura con los datos del cliente."],
            nodes: [T("t", "Venta ganada", "bolt", 0), { ...A("a1", "Emitir factura", "grid", 1), isNew: true }],
            edges: [["t", "a1"]],
          },
        },
      },
    },
  ],
  ph: [
    {
      id: "ph-reserva",
      prompt: "Cuando un residente reserve el salón social, avisarle a portería.",
      reply: "Te propongo **«Reserva de zona común»** filtrada al **salón social**, con un **aviso a portería** que incluye la fecha y la unidad.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Aviso a portería por reservas del salón",
        description: "Portería se entera de cada reserva del salón social.",
        does: ["Se dispara con cada reserva de una zona común.", "Sigue solo si es el salón social.", "Avisa a portería con la fecha y la unidad."],
        nodes: [T("t", "Reserva de zona común", "calendar", 0), C("c1", "Solo salón social", "filter", 1, 0, "FILTRO"), A("a1", "Avisar a portería", "bell", 2)],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
      },
    },
    {
      id: "ph-morosos",
      prompt: "Si un residente acumula dos cuotas vencidas, enviarle su estado de cuenta por correo.",
      reply:
        "Usé **«Cuota vencida»**, una **condición** para seguir solo si la unidad tiene **2 o más cuotas vencidas**, y un **correo** con el estado de cuenta.\n\nFalta elegir la **plantilla**, así que queda en **borrador**.",
      flow: {
        name: "Estado de cuenta a unidades con dos cuotas vencidas",
        description: "Correo con el estado de cuenta cuando una unidad acumula dos cuotas vencidas.",
        does: ["Se dispara cuando una cuota se vence.", "Sigue solo si la unidad ya tiene 2 o más vencidas.", "Envía el estado de cuenta al responsable de pagos."],
        pending: [{ node: "Enviar correo", field: "Plantilla", fix: "Estado de cuenta" }],
        nodes: [T("t", "Cuota vencida", "calendar", 0), C("c1", "¿2 o más vencidas?", "branch", 1, 0, "CONDICIÓN"), A("a1", "Enviar correo", "mail", 2)],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
      },
    },
    {
      id: "ph-ai",
      prompt: "Cuando entre una PQRS, que la IA la clasifique por tema y la asigne al área encargada.",
      reply:
        "Armé **«PQRS recibida»**, un **asistente IA** con su modelo que clasifica el tema (mantenimiento, convivencia, cartera…) y una acción que **asigna el responsable** según ese tema.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Clasificación de PQRS con IA",
        description: "La IA clasifica cada PQRS y la asigna al área que corresponde.",
        does: ["Se dispara con cada PQRS recibida.", "La IA identifica el tema.", "Asigna la PQRS al área encargada."],
        nodes: [
          T("t", "PQRS recibida", "mail", 0),
          { id: "ai", kind: "ai", label: "Asistente IA", icon: "sparkles", x: 1 },
          { id: "cm", kind: "sub", label: "Modelo", icon: "sparkles", x: 1, y: 1.05 },
          A("a1", "Asignar responsable", "user", 2),
        ],
        edges: [["t", "ai"], ["ai", "a1"], ["ai", "cm", { dashed: true }]],
      },
    },
    {
      id: "ph-no",
      prompt: "Abrir la talanquera del parqueadero cuando llegue un visitante registrado.",
      impossible: {
        reply:
          "El registro de visitantes existe, pero el sistema todavía **no se conecta con el control de acceso** del parqueadero, así que no puedo abrir la talanquera.\n\nComo alternativa, puedo avisarle a portería en cuanto llegue el visitante.",
        falta: "Integración con el control de acceso del parqueadero",
        alternativa: "Avisar a portería cuando llegue un visitante registrado",
        resolved: {
          reply: "¡Ya se puede! Ahora existe la acción **«Abrir talanquera»**. Te propongo arrancar con **«Visitante registrado»** y abrir el acceso.\n\nRevísalo y crea el flujo.",
          flow: {
            name: "Acceso automático para visitantes registrados",
            description: "Abre la talanquera cuando llega un visitante que ya estaba registrado.",
            does: ["Se dispara cuando llega un visitante registrado.", "Abre la talanquera del parqueadero."],
            nodes: [T("t", "Visitante registrado", "user", 0), { ...A("a1", "Abrir talanquera", "grid", 1), isNew: true }],
            edges: [["t", "a1"]],
          },
        },
      },
    },
  ],
  restaurant: [
    {
      id: "rest-delivery",
      prompt: "Cuando un pedido a domicilio salga de cocina, avisarle al cliente por WhatsApp.",
      reply: "Te propongo **«Pedido listo»** filtrado a **domicilios**, con un **WhatsApp** al cliente avisando que su pedido va en camino.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Aviso de domicilio en camino",
        description: "WhatsApp al cliente cuando su domicilio sale de cocina.",
        does: ["Se dispara cuando un pedido queda listo.", "Sigue solo si es a domicilio.", "Avisa al cliente por WhatsApp."],
        nodes: [T("t", "Pedido listo", "bolt", 0), C("c1", "Solo domicilios", "filter", 1, 0, "FILTRO"), A("a1", "Enviar WhatsApp", "whatsapp", 2)],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
      },
    },
    {
      id: "rest-agotado",
      prompt: "Si un plato se agota, ocultarlo del menú público y avisarme.",
      reply: "Listo: **«Producto agotado»** con dos pasos en paralelo: **ocultarlo del menú público** y **avisarte** con una notificación.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Ocultar platos agotados del menú",
        description: "Saca del menú público lo que se agota y te avisa.",
        does: ["Se dispara cuando un producto se agota.", "Lo oculta del menú público.", "Te envía una notificación."],
        nodes: [T("t", "Producto agotado", "bolt", 0), A("a1", "Ocultar del menú", "grid", 1, -0.6), A("a2", "Notificarme", "bell", 1, 0.6)],
        edges: [["t", "a1"], ["t", "a2"]],
      },
    },
    {
      id: "rest-daily",
      prompt: "Todas las noches, enviarme por correo las ventas del día.",
      reply:
        "Armé un flujo **programado a las 11:00 p. m.** que calcula las **ventas del día** y te las envía por **correo**.\n\nFalta elegir la **plantilla**, así que queda en **borrador**.",
      flow: {
        name: "Cierre diario de ventas",
        description: "Correo con las ventas del día, cada noche.",
        does: ["Corre todos los días a las 11:00 p. m.", "Calcula las ventas del día.", "Te las envía por correo."],
        pending: [{ node: "Enviar correo", field: "Plantilla", fix: "Cierre del día" }],
        nodes: [T("t", "Programado · 11:00 p. m.", "calendar", 0), A("a1", "Ventas del día", "filter", 1), A("a2", "Enviar correo", "mail", 2)],
        edges: [["t", "a1"], ["a1", "a2"]],
      },
    },
    {
      id: "rest-no",
      prompt: "Cuando se acabe un insumo, pedírselo al proveedor por WhatsApp.",
      impossible: {
        reply:
          "Puedo detectar cuando un insumo se acaba, pero los flujos todavía **no tienen los datos de contacto de los proveedores**, así que no puedo escribirles.\n\nMientras tanto, puedo avisarte a ti para que hagas el pedido.",
        falta: "Datos de contacto de los proveedores disponibles en los flujos",
        alternativa: "Avisarte cuando un insumo se acabe",
        resolved: {
          reply: "¡Ya se puede! Los flujos ahora tienen el **contacto del proveedor** de cada insumo. Te propongo **«Insumo agotado»** y un **WhatsApp** al proveedor con el pedido.\n\nRevísalo y crea el flujo.",
          flow: {
            name: "Pedido automático de insumos",
            description: "WhatsApp al proveedor cuando se acaba un insumo.",
            does: ["Se dispara cuando un insumo llega a cero.", "Le escribe al proveedor por WhatsApp con el pedido."],
            nodes: [{ ...T("t", "Insumo agotado", "bolt", 0), isNew: true }, A("a1", "WhatsApp al proveedor", "whatsapp", 1)],
            edges: [["t", "a1"]],
          },
        },
      },
    },
  ],
};

const PETICION_STATUS = {
  pendiente: ["Nueva", "#F59E0B"],
  en_revision: ["En análisis", "#0EA5E9"],
  disponible: ["Lista", "#10B981"],
  descartada: ["No aplica", "#94A3B8"],
};

const SIM_STATUS = { trigger: "Evento de prueba", action: "Correría", ai: "Correría", control: "Evaluada", sub: "Conectado" };

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
      module: "Tienda",
      date: "08 oct",
      email: "admin@demo.co",
      pedido: "Cuando un cliente pague en la tienda en línea, enviarle un WhatsApp de agradecimiento.",
      falta: "El pago de la tienda todavía no trae el teléfono del cliente",
      alternativa: "Un aviso interno cuando se pague el pedido",
      moduleKey: null,
      resolved: {
        reply: "¡Ya se puede! El **pago de la tienda** ahora trae el teléfono del cliente. Te propongo un **WhatsApp** de agradecimiento apenas pague.\n\nRevísalo y crea el flujo.",
        flow: {
          name: "Agradecimiento por WhatsApp al pagar en la tienda",
          description: "WhatsApp de agradecimiento cuando un cliente paga en la tienda en línea.",
          does: ["Se dispara cuando se paga un pedido de la tienda.", "Le envía un WhatsApp de agradecimiento al cliente."],
          nodes: [{ ...T("t", "Pago en la tienda", "bolt", 0), isNew: true }, A("a1", "Enviar WhatsApp", "whatsapp", 1)],
          edges: [["t", "a1"]],
        },
      },
      estado: "en_revision",
      nota: "",
    },
  ],
  userNotices: [],
  prefill: null,
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

  // Si lo que se pidió ya pasó a Disponible, la IA usa el flujo resuelto
  const available = (ex) => ex.impossible && st.peticiones.some((p) => p.pedido === ex.prompt && p.estado === "disponible");
  const resolve = (ex) => (available(ex) ? { id: ex.id, prompt: ex.prompt, reply: ex.impossible.resolved.reply, flow: ex.impossible.resolved.flow } : ex);

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
      for (const tool of ex.impossible ? ["Revisando los disparadores disponibles", "Revisando las acciones disponibles"] : ["Revisando los disparadores disponibles", "Revisando las acciones disponibles", "Completando los datos de cada paso", "Armando la propuesta"]) {
        await wait(650);
        log(`IA: ${tool}`);
      }
      await wait(500);
      const usage = `Modelo de IA · ${(2.4 + ex.prompt.length / 90).toFixed(1).replace(".", ",")}k tokens · ${(4 + ex.prompt.length / 60).toFixed(1).replace(".", ",")} s · ${ex.impossible ? 2 : 4} pasos`;
      if (ex.impossible) {
        update((x) => {
          x.thinking = false;
          x.messages.push({ from: "ai", text: ex.impossible.reply, usage, peticion: { ex, sent: false } });
        });
        log("No se puede automatizar todavía: la IA ofrece dejarlo como solicitud", "warn");
        return;
      }
      update((x) => {
        x.thinking = false;
        x.messages.push({ from: "ai", text: ex.reply, usage, proposalName: ex.flow.name });
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
    log("Flujo creado. Queda inactivo hasta que lo actives.", "ok");
    if (f.pending?.length) log(`Queda como borrador: a «${f.pending[0].node}» le falta «${f.pending[0].field}»`, "warn");
  };

  const currentFlow = st.proposal?.flowId ? st.flows.find((f) => f.id === st.proposal.flowId) : null;

  const simulate = () =>
    sequence(async (wait) => {
      update((x) => (x.simStatus = {}));
      log(`Prueba de «${st.proposal.ex.flow.name}» con datos de ejemplo: no se envía nada`);
      for (const n of st.proposal.ex.flow.nodes) {
        await wait(700);
        update((x) => (x.simStatus[n.id] = SIM_STATUS[n.kind]));
        if (n.kind !== "sub") log(`${n.label}: ${SIM_STATUS[n.kind]}`);
      }
      const pending = currentFlow?.pending.length ?? 0;
      log(pending ? `Hay ${pending} cosa por configurar` : "Prueba completa sin advertencias", pending ? "warn" : "ok");
    });

  const turnOn = (flowId) => {
    const f = st.flows.find((y) => y.id === flowId);
    if (f.pending.length) {
      update((x) => (x.showDraft = true));
      log("El flujo está incompleto y todavía no se puede activar", "warn");
      return;
    }
    update((x) => (x.flows.find((y) => y.id === flowId).active = !f.active));
    log(f.active ? `Se desactivó «${f.name}»` : `Se activó «${f.name}»`, f.active ? "warn" : "ok");
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
          moduleKey: x.module,
          resolved: ex.impossible.resolved,
          estado: "pendiente",
          nota: "",
        });
      x.messages.push({ from: "ai", text: "Listo, quedó registrada tu solicitud. Te aviso cuando esté disponible." });
    });
    log("Solicitud registrada (Nueva)", "ok");
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
          title: "Tu solicitud ya está lista",
          body: `Ya se puede automatizar: "${p.pedido}". Ábrelo en el asistente y envíalo de nuevo.`,
          pedido: p.pedido,
          peticionId: p.id,
        });
      if (review.estado === "descartada")
        x.userNotices.unshift({
          id: Date.now(),
          title: "Revisamos tu solicitud",
          body: `Por ahora no vamos a construir: "${p.pedido}". Motivo: ${review.nota || "no aplica por ahora"}.`,
        });
    });
    log(`Solicitud #${p.id} → ${PETICION_STATUS[review.estado][0]}${["disponible", "descartada"].includes(review.estado) ? " · se avisó al usuario" : ""}`, "ok");
    setReview(null);
  };

  // Desde el aviso: abre el asistente con el pedido precargado, sin enviarlo
  const openInAssistant = (peticionId) => {
    const p = st.peticiones.find((y) => y.id === peticionId);
    update((x) => {
      if (p.moduleKey && p.moduleKey !== x.module) {
        x.module = p.moduleKey;
        x.messages = [];
        x.proposal = null;
        x.simStatus = {};
        x.showDraft = false;
      }
      x.prefill = { pedido: p.pedido, resolved: p.resolved, moduleLabel: p.module, id: p.id };
    });
    setView("asistente");
    log(`Se abrió el asistente con el pedido precargado (${p.module})`);
  };

  const sendPrefill = () => {
    const { pedido, resolved, id } = st.prefill;
    update((x) => (x.prefill = null));
    ask({ id: `resuelta-${id}`, prompt: pedido, reply: resolved.reply, flow: resolved.flow });
  };

  const examples = EXAMPLES[st.module];

  return (
    <div className="flex h-full flex-col">
      <div data-guide="auto-tabs" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {[
          ["asistente", "Crear con IA", "sparkles"],
          ["flujos", `Flujos (${st.flows.length})`, "bolt"],
          ["peticiones", `Solicitudes · admin (${st.peticiones.filter((p) => p.estado === "pendiente").length})`, "mail"],
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
          <div data-guide="auto-module" className="shrink-0 space-y-2 border-b border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Módulo del flujo</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MODULES).map(([k, m]) => (
                <button
                  key={k}
                  disabled={busy}
                  onClick={() => changeModule(k)}
                  className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${st.module === k ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-ink"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {st.messages.length === 0 && (
              <div className="pt-2 text-center">
                <p className="font-display font-bold">¿Qué quieres automatizar en {MODULES[st.module].label}?</p>
                <p className="mt-1 text-xs text-muted">Cuéntame qué debe pasar y cuándo. Elige un ejemplo:</p>
              </div>
            )}
            {st.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[92%]">
                  <div className={`rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "rounded-br-sm bg-accent text-bg" : "rounded-bl-sm border border-line bg-bg/60"}`}>
                    <Markdown text={m.text} />
                  </div>
                  {m.peticion && (
                    <div className="mt-2 rounded-xl border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-3 text-xs">
                      <p className="font-semibold text-[#F59E0B]">Por ahora no se puede automatizar</p>
                      <p className="mt-1">
                        <span className="text-muted">Lo que falta:</span> {m.peticion.ex.impossible.falta}
                      </p>
                      <p className="mt-1 text-muted">¿Lo dejo como solicitud para el equipo?</p>
                      <button
                        onClick={() => leaveSuggestion(i)}
                        disabled={m.peticion.sent}
                        className="mt-2 rounded-full bg-[#F59E0B] px-3 py-1 text-[11px] font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
                      >
                        {m.peticion.sent ? "✓ Solicitud enviada" : "Enviar solicitud"}
                      </button>
                    </div>
                  )}
                  {m.proposalName && <p className="mt-1 text-[11px] text-accent">Propuesta: {m.proposalName} (a la derecha)</p>}
                  {m.usage && <p className="mt-1 text-[10px] text-muted">{m.usage}</p>}
                </div>
              </div>
            ))}
            {st.thinking && <p className="text-xs text-muted">Pensando el flujo…</p>}
            <div ref={chatEnd} />
          </div>

          <div className="shrink-0 border-t border-line p-3">
            {/* Pedido que llega desde el aviso «Tu solicitud ya está lista» */}
            {st.prefill && (
              <div className="mb-2 animate-pop rounded-xl border border-accent/50 bg-accent/10 p-3 text-xs">
                <p className="font-semibold text-accent">Pedido precargado · {st.prefill.moduleLabel} (no se ha enviado)</p>
                <p className="mt-1">{st.prefill.pedido}</p>
                <button onClick={sendPrefill} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-bg transition hover:brightness-110 disabled:opacity-40">
                  <Icon name="send" className="h-3 w-3" />
                  Enviar
                </button>
              </div>
            )}
            <div data-guide="auto-examples" className="flex flex-col gap-1.5">
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  disabled={busy}
                  onClick={() => ask(resolve(ex))}
                  className="rounded-xl border border-accent/40 px-3 py-1.5 text-left text-xs text-accent transition hover:bg-accent/10 disabled:opacity-40"
                >
                  {ex.prompt}
                  {ex.impossible && !available(ex) && <span className="ml-1 text-[10px] text-[#F59E0B]">(no existe aún)</span>}
                  {available(ex) && <span className="ml-1 text-[10px] text-accent">(ya disponible)</span>}
                </button>
              ))}
            </div>
            <input disabled placeholder="Describe el flujo que necesitas… (en la demo, elige un ejemplo)" className="mt-2 w-full cursor-not-allowed rounded-full border border-line bg-bg px-4 py-2 text-xs opacity-60" />
          </div>
        </section>

        <section className="flex flex-col lg:min-h-0">
          <div data-guide="auto-canvas" className="relative min-h-[360px] border-b border-line lg:flex-1">
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
              <p className="text-center text-xs text-muted">Aquí aparecerá el flujo que proponga la IA.</p>
            )}
          </div>
          <ExecLog log={st.log} empty="Elige un ejemplo para empezar…" className="h-24" />
        </section>
      </div>

      {/* ───── Lista de flujos ───── */}
      <div className={view === "flujos" ? "min-h-0 flex-1 overflow-y-auto p-5" : "hidden"}>
        <p className="font-display text-lg font-bold">Mis flujos</p>
        <p className="mb-4 text-xs text-muted">Los flujos nuevos quedan inactivos hasta que los pruebes y actives.</p>
        {st.flows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="font-semibold">Todavía no hay flujos</p>
            <p className="mt-1 text-xs text-muted">Créalos con el asistente en «Crear con IA».</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {st.flows.map((f) => {
              const badge = f.pending.length ? ["Borrador", "#F59E0B"] : f.active ? ["Activo", "#10B981"] : ["Inactivo", "#94A3B8"];
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
                        {f.active ? "Desactivar" : "Activar"}
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
            <p className="font-display text-lg font-bold">Solicitudes de automatización</p>
            <p className="text-xs text-muted">Lo que los usuarios pidieron y todavía no se puede hacer. El equipo lo analiza y les avisa.</p>
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
                    {p.date} · Empresa de ejemplo · {p.email}
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
                    <p className="font-semibold">Revisar solicitud</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["en_revision", "disponible", "descartada"].map((k) => (
                        <button
                          key={k}
                          onClick={() =>
                            setReview((r) => ({
                              ...r,
                              estado: k,
                              nota: k === "disponible" ? "Ya está disponible." : k === "descartada" ? "No está dentro del alcance por ahora." : "",
                            }))
                          }
                          className="rounded-full border px-2.5 py-0.5 text-[11px]"
                          style={{ borderColor: PETICION_STATUS[k][1], color: review.estado === k ? "#0b0f19" : PETICION_STATUS[k][1], background: review.estado === k ? PETICION_STATUS[k][1] : "transparent" }}
                        >
                          {PETICION_STATUS[k][0]}
                        </button>
                      ))}
                    </div>
                    {review.nota && <p className="text-muted">Mensaje para el usuario: {review.nota}</p>}
                    <div className="flex gap-2">
                      <button onClick={saveReview} className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-bg">
                        {["disponible", "descartada"].includes(review.estado) ? "Guardar y notificar" : "Guardar"}
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
              <p className="text-xs text-muted">Cuando una solicitud pasa a Lista o No aplica, el usuario recibe un aviso.</p>
            ) : (
              st.userNotices.map((n) => (
                <div key={n.id} className="animate-pop rounded-lg bg-bg/70 p-2 text-xs">
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-muted">{n.body}</p>
                  {n.pedido && (
                    <button onClick={() => openInAssistant(n.peticionId)} className="mt-1 text-[11px] text-accent hover:underline">
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
    <div className="animate-pop space-y-2 rounded-2xl border border-accent/40 bg-accent/5 p-4 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">Flujo propuesto</p>
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
          <p className="font-semibold text-[#F59E0B]">Falta configurar (se guarda como borrador)</p>
          {pending.map((p) => (
            <p key={p.node} className="text-muted">
              «{p.node}»: falta completar «{p.field}».
            </p>
          ))}
        </div>
      )}
      {showDraft && pending.length > 0 && (
        <div className="rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-2">
          <p>El flujo está incompleto y no se puede activar todavía.</p>
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
          <p className="text-muted">Se guarda inactivo; luego puedes probarlo y activarlo.</p>
          <button onClick={onAccept} className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110">
            Crear flujo
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
          <span className="text-accent">
            ✓ Flujo creado, {flow?.active ? "activo" : pending.length ? "en borrador" : "inactivo"}
          </span>
          <button onClick={onSimulate} disabled={busy} className="ml-auto rounded-full border border-line px-3 py-1 text-[11px] transition hover:border-accent hover:text-accent disabled:opacity-40">
            Probar
          </button>
          <button onClick={onTurnOn} disabled={busy} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:opacity-40 ${flow?.active ? "border border-line" : "bg-accent text-bg"}`}>
            {flow?.active ? "Desactivar" : "Activar"}
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
          <p className="font-semibold">Creado con IA a partir de:</p>
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
                {n.isNew && <span className="absolute -right-3 -top-2 rounded-full bg-accent px-1.5 text-[8px] font-bold uppercase text-bg">nuevo</span>}
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

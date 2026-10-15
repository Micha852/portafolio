"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, ExecLog, Panel, Badge } from "./ui";

// Demo propia de un hub de automatizaciones: un asistente con IA propone flujos, se dibujan en un lienzo
// tipo n8n, se prueban y se activan; lo que no se puede hacer queda como solicitud. Todo es guionizado y ficticio.

// Negocios ficticios de Grupo Nova; cada uno usa un módulo distinto del sistema
const MODULES = {
  crm: { label: "Academia", area: "CRM", biz: "Nova Idiomas", icon: "users" },
  ph: { label: "Conjunto", area: "PH", biz: "Residencial Nova", icon: "grid" },
  restaurant: { label: "Café-bar", area: "Restaurante", biz: "Nova Café", icon: "calendar" },
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

// Ejemplos propios de la demo: tres que se pueden armar (uno queda en borrador) y uno que queda como solicitud, por negocio
const EXAMPLES = {
  crm: [
    {
      id: "acad-lead",
      prompt: "Cuando llegue un lead desde un anuncio de Meta o el formulario web, darle la bienvenida por WhatsApp.",
      reply:
        "Te propongo un flujo con **dos disparadores**: **lead de anuncio de Meta** y **formulario web**. Los dos llegan a un **WhatsApp de bienvenida** con los horarios de la clase de prueba y luego se **asigna un asesor** comercial.\n\nRevísalo a la derecha y, si te sirve, crea el flujo. Antes de activarlo, pruébalo.",
      flow: {
        name: "Bienvenida por WhatsApp a leads nuevos",
        description: "Cada lead de Meta o del sitio web recibe un WhatsApp de bienvenida y queda con un asesor asignado.",
        trigger: "Lead de Meta o formulario",
        does: ["Se dispara con cada lead de un anuncio de Meta o del formulario web.", "Envía un WhatsApp de bienvenida con los horarios de la clase de prueba.", "Asigna el lead a un asesor comercial."],
        nodes: [
          T("t1", "Lead de anuncio Meta", "megaphone", 0, -0.65),
          T("t2", "Formulario web", "globe", 0, 0.65),
          A("a1", "WhatsApp de bienvenida", "whatsapp", 1),
          A("a2", "Asignar asesor", "user", 2),
        ],
        edges: [["t1", "a1"], ["t2", "a1"], ["a1", "a2"]],
        test: {
          t1: "Lead de prueba: Mateo Herrera · campaña «Inglés para viajar»",
          a1: "WhatsApp a +57 300 000 0000 con 3 horarios de clase de prueba",
          a2: "Asesor asignado por turno: Julián Cárdenas",
        },
      },
    },
    {
      id: "acad-trial",
      prompt: "Recordarle al estudiante su clase de prueba un día antes, por WhatsApp.",
      reply:
        "Listo: el disparador **«Clase de prueba · 1 día antes»**, un **filtro** para seguir solo si la clase **sigue agendada** y un **WhatsApp** con la hora, la sede y el nombre del docente.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Recordatorio de clase de prueba",
        description: "WhatsApp al estudiante 24 horas antes de su clase de prueba.",
        does: ["Se dispara 24 horas antes de cada clase de prueba.", "Sigue solo si la clase no fue cancelada.", "Le recuerda al estudiante la hora, la sede y el docente."],
        nodes: [T("t", "Clase de prueba · 1 día antes", "calendar", 0), C("c1", "¿Sigue agendada?", "filter", 1, 0, "FILTRO"), A("a1", "Recordatorio por WhatsApp", "whatsapp", 2)],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
        test: {
          t: "Clase de prueba de ejemplo: Sara Quintero · francés A1 · mañana 6:00 p. m.",
          c1: "Estado de la clase: agendada → sigue",
          a1: "WhatsApp con hora, sede Norte y docente Andrés Peña",
        },
      },
    },
    {
      id: "acad-weekly",
      prompt: "Cada lunes, enviarle a la coordinación un resumen de las inscripciones de la semana.",
      reply:
        "Armé un flujo **programado los lunes a las 7:00 a. m.** que cuenta las **inscripciones de la semana por idioma y nivel** y las envía por **correo**.\n\nNo me dijiste a qué correo, así que falta el **destinatario** y se guarda como **borrador**.",
      flow: {
        name: "Resumen semanal de inscripciones",
        description: "Correo a la coordinación con las inscripciones de la semana, por idioma y nivel.",
        does: ["Corre los lunes a las 7:00 a. m.", "Cuenta las inscripciones de la semana anterior por idioma y nivel.", "Envía el resumen por correo."],
        pending: [{ node: "Enviar correo", field: "Destinatario", fix: "Coordinación académica", cta: "Enviar a Coordinación académica" }],
        nodes: [T("t", "Programado · lunes 7:00", "calendar", 0), A("a1", "Resumen de inscripciones", "filter", 1), A("a2", "Enviar correo", "mail", 2)],
        edges: [["t", "a1"], ["a1", "a2"]],
        test: {
          t: "Ejecución manual de prueba",
          a1: "Semana de ejemplo: 14 inscripciones (inglés 9 · francés 3 · portugués 2)",
          a2: "Correo armado con el resumen",
        },
      },
    },
    {
      id: "acad-no",
      prompt: "Inscribir automáticamente al estudiante en la plataforma de clases externa.",
      impossible: {
        reply:
          "Puedo arrancar con **«Matrícula pagada»**, pero los flujos todavía **no se conectan con la plataforma de clases externa**, así que no puedo crear el usuario del estudiante allá.\n\nLo más cercano es avisarle a la coordinación para que lo inscriba a mano.",
        falta: "Conexión con la plataforma de clases externa",
        alternativa: "Avisar a la coordinación cuando se pague una matrícula",
        resolved: {
          reply: "¡Ya se puede! Ahora existe la acción **«Inscribir en plataforma de clases»**. Te propongo arrancar con **«Matrícula pagada»**, inscribir al estudiante en su curso y enviarle el acceso por **WhatsApp**.\n\nRevísalo y crea el flujo.",
          flow: {
            name: "Inscripción automática en la plataforma de clases",
            description: "Al pagar la matrícula, el estudiante queda inscrito en su curso y recibe el acceso.",
            does: ["Se dispara cuando se paga una matrícula.", "Inscribe al estudiante en su curso de la plataforma de clases.", "Le envía el acceso por WhatsApp."],
            nodes: [T("t", "Matrícula pagada", "bolt", 0), { ...A("a1", "Inscribir en plataforma", "grid", 1), isNew: true }, A("a2", "Enviar acceso", "whatsapp", 2)],
            edges: [["t", "a1"], ["a1", "a2"]],
            test: {
              t: "Matrícula de ejemplo: Tomás Rengifo · inglés B1",
              a1: "Inscripción simulada en el curso «Inglés B1 · noche»",
              a2: "WhatsApp con usuario y enlace de acceso",
            },
          },
        },
      },
    },
  ],
  ph: [
    {
      id: "ph-reserva",
      prompt: "Cuando se confirme una reserva de zona común, avisarle a portería.",
      reply:
        "Te propongo **«Reserva confirmada»** con dos pasos en paralelo: un **aviso a portería** con la zona, la fecha y la unidad, y un **WhatsApp al residente** con las reglas de uso.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Aviso a portería por reservas confirmadas",
        description: "Portería se entera de cada reserva confirmada y el residente recibe las reglas de uso.",
        does: ["Se dispara cuando la administración confirma una reserva.", "Avisa a portería con la zona, la fecha y la unidad.", "Le envía al residente las reglas de uso de la zona."],
        nodes: [T("t", "Reserva confirmada", "calendar", 0), A("a1", "Avisar a portería", "bell", 1, -0.65), A("a2", "Reglas al residente", "whatsapp", 1, 0.65)],
        edges: [["t", "a1"], ["t", "a2"]],
        test: {
          t: "Reserva de ejemplo: BBQ · sábado 3:00 p. m. · Torre 2 Apto 504",
          a1: "Aviso en la pantalla de portería",
          a2: "WhatsApp con horario y aforo de la zona BBQ",
        },
      },
    },
    {
      id: "ph-cuota",
      prompt: "El día 5 de cada mes, recordarles a los residentes con cuota de administración pendiente que paguen.",
      reply:
        "Usé un disparador **programado el día 5 a las 8:00 a. m.**, una **condición** para seguir solo con las unidades que tienen la **cuota del mes pendiente** y un **WhatsApp** con el valor y el enlace de pago.\n\nFalta elegir la **plantilla del mensaje**, así que queda en **borrador**.",
      flow: {
        name: "Recordatorio de cuota de administración",
        description: "WhatsApp el día 5 a las unidades que aún no han pagado la cuota del mes.",
        does: ["Corre el día 5 de cada mes a las 8:00 a. m.", "Sigue solo con las unidades que tienen la cuota pendiente.", "Les envía el valor y el enlace de pago por WhatsApp."],
        pending: [{ node: "Enviar WhatsApp", field: "Plantilla", fix: "Recordatorio de cuota", cta: "Elegir plantilla «Recordatorio de cuota»" }],
        nodes: [T("t", "Programado · día 5, 8:00", "calendar", 0), C("c1", "¿Cuota pendiente?", "branch", 1, 0, "CONDICIÓN"), A("a1", "Enviar WhatsApp", "whatsapp", 2)],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
        test: {
          t: "Ejecución manual de prueba",
          c1: "Unidades de ejemplo con cuota pendiente: 23 de 120",
          a1: "Mensaje armado para Torre 1 Apto 302 (no se envía)",
        },
      },
    },
    {
      id: "ph-ai",
      prompt: "Cuando entre una PQRS, que la IA la clasifique por tema y la asigne al área encargada.",
      reply:
        "Armé **«PQRS recibida»**, un **asistente IA** con su modelo que clasifica el tema (mantenimiento, convivencia, seguridad, cartera…) y una acción que **asigna el responsable** según ese tema.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Clasificación de PQRS con IA",
        description: "La IA clasifica cada PQRS del conjunto y la asigna al área que corresponde.",
        does: ["Se dispara con cada PQRS recibida.", "La IA identifica el tema y la urgencia.", "Asigna la PQRS al área encargada."],
        nodes: [
          T("t", "PQRS recibida", "mail", 0),
          { id: "ai", kind: "ai", label: "Asistente IA", icon: "sparkles", x: 1 },
          { id: "cm", kind: "sub", label: "Modelo", icon: "sparkles", x: 1, y: 1.05 },
          A("a1", "Asignar responsable", "user", 2),
        ],
        edges: [["t", "ai"], ["ai", "a1"], ["ai", "cm", { dashed: true }]],
        test: {
          t: "PQRS de ejemplo: «Hay una filtración en el techo del gimnasio»",
          ai: "Tema: mantenimiento · urgencia alta",
          a1: "Asignada a Mantenimiento (Héctor Salgado)",
        },
      },
    },
    {
      id: "ph-no",
      prompt: "Abrir la puerta del parqueadero cuando llegue el carro de un residente.",
      impossible: {
        reply:
          "Tengo las placas registradas de cada unidad, pero el sistema todavía **no se conecta con el control de acceso** del parqueadero, así que no puedo abrir la puerta.\n\nComo alternativa, puedo avisarle a portería cuando llegue un vehículo registrado.",
        falta: "Integración con el control de acceso del parqueadero",
        alternativa: "Avisar a portería cuando llegue un vehículo registrado",
        resolved: {
          reply: "¡Ya se puede! Ahora existe la acción **«Abrir puerta del parqueadero»**. Te propongo arrancar con **«Placa reconocida»**, revisar que esté **registrada** y abrir el acceso.\n\nRevísalo y crea el flujo.",
          flow: {
            name: "Acceso automático al parqueadero",
            description: "Abre la puerta del parqueadero cuando llega un vehículo registrado de un residente.",
            does: ["Se dispara cuando la cámara de la entrada reconoce una placa.", "Sigue solo si la placa está registrada.", "Abre la puerta del parqueadero."],
            nodes: [
              T("t", "Placa reconocida", "bolt", 0),
              C("c1", "¿Placa registrada?", "filter", 1, 0, "FILTRO"),
              { ...A("a1", "Abrir puerta", "grid", 2), isNew: true },
            ],
            edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
            test: {
              t: "Placa de ejemplo: KLM 482",
              c1: "Registrada en Torre 3 Apto 101 → sigue",
              a1: "Apertura simulada de la puerta vehicular",
            },
          },
        },
      },
    },
  ],
  restaurant: [
    {
      id: "cafe-reserva",
      prompt: "Cuando alguien reserve una mesa, confirmarle la reserva por WhatsApp.",
      reply:
        "Te propongo **«Reserva de mesa»** con dos pasos en paralelo: un **WhatsApp de confirmación** al cliente con la sede, la hora y el número de personas, y un **aviso al anfitrión** de esa sede.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Confirmación de reservas por WhatsApp",
        description: "El cliente recibe la confirmación por WhatsApp y el anfitrión de la sede se entera.",
        does: ["Se dispara con cada reserva de mesa.", "Le confirma la reserva al cliente por WhatsApp.", "Avisa al anfitrión de la sede."],
        nodes: [T("t", "Reserva de mesa", "calendar", 0), A("a1", "Confirmar por WhatsApp", "whatsapp", 1, -0.65), A("a2", "Avisar al anfitrión", "bell", 1, 0.65)],
        edges: [["t", "a1"], ["t", "a2"]],
        test: {
          t: "Reserva de ejemplo: Daniela Mora · 4 personas · viernes 8:00 p. m.",
          a1: "WhatsApp «Tu mesa en Nova Café Centro está confirmada»",
          a2: "Aviso al anfitrión de la sede Centro",
        },
      },
    },
    {
      id: "cafe-tiempo",
      prompt: "Avisarme cuando un plato pase su tiempo de preparación en cocina.",
      reply:
        "Listo: **«Comanda en preparación»**, una **condición** que compara el tiempo transcurrido con el **tiempo de preparación** de cada plato y, si se pasa, una **alerta** al jefe de cocina y a ti.\n\nSi te sirve, crea el flujo.",
      flow: {
        name: "Alerta de platos demorados",
        description: "Avisa cuando un plato lleva en cocina más de su tiempo de preparación.",
        does: ["Revisa cada comanda mientras está en preparación.", "Sigue solo si un plato superó su tiempo de preparación.", "Alerta al jefe de cocina y a ti."],
        nodes: [T("t", "Comanda en preparación", "bolt", 0), C("c1", "¿Pasó su tiempo?", "branch", 1, 0, "CONDICIÓN"), A("a1", "Alertar a cocina", "bell", 2)],
        edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
        test: {
          t: "Comanda de ejemplo: mesa 7 · hamburguesa Nova",
          c1: "18 min en cocina vs. 12 min de preparación → se pasó",
          a1: "Alerta «Mesa 7: hamburguesa Nova con 6 min de retraso»",
        },
      },
    },
    {
      id: "cafe-cierre",
      prompt: "Todas las noches, enviarme las ventas del día separadas por sede.",
      reply:
        "Armé un flujo **programado a las 11:30 p. m.** que suma las **ventas del día por sede** y te las envía por **correo**.\n\nNo me dijiste qué **sedes** incluir, así que queda en **borrador** hasta que las elijas.",
      flow: {
        name: "Cierre diario de ventas por sede",
        description: "Correo con las ventas del día de cada sede, cada noche.",
        does: ["Corre todos los días a las 11:30 p. m.", "Suma las ventas del día de cada sede.", "Te envía el resumen por correo."],
        pending: [{ node: "Ventas por sede", field: "Sedes", fix: "Centro y Norte", cta: "Incluir sedes Centro y Norte" }],
        nodes: [T("t", "Programado · 11:30 p. m.", "calendar", 0), A("a1", "Ventas por sede", "filter", 1), A("a2", "Enviar correo", "mail", 2)],
        edges: [["t", "a1"], ["a1", "a2"]],
        test: {
          t: "Ejecución manual de prueba",
          a1: "Día de ejemplo: Centro $4.280.000 · Norte $3.150.000",
          a2: "Correo armado con el cierre del día",
        },
      },
    },
    {
      id: "cafe-no",
      prompt: "Cuando un insumo esté por acabarse, pedírselo al proveedor por su app.",
      impossible: {
        reply:
          "Puedo detectar cuando un insumo baja del **mínimo**, pero los flujos todavía **no se conectan con la app de pedidos del proveedor**, así que no puedo hacer el pedido por ti.\n\nMientras tanto, puedo avisarte para que lo pidas tú.",
        falta: "Conexión con la app de pedidos del proveedor",
        alternativa: "Avisarte cuando un insumo baje del mínimo",
        resolved: {
          reply: "¡Ya se puede! Ahora existe la acción **«Pedido al proveedor»**. Te propongo **«Insumo bajo el mínimo»**, pedir la cantidad sugerida en la **app del proveedor** y avisarte.\n\nRevísalo y crea el flujo.",
          flow: {
            name: "Pedido automático de insumos",
            description: "Hace el pedido en la app del proveedor cuando un insumo baja del mínimo.",
            does: ["Se dispara cuando un insumo baja de su stock mínimo.", "Hace el pedido en la app del proveedor.", "Te avisa con el número del pedido."],
            nodes: [T("t", "Insumo bajo el mínimo", "bolt", 0), { ...A("a1", "Pedido al proveedor", "send", 1), isNew: true }, A("a2", "Notificarme", "bell", 2)],
            edges: [["t", "a1"], ["a1", "a2"]],
            test: {
              t: "Insumo de ejemplo: café en grano · quedan 2 kg (mínimo 5 kg)",
              a1: "Pedido simulado de 10 kg",
              a2: "Aviso con el número del pedido",
            },
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
      module: "Café-bar",
      biz: "Nova Café",
      date: "08 oct",
      email: "sede.norte@novacafe.demo",
      pedido: "Cuando un cliente deje una reseña de 2 estrellas o menos, que el gerente de la sede lo llame.",
      falta: "Las reseñas todavía no llegan al sistema como evento",
      alternativa: "Un resumen semanal de reseñas para revisarlas a mano",
      moduleKey: "restaurant",
      resolved: {
        reply: "¡Ya se puede! Ahora existe el disparador **«Reseña recibida»**. Te propongo filtrar las de **2 estrellas o menos** y crear una **tarea de llamada** para el gerente de la sede.\n\nRevísalo y crea el flujo.",
        flow: {
          name: "Llamada a clientes con reseña baja",
          description: "El gerente de la sede llama a cada cliente que deja una reseña de 2 estrellas o menos.",
          does: ["Se dispara con cada reseña recibida.", "Sigue solo si tiene 2 estrellas o menos.", "Crea una tarea de llamada para el gerente de la sede."],
          nodes: [{ ...T("t", "Reseña recibida", "bolt", 0), isNew: true }, C("c1", "¿2 estrellas o menos?", "filter", 1, 0, "FILTRO"), A("a1", "Tarea al gerente", "user", 2)],
          edges: [["t", "c1"], ["c1", "a1", { label: "Sí", color: "#10B981" }]],
          test: {
            t: "Reseña de ejemplo: 2 estrellas · «El café llegó frío»",
            c1: "2 estrellas → sigue",
            a1: "Tarea de llamada para el gerente de la sede Norte",
          },
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

  const chatBox = useRef(null);

  // En escritorio el chat tiene su propio scroll: se baja solo ese, sin mover el resto del modal
  useEffect(() => {
    const box = chatBox.current;
    if (box && box.scrollHeight > box.clientHeight && getComputedStyle(box).overflowY === "auto") box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    else if (st.messages.length) chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    log(`Negocio: ${MODULES[m].biz} (módulo ${MODULES[m].area}) · nueva conversación`);
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
        trigger: f.trigger ?? f.nodes[0].label,
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
        if (n.kind !== "sub") log(`${n.label}: ${st.proposal.ex.flow.test?.[n.id] ?? SIM_STATUS[n.kind]}`);
      }
      const pending = currentFlow?.pending ?? [];
      log(pending.length ? `Falta configurar «${pending[0].field}» en «${pending[0].node}»` : "Prueba completa sin advertencias", pending.length ? "warn" : "ok");
    });

  const turnOn = (flowId) => {
    const f = st.flows.find((y) => y.id === flowId);
    if (f.pending.length) {
      update((x) => (x.showDraft = true));
      log("El flujo está incompleto y todavía no se puede activar", "warn");
      return;
    }
    const was = f.active; // el estado es mutable: se lee antes de cambiarlo
    update((x) => (x.flows.find((y) => y.id === flowId).active = !was));
    log(was ? `Se desactivó «${f.name}»` : `Se activó «${f.name}»`, was ? "warn" : "ok");
  };

  const completePending = (flowId) => {
    const f = st.flows.find((y) => y.id === flowId);
    const p = f.pending[0];
    update((x) => {
      x.flows.find((y) => y.id === flowId).pending = [];
      x.showDraft = false;
    });
    log(`«${p.node}» · ${p.field}: ${p.fix}. Ya no es borrador`, "ok");
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
          biz: MODULES[x.module].biz,
          date: "13 oct",
          email: "admin@grupo-nova.demo",
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
          body: `Por ahora no vamos a construir: "${p.pedido}". Motivo: ${(review.nota || "no aplica por ahora").replace(/\.$/, "")}.`,
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
      x.prefill = { pedido: p.pedido, resolved: p.resolved, moduleLabel: p.biz ?? p.module, id: p.id };
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
          ["peticiones", `Solicitudes · admin (${st.peticiones.filter((p) => ["pendiente", "en_revision"].includes(p.estado)).length})`, "mail"],
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
      <div className={view === "asistente" ? "min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[380px_1fr] lg:overflow-clip" : "hidden"}>
        <section className="flex flex-col border-line lg:min-h-0 lg:border-r">
          <div data-guide="auto-module" className="shrink-0 space-y-2 border-b border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Negocio de Grupo Nova</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(MODULES).map(([k, m]) => (
                <button
                  key={k}
                  disabled={busy}
                  onClick={() => changeModule(k)}
                  className={`flex min-w-0 flex-col items-start rounded-xl border px-2.5 py-1.5 text-left transition disabled:opacity-50 ${st.module === k ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-ink"}`}
                >
                  <span className="flex max-w-full items-center gap-1 text-xs font-semibold">
                    <Icon name={m.icon} className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </span>
                  <span className="block max-w-full truncate text-[10px] opacity-80">{m.biz}</span>
                  <span className="mt-0.5 block max-w-full truncate text-[9px] font-semibold uppercase tracking-wide opacity-60">{m.area}</span>
                </button>
              ))}
            </div>
          </div>

          <div ref={chatBox} className="space-y-3 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {st.messages.length === 0 && (
              <div className="pt-2 text-center">
                <p className="font-display font-bold">¿Qué quieres automatizar en {MODULES[st.module].biz}?</p>
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
                    {MODULES[f.module].biz} · {f.trigger} · {f.runs} ejecuciones
                  </p>
                  {f.pending.length > 0 && (
                    <p className="mt-2 text-[11px] text-[#F59E0B]">
                      «{f.pending[0].node}»: falta completar «{f.pending[0].field}».
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {f.pending.length > 0 ? (
                      <button onClick={() => completePending(f.id)} className="rounded-full border border-line px-3 py-1 text-[11px] transition hover:border-accent hover:text-accent">
                        {f.pending[0].cta}
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
                    {p.date} · {p.biz} · {p.email}
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
            {pending[0].cta}
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

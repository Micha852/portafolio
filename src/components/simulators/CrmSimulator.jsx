"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, MobileTabs, ExecLog, Panel, Row, Badge } from "./ui";

// Demo propia: CRM comercial de "Nova Idiomas", una academia ficticia de Grupo Nova.
// El lead llega por formulario web o por un anuncio de Meta, se reparte en rotación,
// una automatización lo atiende por WhatsApp con IA y el asesor lo lleva por el embudo.
// Todo es ilustrativo: nombres, precios, campañas y textos son inventados.

const COURSES = ["Inglés", "Francés", "Portugués"];
const LEVELS = ["Básico", "Intermedio", "Avanzado"];
const SCHEDULES = ["Mañanas", "Noches", "Sábados"];
const PRICES = { Inglés: 1280000, Francés: 1150000, Portugués: 1090000 };
const money = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const WEB_CAMPAIGN = "Matrículas web · trimestre";

// Anuncios ficticios con formulario instantáneo
const ADS = [
  {
    id: "ig",
    platform: "Instagram",
    campaign: "Inglés para el trabajo",
    headline: "¿Tu próxima entrevista es en inglés?",
    body: "Grupos pequeños en la mañana o en la noche. La primera clase va por nuestra cuenta.",
    lead: { name: "Isabel Cortés", phone: "+57 315 555 0187", course: "Inglés" },
  },
  {
    id: "fb",
    platform: "Facebook",
    campaign: "Francés desde cero",
    headline: "Bonjour! Empieza francés este trimestre",
    body: "Grupos de nivel básico los sábados. Quedan pocos cupos.",
    lead: { name: "Felipe Rojas", phone: "+57 301 555 0123", course: "Francés" },
  },
];

// Equipo comercial de cada campaña y a quién le toca el siguiente lead
const TEAMS = {
  [WEB_CAMPAIGN]: { members: ["Lucía Bernal", "Andrés Mejía", "Tomás Arango"], next: 1 },
  "Inglés para el trabajo": { members: ["Julián Pardo", "Daniela Vélez", "Tomás Arango"], next: 2 },
  "Francés desde cero": { members: ["Renata Salgado", "Esteban Quiroga"], next: 0 },
};

// Embudo de la academia
const STAGES = [
  { name: "Nuevo", color: "#3B82F6" },
  { name: "Contactado", color: "#06B6D4" },
  { name: "Clase de prueba", color: "#8B5CF6" },
  { name: "Propuesta", color: "#F59E0B" },
  { name: "Matriculado", color: "#10B981" },
  { name: "Perdido", color: "#6B7280" },
];
const stageColor = (name) => STAGES.find((s) => s.name === name)?.color ?? "#3B82F6";

// Otras oportunidades del tablero, solo de ambiente
const OTHERS = [
  { name: "Sergio Lara", course: "Portugués básico", stage: "Contactado", owner: "Andrés Mejía" },
  { name: "Lina Castaño", course: "Inglés básico", stage: "Clase de prueba", owner: "Julián Pardo" },
  { name: "Marta Iriarte", course: "Inglés avanzado", stage: "Propuesta", owner: "Daniela Vélez" },
  { name: "Óscar Neira", course: "Francés básico", stage: "Matriculado", owner: "Renata Salgado" },
];

// Pasos de entrada del lead (dentro del CRM)
const INTAKE = {
  receive: { kind: "Entrada", icon: "globe" },
  dedupe: { kind: "Deduplicar", title: "Buscar el contacto por teléfono", icon: "filter" },
  lead: { kind: "Crear", title: "Lead con origen y campaña", icon: "user" },
  assign: { kind: "Reparto", title: "Rotación del equipo de la campaña", icon: "repeat" },
  notify: { kind: "Aviso", title: "Notificar al asesor asignado", icon: "bell" },
};

// Automatización que corre sobre el lead
const NODES = {
  trigger: { kind: "Disparador", title: "Se creó un lead nuevo", icon: "bolt" },
  welcome: { kind: "WhatsApp", title: "Enviar bienvenida con plantilla", icon: "whatsapp" },
  agent: { kind: "Agente IA", title: "Calificar al lead", icon: "sparkles" },
  save: { kind: "Acción", title: "Guardar respuestas en la ficha", icon: "user" },
  cond: { kind: "Condición", title: "¿Pide algo puntual o a una persona?", icon: "branch" },
  handoff: { kind: "Traspaso", title: "Apagar la IA y pasarlo al asesor", icon: "pause" },
};

// Opciones del lead en el chat
const LEVEL_OPTS = [
  { label: "Desde cero, nunca lo he estudiado", v: "Básico" },
  { label: "Me defiendo, pero me trabo al hablar", v: "Intermedio" },
  { label: "Lo hablo bien, quiero pulirlo", v: "Avanzado" },
];
const SCHEDULE_OPTS = [
  { label: "Entre semana, en la mañana", v: "Mañanas" },
  { label: "Entre semana, después del trabajo", v: "Noches" },
  { label: "Solo los sábados", v: "Sábados" },
];
const MORE_OPTS = [
  { label: "¿Hay descuento si pago el trimestre completo?", reason: "pregunta puntual sobre descuentos" },
  { label: "Quiero agendar una clase de prueba", reason: "quiere agendar una clase de prueba" },
  { label: "Prefiero que me atienda una persona", reason: "pidió hablar con una persona" },
];
const HUMAN = "Prefiero hablar con una persona";

// Espacios para la clase de prueba (minutos desde el martes 0:00 de la demo)
const SLOTS = [
  { label: "Jueves 6:00 p. m.", at: 2 * 1440 + 18 * 60 },
  { label: "Sábado 9:00 a. m.", at: 4 * 1440 + 9 * 60 },
];

// Reloj ficticio de la demo
const DAYS = ["mar", "mié", "jue", "vie", "sáb", "dom", "lun"];
function clock(min) {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = String(min % 60).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${DAYS[d % 7]} ${h12}:${m} ${h < 12 ? "a. m." : "p. m."}`;
}
const skippedAgent = (nodes) => nodes.agent === "skipped";
const clamp = (n) => Math.max(0, Math.min(100, n));
const first = (name) => name?.split(" ")[0] ?? "";

// Ritmo de la animación (ms)
const T = { step: 950, think: 1100, beat: 700 };

const initialState = () => ({
  phase: "origen", // origen → chat → asesor → fin
  source: null, // web | meta
  adId: "ig",
  existing: false,
  form: { name: "Mateo Herrera", phone: "+57 310 555 0142", course: "Inglés", level: "Intermedio", schedule: "Noches" },
  payload: null,
  intake: Object.fromEntries(Object.keys(INTAKE).map((k) => [k, "idle"])),
  rotation: Object.fromEntries(Object.entries(TEAMS).map(([k, t]) => [k, t.next])),
  assignedIdx: null,
  contact: null,
  lead: null,
  opp: null,
  quote: null,
  ai: true,
  nodes: Object.fromEntries(Object.keys(NODES).map((k) => [k, "idle"])),
  branch: null,
  captured: {},
  messages: [],
  typing: null,
  step: null,
  repliedFast: false,
  slot: null,
  activities: [],
  health: 0,
  signals: [],
  timeline: [],
  notifications: [],
  log: [],
  clock: 9 * 60 + 12,
});

export default function CrmSimulator() {
  const { st, update, reset, sequence, busy } = useSim(initialState);
  const [tab, setTab] = useState("accion"); // pestañas en móvil
  const [view, setView] = useState("entrada"); // vista central
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [st.messages.length, st.typing]);

  const restart = () => {
    reset();
    setView("entrada");
    setTab("accion");
  };

  // Ayudas para mutar el estado
  const log = (msg, tone) => update((x) => x.log.push({ msg, tone, id: x.log.length }));
  const notify = (to, msg) => update((x) => x.notifications.unshift({ to, msg, t: clock(x.clock), id: x.notifications.length }));
  const event = (text, icon = "check") => update((x) => x.timeline.push({ text, icon, t: clock(x.clock), id: x.timeline.length }));
  const signal = (text, delta) =>
    update((x) => {
      x.signals.unshift({ text, delta, id: x.signals.length });
      x.health = clamp(x.health + delta);
    });
  const tick = (min) => update((x) => (x.clock += min));
  const say = (from, text) => update((x) => x.messages.push({ from, text, id: x.messages.length }));
  const setStep = (step) => update((x) => (x.step = step));
  const owner = () => st.lead?.owner;

  const typeAs = async (wait, who, ms = T.think) => {
    update((x) => (x.typing = who));
    await wait(ms);
    update((x) => (x.typing = null));
  };
  const runIntake = async (wait, key, ms = T.step) => {
    update((x) => (x.intake[key] = "active"));
    await wait(ms);
    update((x) => (x.intake[key] = "done"));
  };
  const runNode = async (wait, key, ms = T.step) => {
    update((x) => (x.nodes[key] = "active"));
    await wait(ms);
    update((x) => (x.nodes[key] = "done"));
  };
  const move = (stage) => {
    const from = st.opp.stage;
    update((x) => {
      x.opp.stage = stage;
      x.opp.history.push(stage);
    });
    log(`Oportunidad: ${from} → ${stage}`, stage === "Perdido" ? "warn" : stage === "Matriculado" ? "ok" : undefined);
    event(`Etapa: ${stage}`, "arrow");
  };

  // ── Etapa 1: llega el lead ──────────────────────────────────────────────
  const submitLead = () =>
    sequence(async (wait) => {
      const web = st.source === "web";
      const ad = ADS.find((a) => a.id === st.adId);
      const data = web ? { ...st.form } : { ...ad.lead, level: null, schedule: null };
      const campaign = web ? WEB_CAMPAIGN : ad.campaign;
      const origin = web ? "Formulario web" : `Anuncio de ${ad.platform}`;
      setView("entrada");
      update((x) => {
        x.phase = "entrada";
        x.payload = web
          ? [
              ["nombre", data.name],
              ["teléfono", data.phone],
              ["curso", data.course],
              ["nivel", data.level],
              ["horario", data.schedule],
            ]
          : [
              ["plataforma", ad.platform],
              ["anuncio", ad.headline],
              ["nombre", data.name],
              ["teléfono", data.phone],
              ["curso", data.course],
            ];
      });

      // 1. Recepción
      update((x) => (x.intake.receive = "active"));
      if (web) {
        log("Formulario público de la academia recibido (5 campos)");
      } else {
        log(`Webhook de Meta Lead Ads recibido · anuncio «${ad.headline}»`);
        await wait(T.beat);
        log("Firma del webhook verificada; se piden a Meta las respuestas del formulario instantáneo");
      }
      await wait(T.step);
      update((x) => (x.intake.receive = "done"));

      // 2. Deduplicación
      update((x) => (x.intake.dedupe = "active"));
      log(`Teléfono normalizado: ${data.phone} · buscando coincidencias…`);
      await wait(T.step);
      update((x) => {
        x.intake.dedupe = "done";
        x.contact = {
          name: data.name,
          phone: data.phone,
          type: "Prospecto",
          since: x.existing ? "Desde marzo · consultó por precios" : "Nuevo hoy",
          reused: x.existing,
        };
        x.health = x.existing ? 40 : 50;
      });
      if (st.existing) {
        update((x) => x.timeline.push({ text: "Contacto creado (consulta antigua)", icon: "user", t: "14 de marzo", id: x.timeline.length }));
        log("Ya existía un contacto con ese teléfono: se reutiliza y se completan sus datos (no se duplica)", "warn");
      } else {
        log("Sin coincidencias: se crea un contacto nuevo");
        event("Contacto creado", "user");
      }

      // 3. Lead
      await runIntake(wait, "lead");
      update((x) => {
        x.lead = { source: origin, campaign, owner: null, course: data.course, level: data.level, schedule: data.schedule };
      });
      log(`Lead creado · origen ${origin} · campaña «${campaign}»`, "ok");
      event(`Lead desde ${origin}`, web ? "globe" : "megaphone");
      signal(web ? "Llenó el formulario completo" : "Llegó por un anuncio pagado", web ? 10 : 5);

      // 4. Reparto en rotación
      update((x) => (x.intake.assign = "active"));
      const team = TEAMS[campaign].members;
      const idx = st.rotation[campaign];
      log(`Equipo de «${campaign}»: ${team.join(", ")}`);
      await wait(T.step);
      update((x) => {
        x.assignedIdx = idx;
        x.rotation[campaign] = (idx + 1) % team.length;
        x.lead.owner = team[idx];
        x.intake.assign = "done";
      });
      log(`Turno rotativo: le toca a ${team[idx]} · el siguiente lead será para ${team[(idx + 1) % team.length]}`, "ok");
      event(`Asignado a ${team[idx]}`, "users");

      // 5. Notificación
      await runIntake(wait, "notify", T.step * 0.8);
      notify(team[idx], `Lead nuevo: ${data.name} (${data.course}) · ${origin}`);
      log(`Notificación enviada a ${team[idx]} (en la app y por correo)`);
      await wait(T.beat);

      // Se dispara la automatización
      log("Se dispara la automatización «Atención por WhatsApp con IA»", "ok");
      setView("flujo");
      update((x) => (x.phase = "chat"));
      await runNode(wait, "trigger");
      update((x) => (x.nodes.welcome = "active"));
      await typeAs(wait, "Asistente IA", T.think);
      say(
        "bot",
        `¡Hola, ${first(data.name)}! 👋 Soy el asistente virtual de Nova Idiomas. Vimos que te interesa ${data.course.toLowerCase()}. ¿Te hago dos preguntas rápidas para recomendarte el grupo ideal?`
      );
      update((x) => (x.nodes.welcome = "done"));
      log("WhatsApp: bienvenida enviada con plantilla aprobada (la conversación la inicia la academia)");
      event("WhatsApp de bienvenida", "whatsapp");
      tick(2);
      setStep("welcome");
    });

  // ── Etapa 2: la automatización conversa con el lead ─────────────────────
  // Cada mensaje del lead pasa por la condición de traspaso
  const leadSays = async (wait, text) => {
    say("lead", text);
    update((x) => {
      x.step = null;
      x.branch = null;
      x.nodes.cond = "idle";
      x.nodes.handoff = "idle";
    });
    if (!st.repliedFast) {
      update((x) => (x.repliedFast = true));
      signal("Respondió en menos de 5 min", 15);
      log("Señal comercial: el lead respondió en menos de 5 minutos");
    }
    tick(1);
    await wait(T.beat);
  };

  const evaluate = async (wait, wantsHuman) => {
    await runNode(wait, "cond", T.step * 0.8);
    update((x) => (x.branch = wantsHuman ? "si" : "no"));
    if (!wantsHuman) log("Condición de traspaso: no aplica, la IA sigue atendiendo");
  };

  const handoff = (text, reason) =>
    sequence(async (wait) => {
      await leadSays(wait, text);
      setView("flujo");
      await evaluate(wait, true);
      log(`Condición de traspaso: sí (${reason})`, "warn");
      await typeAs(wait, "Asistente IA");
      say(
        "bot",
        reason.startsWith("pidió")
          ? `¡Claro! Te paso con ${first(owner())}, de nuestro equipo. Ya tiene tus datos y lo que hablamos 🙌`
          : `¡Buena pregunta! Eso te lo resuelve mejor ${first(owner())}, de nuestro equipo. Ya le pasé la conversación con todo lo que me contaste 🙌`
      );
      // Si el traspaso llega antes de calificar, esos pasos quedan sin ejecutar
      update((x) =>
        ["agent", "save"].forEach((k) => {
          if (x.nodes[k] === "idle") x.nodes[k] = "skipped";
          if (x.nodes[k] === "active") x.nodes[k] = "done";
        })
      );
      if (skippedAgent(st.nodes)) log("La calificación de la IA queda pendiente: la completa el asesor");
      await runNode(wait, "handoff");
      update((x) => {
        x.ai = false;
        x.messages.push({ from: "system", text: `La IA se apagó en esta conversación · ahora atiende ${x.lead.owner}`, id: x.messages.length });
      });
      log("IA apagada solo para esta conversación; las demás siguen con el asistente", "warn");
      notify(owner(), `${st.contact.name} ${reason}. La conversación es tuya.`);
      log(`Notificación de traspaso a ${owner()}`);
      event("Traspaso al asesor", "pause");
      signal("Pidió atención de una persona", 5);
      await wait(T.beat);

      // Lead calificado → oportunidad
      const level = st.lead.level ?? "Intermedio";
      const name = `${st.lead.course} ${level.toLowerCase()} · trimestre`;
      update((x) => {
        x.opp = { name, value: PRICES[x.lead.course], stage: "Nuevo", history: ["Nuevo"] };
        x.phase = "asesor";
      });
      log(`Oportunidad creada: ${name} · ${money(PRICES[st.lead.course])} · etapa Nuevo`, "ok");
      event("Oportunidad creada", "bolt");
      setView("embudo");
      setStep("take");
    });

  const answerWelcome = () =>
    sequence(async (wait) => {
      await leadSays(wait, "¡Claro, dale!");
      await evaluate(wait, false);
      update((x) => (x.nodes.agent = "active"));
      await typeAs(wait, "Asistente IA");
      const lc = st.lead.course.toLowerCase();
      say(
        "bot",
        st.lead.level
          ? `En el formulario marcaste nivel ${st.lead.level.toLowerCase()}. Para ubicarte bien: ¿cómo te va hoy con el ${lc}?`
          : `Para recomendarte el grupo correcto: ¿cómo te va hoy con el ${lc}?`
      );
      log("Agente IA: primera pregunta de calificación (nivel)");
      setStep("level");
    });

  const answerLevel = (o) =>
    sequence(async (wait) => {
      await leadSays(wait, o.label);
      await evaluate(wait, false);
      update((x) => {
        x.nodes.agent = "active";
        x.captured.level = true;
      });
      log(`Agente IA: interpreta la respuesta → nivel ${o.v}`);
      await runNode(wait, "save", T.step * 0.7);
      update((x) => {
        x.lead.level = o.v;
        x.nodes.agent = "active";
      });
      log("Ficha actualizada: nivel");
      await typeAs(wait, "Asistente IA");
      say("bot", "¡Genial! ¿Y qué horario te queda mejor para tus clases?");
      setStep("schedule");
    });

  const answerSchedule = (o) =>
    sequence(async (wait) => {
      await leadSays(wait, o.label);
      await evaluate(wait, false);
      update((x) => {
        x.nodes.agent = "active";
        x.captured.schedule = true;
      });
      log(`Agente IA: interpreta la respuesta → horario ${o.v}`);
      await runNode(wait, "save", T.step * 0.7);
      update((x) => {
        x.lead.schedule = o.v;
        x.nodes.agent = "done";
      });
      log("Ficha actualizada: horario · lead calificado por la IA", "ok");
      event("Calificado por la IA", "sparkles");
      signal("Calificado: nivel y horario", 10);
      await typeAs(wait, "Asistente IA");
      say(
        "bot",
        `Perfecto. Te recomiendo ${st.lead.course} ${st.lead.level.toLowerCase()} en horario de ${o.v.toLowerCase()}. El próximo trimestre arranca el 3 de noviembre. ¿Te ayudo con algo más?`
      );
      setStep("more");
    });

  // ── Etapa 3: el asesor lleva la oportunidad por el embudo ───────────────
  const take = () =>
    sequence(async (wait) => {
      update((x) => (x.step = null));
      setView("embudo");
      tick(4);
      if (!st.lead.level || !st.lead.schedule) {
        update((x) => {
          x.lead.level = x.lead.level ?? "Intermedio";
          x.lead.schedule = x.lead.schedule ?? "Noches";
        });
        log("El asesor completa en la ficha el nivel y el horario que la IA no alcanzó a preguntar");
      }
      await typeAs(wait, owner());
      say(
        "advisor",
        `¡Hola, ${first(st.contact.name)}! Soy ${first(owner())}, tu asesor(a) en Nova Idiomas. Ya leí tu conversación. ¿Te parece si primero tomas una clase de prueba gratis? Tengo el jueves a las 6:00 p. m. o el sábado a las 9:00 a. m.`
      );
      move("Contactado");
      update((x) => x.activities.push({ id: "contacto", title: "Primer contacto por WhatsApp", when: clock(x.clock), done: true }));
      setStep("slot");
    });

  const pickSlot = (slot) =>
    sequence(async (wait) => {
      say("lead", `Me sirve el ${slot.label.toLowerCase()}`);
      update((x) => {
        x.step = null;
        x.slot = slot;
      });
      tick(3);
      await wait(T.beat);
      log(`El lead eligió ${slot.label}`);
      setStep("schedule");
    });

  const scheduleClass = () =>
    sequence(async (wait) => {
      const slot = st.slot;
      update((x) => {
        x.step = null;
        x.activities = x.activities.filter((a) => a.id !== "clase");
        x.activities.push({ id: "clase", title: `Clase de prueba · ${x.lead.course}`, when: slot.label, reminder: "1 h antes", done: false });
      });
      log(`Actividad creada: clase de prueba · ${slot.label} · responsable ${owner()}`, "ok");
      await wait(T.beat);
      log("Recordatorio programado: 1 hora antes, al asesor (app) y al lead (WhatsApp)");
      event(`Clase de prueba agendada (${slot.label})`, "calendar");
      if (st.opp.stage !== "Clase de prueba") move("Clase de prueba");
      signal("Agendó clase de prueba", 10);
      await typeAs(wait, owner());
      say("advisor", `¡Listo! ✅ Quedaste en la clase de prueba del ${slot.label.toLowerCase()} en la sede Chapinero. Te mando un recordatorio una hora antes.`);
      setStep("classday");
    });

  const classDay = () =>
    sequence(async (wait) => {
      update((x) => {
        x.step = null;
        x.clock = Math.max(x.clock, x.slot.at - 60);
      });
      log(`Reloj de la demo: ${clock(st.slot.at - 60)}`);
      await wait(T.beat);
      notify(owner(), `Recordatorio: clase de prueba con ${st.contact.name} en 1 hora`);
      log("Recordatorio disparado al asesor", "ok");
      await wait(T.beat);
      say("system", "Mensaje automático de recordatorio");
      say("bot", `Hola, ${first(st.contact.name)} 👋 Te recordamos tu clase de prueba de hoy a las ${st.slot.label.split(" ").slice(1).join(" ")} ¡Te esperamos!`);
      log("Recordatorio enviado al lead por WhatsApp (no reactiva la IA)");
      event("Recordatorio enviado", "bell");
      tick(90);
      setStep("attend");
    });

  const attend = (yes) =>
    sequence(async (wait) => {
      update((x) => {
        x.step = null;
        const a = x.activities.find((a) => a.id === "clase");
        if (a) {
          a.done = true;
          a.result = yes ? "Asistió" : "No asistió";
        }
      });
      if (yes) {
        log("Actividad cerrada: el lead asistió a la clase de prueba", "ok");
        event("Asistió a la clase de prueba", "check");
        signal("Asistió a la clase de prueba", 10);
        setStep("quote");
      } else {
        log("Actividad cerrada: el lead no asistió", "warn");
        event("No asistió a la clase", "close");
        signal("No asistió a la clase", -15);
        await typeAs(wait, owner());
        say("advisor", `Hola, ${first(st.contact.name)}, hoy no te vimos en la clase. ¿Quieres que la pasemos para el sábado a las 9:00 a. m.?`);
        setStep("resched");
      }
    });

  const reschedule = (yes) =>
    sequence(async (wait) => {
      if (!yes) {
        say("lead", "Gracias, pero ya no me interesa");
        update((x) => (x.step = null));
        await wait(T.beat);
        await lose(wait, "Sin interés");
        return;
      }
      say("lead", "¡Sí, perdón! El sábado me queda perfecto");
      update((x) => {
        x.step = null;
        x.slot = SLOTS[1];
      });
      tick(5);
      await wait(T.beat);
      log("El asesor reprograma la clase de prueba");
      setStep("schedule");
    });

  const sendQuote = () =>
    sequence(async (wait) => {
      update((x) => {
        x.step = null;
        x.quote = { id: "COT-2048", name: x.opp.name, value: x.opp.value, status: "Enviada" };
      });
      tick(30);
      log(`Cotización COT-2048 generada desde la oportunidad: ${st.opp.name} · ${money(st.opp.value)}`);
      move("Propuesta");
      await typeAs(wait, owner());
      say(
        "advisor",
        `¡Qué bueno que te gustó la clase! 🎉 Te comparto la propuesta COT-2048: ${st.opp.name}, ${money(st.opp.value)}. Incluye el material y es válida por 15 días.`
      );
      log("Propuesta enviada por WhatsApp con enlace para aceptarla");
      event("Propuesta enviada", "send");
      signal("Recibió la propuesta", 5);
      setStep("decide");
    });

  const decide = (choice) =>
    sequence(async (wait) => {
      update((x) => (x.step = null));
      if (choice === "think") {
        say("lead", "Déjame pensarlo y te aviso");
        tick(10);
        await wait(T.beat);
        log("El lead pidió tiempo para pensarlo");
        setStep("idle");
        return;
      }
      if (choice === "no") {
        say("lead", "Por ahora no me alcanza el presupuesto, gracias");
        await wait(T.beat);
        await lose(wait, "Presupuesto");
        return;
      }
      say("lead", "¡Acepto! Quiero matricularme 🙌");
      tick(5);
      await wait(T.beat);
      update((x) => (x.quote.status = "Aceptada"));
      log("Cotización COT-2048 aceptada por el lead", "ok");
      event("Propuesta aceptada", "check");
      await wait(T.beat);
      move("Matriculado");
      await wait(T.beat);
      update((x) => (x.contact.type = "Estudiante"));
      log("El contacto pasó de Prospecto a Estudiante (cliente)", "ok");
      event("Ahora es Estudiante", "user");
      signal("Aceptó la propuesta", 25);
      notify("Coordinación académica", `Matrícula nueva: ${st.contact.name} · ${st.opp.name}`);
      log("Aviso a coordinación académica para asignar grupo");
      await typeAs(wait, owner());
      say("advisor", `¡Bienvenido(a) a Nova Idiomas, ${first(st.contact.name)}! 🎉 En un momento te llegan el enlace de pago y tu horario de clases.`);
      update((x) => {
        x.phase = "fin";
        x.step = "done";
      });
    });

  const letWeekPass = () =>
    sequence(async (wait) => {
      update((x) => {
        x.step = null;
        x.clock += 7 * 1440;
      });
      log(`Reloj de la demo: ${clock(st.clock)} (pasaron 7 días)`);
      await wait(T.beat);
      signal("Sin actividad 7 días", -20);
      log("Señal comercial: oportunidad sin actividad 7 días", "warn");
      update((x) => x.activities.push({ id: "seguimiento", title: "Hacer seguimiento a la propuesta", when: clock(x.clock), done: false }));
      notify(owner(), `Alerta: ${st.contact.name} lleva 7 días sin actividad. Se creó una tarea de seguimiento.`);
      log(`Tarea de seguimiento creada para ${owner()}`);
      event("Alerta: 7 días sin actividad", "bell");
      setStep("followup");
    });

  const followUp = () =>
    sequence(async (wait) => {
      update((x) => {
        x.step = null;
        const a = x.activities.find((a) => a.id === "seguimiento");
        if (a) a.done = true;
      });
      await typeAs(wait, owner());
      say("advisor", `Hola, ${first(st.contact.name)}, ¿pudiste pensarlo? Al grupo de ${st.lead.schedule.toLowerCase()} le quedan 3 cupos para este trimestre.`);
      log("Seguimiento hecho; tarea cerrada");
      event("Seguimiento por WhatsApp", "whatsapp");
      signal("Retomó el contacto", 5);
      setStep("decide2");
    });

  const lose = async (wait, reason) => {
    update((x) => (x.opp.lostReason = reason));
    if (st.quote) update((x) => (x.quote.status = "Rechazada"));
    move("Perdido");
    log(`Oportunidad perdida · motivo: ${reason}`, "warn");
    signal("Oportunidad perdida", -Math.max(15, st.health - 20));
    update((x) => x.activities.push({ id: "recontacto", title: "Volver a escribirle", when: "en 60 días", done: false }));
    log("Se programa una actividad para volver a escribirle en 60 días");
    await typeAs(wait, owner());
    say("advisor", "Entiendo, gracias por contarme. Te escribo más adelante por si quieres retomarlo. ¡Éxitos!");
    update((x) => {
      x.phase = "fin";
      x.step = "done";
    });
  };

  // ── Opciones disponibles según el momento ──────────────────────────────
  const role = ["welcome", "level", "schedule", "more", "slot", "resched", "decide", "decide2"].includes(st.step) ? "lead" : "advisor";
  let options = [];
  if (!busy) {
    switch (st.step) {
      case "welcome":
        options = [
          { label: "¡Claro, dale!", run: answerWelcome },
          { label: HUMAN, run: () => handoff(HUMAN, "pidió hablar con una persona") },
        ];
        break;
      case "level":
        options = [...LEVEL_OPTS.map((o) => ({ label: o.label, run: () => answerLevel(o) })), { label: HUMAN, run: () => handoff(HUMAN, "pidió hablar con una persona") }];
        break;
      case "schedule":
        options = [...SCHEDULE_OPTS.map((o) => ({ label: o.label, run: () => answerSchedule(o) })), { label: HUMAN, run: () => handoff(HUMAN, "pidió hablar con una persona") }];
        break;
      case "more":
        options = MORE_OPTS.map((o) => ({ label: o.label, run: () => handoff(o.label, o.reason) }));
        break;
      case "take":
        options = [{ label: "Tomar la conversación y escribirle", run: take, icon: "whatsapp" }];
        break;
      case "slot":
        options = SLOTS.map((sl) => ({ label: `Me sirve el ${sl.label.toLowerCase()}`, run: () => pickSlot(sl) }));
        break;
      case "classday":
        options = [{ label: "Avanzar al día de la clase", run: classDay, icon: "play" }];
        break;
      case "attend":
        options = [
          { label: "Asistió a la clase", run: () => attend(true), icon: "check" },
          { label: "No asistió", run: () => attend(false), icon: "close", muted: true },
        ];
        break;
      case "resched":
        options = [
          { label: "¡Sí, el sábado me sirve!", run: () => reschedule(true) },
          { label: "Ya no me interesa", run: () => reschedule(false) },
        ];
        break;
      case "quote":
        options = [{ label: `Enviar propuesta · ${st.opp?.name}`, run: sendQuote, icon: "send" }];
        break;
      case "decide":
        options = [
          { label: "¡Acepto! Quiero matricularme", run: () => decide("yes") },
          { label: "Déjame pensarlo", run: () => decide("think") },
          { label: "Por ahora no, gracias", run: () => decide("no") },
        ];
        break;
      case "idle":
        options = [{ label: "Dejar pasar 7 días sin respuesta", run: letWeekPass, icon: "calendar" }];
        break;
      case "followup":
        options = [{ label: "Hacer seguimiento por WhatsApp", run: followUp, icon: "whatsapp" }];
        break;
      case "decide2":
        options = [
          { label: "¡Sí, me matriculo!", run: () => decide("yes") },
          { label: "No, gracias", run: () => decide("no") },
        ];
        break;
      default:
        break;
    }
    // "schedule" se usa en el chat (horario) y en el embudo (agendar clase): se distingue por la fase
    if (st.step === "schedule" && st.phase === "asesor") {
      options = [{ label: `Agendar clase de prueba · ${st.slot?.label}`, run: scheduleClass, icon: "calendar" }];
    }
  }
  const actingRole = st.step === "schedule" && st.phase === "asesor" ? "advisor" : role;

  const pane = (k) => (tab === k ? "flex" : "hidden lg:flex");
  const phaseIdx = { origen: 0, entrada: 0, chat: 1, asesor: 2, fin: 2 }[st.phase];

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera del CRM */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 font-display text-sm font-bold text-accent">N</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Nova Idiomas · CRM comercial</p>
          <p className="truncate text-[11px] text-muted">Grupo Nova · academia de idiomas</p>
        </div>
        <ol className="ml-auto hidden items-center gap-1 sm:flex">
          {["Llega el lead", "Automatización", "Embudo"].map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                i === phaseIdx ? "bg-accent/15 text-accent" : i < phaseIdx ? "text-accent/70" : "text-muted"
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${i <= phaseIdx ? "bg-accent text-bg" : "bg-line"}`}>
                {i < phaseIdx ? "✓" : i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
        <button
          onClick={restart}
          title="Reiniciar"
          aria-label="Reiniciar simulación"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent sm:ml-2"
        >
          <Icon name="refresh" className="h-4 w-4" />
        </button>
      </div>

      <MobileTabs
        tabs={[
          ["accion", "Acción"],
          ["proceso", "Proceso"],
          ["ficha", "Ficha"],
        ]}
        tab={tab}
        setTab={setTab}
        pulse={busy ? "proceso" : null}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[330px_1fr_290px]">
        {/* Columna de acción: origen del lead o chat de WhatsApp */}
        <section data-guide="crm-actions" className={`${pane("accion")} min-h-0 flex-col border-line lg:border-r`}>
          {st.phase === "origen" || (st.phase === "entrada" && st.messages.length === 0) ? (
            <SourcePicker st={st} update={update} busy={busy} onSubmit={submitLead} />
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <Icon name="whatsapp" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{st.contact?.name}</p>
                  <p className={`truncate text-xs ${st.ai ? "text-accent" : "text-warm"}`}>
                    {st.ai ? "Asistente IA activo" : `Atiende ${st.lead?.owner}`}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-bg/60 p-4">
                {st.messages.map((m) =>
                  m.from === "system" ? (
                    <p key={m.id} className="mx-auto w-fit max-w-[90%] rounded-full bg-line/60 px-3 py-1 text-center text-[11px] text-muted">
                      {m.text}
                    </p>
                  ) : (
                    <div key={m.id} className={`flex ${m.from === "lead" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%] animate-pop">
                        {m.from !== "lead" && (
                          <p className={`mb-0.5 px-1 text-[10px] font-semibold ${m.from === "bot" ? "text-accent" : "text-warm"}`}>
                            {m.from === "bot" ? "Asistente IA · automatización" : `${st.lead?.owner} · asesor(a)`}
                          </p>
                        )}
                        <p
                          className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                            m.from === "lead" ? "rounded-br-sm bg-accent text-bg" : "rounded-bl-sm border border-line bg-surface"
                          }`}
                        >
                          {m.text}
                        </p>
                      </div>
                    </div>
                  )
                )}
                {st.typing && (
                  <div className="flex justify-start">
                    <p className="rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-2 text-xs text-muted">{st.typing} está escribiendo…</p>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              {/* Opciones: el usuario juega como lead o como asesor */}
              <div data-guide="crm-choices" className="max-h-[45%] shrink-0 overflow-y-auto border-t border-line px-3 py-2.5">
                {options.length > 0 && (
                  <>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                      <Icon name={actingRole === "lead" ? "user" : "users"} className="h-3 w-3" />
                      {actingRole === "lead" ? "Juegas como el lead" : `Juegas como ${st.lead?.owner} (asesor)`}
                    </p>
                    {actingRole === "lead" ? (
                      <div className="flex flex-wrap gap-2">
                        {options.map((o) => (
                          <button
                            key={o.label}
                            onClick={o.run}
                            className="rounded-full border border-accent/40 px-3 py-1 text-left text-xs text-accent transition hover:bg-accent/10"
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {options.map((o) => (
                          <button
                            key={o.label}
                            onClick={o.run}
                            className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                              o.muted ? "border border-line text-muted hover:border-warm hover:text-warm" : "bg-warm text-bg hover:brightness-110"
                            }`}
                          >
                            {o.icon && <Icon name={o.icon} className="h-3.5 w-3.5" />}
                            <span className="truncate">{o.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {st.phase === "fin" && !busy && (
                  <button
                    onClick={restart}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110"
                  >
                    <Icon name="refresh" className="h-3.5 w-3.5" />
                    Probar otro camino
                  </button>
                )}
                {busy && <p className="py-1 text-center text-xs text-muted">Mira cómo se mueve el proceso…</p>}
              </div>
            </>
          )}
        </section>

        {/* Proceso: entrada, automatización y embudo */}
        <section data-guide="crm-process" className={`${pane("proceso")} min-h-0 flex-col`}>
          <div data-guide="crm-views" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 py-2">
            {[
              ["entrada", "Entrada", "filter"],
              ["flujo", "Automatización", "bolt"],
              ["embudo", "Embudo", "grid"],
            ].map(([k, label, icon]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  view === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name={icon} className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div key={`view-${tab}`} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {view === "entrada" && <IntakeView st={st} />}
            {view === "flujo" && <FlowView st={st} />}
            {view === "embudo" && <PipelineView st={st} />}
          </div>

          <ExecLog key={`log-${tab}`} log={st.log} empty="Elige por dónde llega el lead…" className="h-32" />
        </section>

        {/* Ficha del contacto */}
        <section data-guide="crm-card" className={`${pane("ficha")} min-h-0 flex-col gap-3 overflow-y-auto border-line p-4 lg:border-l`}>
          <ContactCard st={st} />
        </section>
      </div>
    </div>
  );
}

// ── Elegir el origen del lead ─────────────────────────────────────────────
function SourcePicker({ st, update, busy, onSubmit }) {
  const field = "w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm outline-none transition focus:border-accent disabled:opacity-60";
  const set = (k) => (e) => update((x) => (x.form[k] = e.target.value));
  const ad = ADS.find((a) => a.id === st.adId);
  const valid = st.form.name.trim().length > 1 && st.form.phone.trim().length > 6;

  return (
    <div data-guide="crm-source" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">1 · ¿Por dónde llega el lead?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            ["web", "Formulario web", "globe", "La página de la academia"],
            ["meta", "Anuncio de Meta", "megaphone", "Facebook o Instagram"],
          ].map(([k, label, icon, sub]) => (
            <button
              key={k}
              disabled={busy}
              onClick={() => update((x) => (x.source = k))}
              className={`rounded-xl border p-2.5 text-left transition ${
                st.source === k ? "border-accent bg-accent/10" : "border-line hover:border-accent/50"
              }`}
            >
              <Icon name={icon} className={`h-4 w-4 ${st.source === k ? "text-accent" : "text-muted"}`} />
              <p className="mt-1 text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {!st.source && <p className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">Eres un posible estudiante. Elige cómo dejas tus datos.</p>}

      {st.source === "web" && (
        <div className="animate-pop rounded-2xl border border-line bg-surface p-3">
          <p className="text-sm font-semibold">Reserva tu clase de prueba</p>
          <p className="mb-2.5 text-[11px] text-muted">novaidiomas.example · formulario público</p>
          <div className="space-y-2">
            <label className="block text-[11px] text-muted">
              Nombre
              <input className={field} value={st.form.name} onChange={set("name")} disabled={busy} />
            </label>
            <label className="block text-[11px] text-muted">
              Celular
              <input className={field} value={st.form.phone} onChange={set("phone")} disabled={busy} />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["course", "Curso", COURSES],
                ["level", "Nivel", LEVELS],
                ["schedule", "Horario", SCHEDULES],
              ].map(([k, label, list]) => (
                <label key={k} className="block text-[11px] text-muted">
                  {label}
                  <select className={`${field} px-1.5 text-xs`} value={st.form[k]} onChange={set(k)} disabled={busy}>
                    {list.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {st.source === "meta" && (
        <div className="space-y-2">
          {ADS.map((a) => (
            <button
              key={a.id}
              disabled={busy}
              onClick={() => update((x) => (x.adId = a.id))}
              className={`block w-full animate-pop rounded-2xl border p-3 text-left transition ${
                st.adId === a.id ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent/50"
              }`}
            >
              <p className="flex items-center gap-1.5 text-[10px] text-muted">
                <Icon name={a.platform === "Instagram" ? "instagram" : "megaphone"} className="h-3 w-3" />
                Nova Idiomas · Patrocinado · {a.platform}
              </p>
              <p className="mt-1 text-sm font-semibold">{a.headline}</p>
              <p className="text-xs text-muted">{a.body}</p>
              {st.adId === a.id && (
                <div className="mt-2 rounded-lg border border-line bg-bg/60 p-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Formulario instantáneo (precargado)</p>
                  <Row k="Nombre" v={a.lead.name} />
                  <Row k="Celular" v={a.lead.phone} />
                  <Row k="Curso" v={a.lead.course} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {st.source && (
        <>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line p-2.5 text-xs">
            <input
              type="checkbox"
              className="mt-0.5 accent-[rgb(var(--accent))]"
              checked={st.existing}
              disabled={busy}
              onChange={(e) => update((x) => (x.existing = e.target.checked))}
            />
            <span>
              <span className="font-semibold">Este teléfono ya está en el CRM</span>
              <span className="block text-muted">Para ver la deduplicación: no se crea un contacto repetido.</span>
            </span>
          </label>
          <button
            disabled={busy || (st.source === "web" && !valid)}
            onClick={onSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
          >
            <Icon name="send" className="h-4 w-4" />
            {busy ? "Procesando…" : st.source === "web" ? "Enviar formulario" : `Enviar desde el anuncio de ${ad.platform}`}
          </button>
        </>
      )}
    </div>
  );
}

// ── Vista: entrada del lead ───────────────────────────────────────────────
function IntakeView({ st }) {
  const web = st.source === "web";
  const campaign = st.lead?.campaign ?? (st.source === "meta" ? ADS.find((a) => a.id === st.adId).campaign : st.source === "web" ? WEB_CAMPAIGN : null);
  const team = campaign ? TEAMS[campaign].members : null;
  const receiveTitle = !st.source ? "Formulario o anuncio" : web ? "Formulario público recibido" : "Webhook de Meta Lead Ads";
  const details = {
    receive: st.payload ? (web ? "5 campos del sitio web" : "Lead del formulario instantáneo") : null,
    dedupe: st.intake.dedupe === "done" ? (st.contact?.reused ? "Coincidencia: se reutiliza el contacto" : "Sin coincidencias: contacto nuevo") : null,
    lead: st.lead ? `${st.lead.source} · ${st.lead.campaign}` : null,
    assign: st.lead?.owner ? `Le tocó a ${st.lead.owner}` : null,
    notify: st.intake.notify === "done" ? "En la app y por correo" : null,
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Lo que hace el CRM cuando entra un lead</p>
      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
        <div className="flex flex-col">
          {Object.keys(INTAKE).map((k, i) => (
            <div key={k}>
              {i > 0 && <Line on={st.intake[k] !== "idle"} />}
              <Step
                kind={INTAKE[k].kind}
                title={k === "receive" ? receiveTitle : INTAKE[k].title}
                icon={k === "receive" && st.source === "meta" ? "megaphone" : INTAKE[k].icon}
                state={st.intake[k]}
                detail={details[k]}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-bg/40 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Datos recibidos</p>
            {st.payload ? (
              <div className="space-y-0.5 font-mono text-[11px]">
                {st.payload.map(([k, v]) => (
                  <p key={k} className="truncate">
                    <span className="text-muted">{k}:</span> {v}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">Aún no llega nada.</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-bg/40 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Equipo de la campaña</p>
            {team ? (
              <>
                <p className="mb-2 truncate text-[11px] font-semibold">{campaign}</p>
                <ul className="space-y-1">
                  {team.map((m, i) => {
                    const assigned = st.assignedIdx === i && st.lead?.owner === m;
                    const nextUp = st.rotation[campaign] === i;
                    return (
                      <li
                        key={m}
                        className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition ${
                          assigned ? "bg-accent/15 font-semibold text-accent ring-1 ring-accent/50" : "bg-bg/60"
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        {assigned ? (
                          <span className="text-[10px]">asignado</span>
                        ) : nextUp ? (
                          <span className="text-[10px] text-warm">sigue</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="text-xs text-muted">Depende del origen que elijas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vista: automatización ─────────────────────────────────────────────────
function FlowView({ st }) {
  const n = st.nodes;
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Atención por WhatsApp con IA</p>
        <Badge color={st.ai ? "#10B981" : "#F59E0B"}>{st.ai ? "IA activa" : "IA apagada aquí"}</Badge>
      </div>
      {st.phase === "origen" && <p className="mb-3 rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">Esta automatización arranca sola cuando se crea un lead.</p>}
      <div className="flex flex-col">
        <Node id="trigger" state={n.trigger} />
        <Line on={n.welcome !== "idle"} />
        <Node id="welcome" state={n.welcome} />
        <Line on={n.agent !== "idle" && n.agent !== "skipped"} />
        <Node id="agent" state={n.agent}>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              ["level", "Nivel", st.lead?.level],
              ["schedule", "Horario", st.lead?.schedule],
            ].map(([k, label, v]) => (
              <span
                key={k}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                  st.captured[k] ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-muted"
                }`}
              >
                <Icon name={st.captured[k] ? "check" : "sparkles"} className="h-3 w-3" />
                {label}
                {st.captured[k] && v ? `: ${v}` : ""}
              </span>
            ))}
          </div>
        </Node>
        <Line on={n.save !== "idle" && n.save !== "skipped"} />
        <Node id="save" state={n.save} />
        <Line on={n.cond !== "idle"} />
        <Node id="cond" state={n.cond} />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <BranchLabel label="Sí" active={st.branch === "si"} />
            <Node id="handoff" state={n.handoff} compact />
          </div>
          <div className="flex flex-col">
            <BranchLabel label="No" active={st.branch === "no"} />
            <Placeholder active={st.branch === "no"}>La IA sigue la conversación</Placeholder>
          </div>
        </div>
      </div>
      {!st.ai && (
        <p className="mt-4 animate-pop rounded-xl border border-warm/40 bg-warm/10 p-3 text-xs text-warm">
          Desde aquí la conversación es de {st.lead?.owner}. Si el lead escribe, la automatización ya no responde: solo avisa al asesor.
        </p>
      )}
    </div>
  );
}

// ── Vista: embudo ─────────────────────────────────────────────────────────
function PipelineView({ st }) {
  const opp = st.opp;
  return (
    <>
      <p data-guide="crm-pipeline" className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        Embudo de matrículas · trimestre
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const here = opp?.stage === stage.name;
          const others = OTHERS.filter((o) => o.stage === stage.name);
          return (
            <div key={stage.name} className="min-w-0">
              <div className="mb-1.5 flex min-h-[1.75rem] items-end gap-1.5 border-b-2 pb-1" style={{ borderColor: stage.color }}>
                <span className="mb-1 h-2 w-2 shrink-0 rounded-full" style={{ background: stage.color }} />
                <span className="text-[11px] font-semibold leading-tight">{stage.name}</span>
                <span className="ml-auto text-[10px] text-muted">{others.length + (here ? 1 : 0)}</span>
              </div>
              <div className={`min-h-[4.5rem] space-y-1.5 rounded-xl p-1 transition ${here ? "bg-accent/5" : "bg-bg/40"}`}>
                {here && <LeadCard key={stage.name} st={st} color={stage.color} />}
                {others.map((o) => (
                  <div key={o.name} className="rounded-lg border border-line bg-surface/60 p-2 opacity-60">
                    <p className="truncate text-[11px] font-semibold">{o.name}</p>
                    <p className="truncate text-[10px] text-muted">{o.course}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!opp && (
        <p className="mx-auto mt-4 max-w-sm text-center text-xs text-muted">La oportunidad se crea cuando la automatización le pasa el lead calificado al asesor.</p>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg/40 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <Icon name="calendar" className="h-3.5 w-3.5" /> Actividades y recordatorios
          </p>
          {st.activities.length === 0 ? (
            <p className="text-xs text-muted">Sin actividades todavía.</p>
          ) : (
            <ul className="space-y-1.5">
              {st.activities.map((a) => (
                <li key={a.id} className={`flex animate-pop items-start gap-2 rounded-lg border px-2 py-1.5 text-xs ${a.done ? "border-line" : "border-accent/50 bg-accent/5"}`}>
                  <Icon name={a.done ? "check" : "calendar"} className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${a.done ? "text-muted" : "text-accent"}`} />
                  <div className="min-w-0">
                    <p className={`truncate font-semibold ${a.done ? "text-muted line-through decoration-line" : ""}`}>{a.title}</p>
                    <p className="truncate text-[10px] text-muted">
                      {a.when}
                      {a.reminder && !a.done ? ` · recordatorio ${a.reminder}` : ""}
                      {a.result ? ` · ${a.result}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-bg/40 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <Icon name="send" className="h-3.5 w-3.5" /> Cotización
          </p>
          {st.quote ? (
            <div className="animate-pop space-y-1">
              <Row k="Número" v={st.quote.id} />
              <Row k="Concepto" v={st.quote.name} />
              <Row k="Valor" v={money(st.quote.value)} />
              <Row
                k="Estado"
                v={<Badge color={st.quote.status === "Aceptada" ? "#10B981" : st.quote.status === "Rechazada" ? "#6B7280" : "#F59E0B"}>{st.quote.status}</Badge>}
              />
              {st.quote.status === "Aceptada" && <p className="pt-1 text-[11px] text-accent">Al aceptarla, el contacto pasa a Estudiante.</p>}
            </div>
          ) : (
            <p className="text-xs text-muted">Se genera desde la oportunidad después de la clase de prueba.</p>
          )}
        </div>
      </div>
    </>
  );
}

// Tarjeta del lead en el tablero; se deja a la vista cada vez que cambia de columna
function LeadCard({ st, color }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  return (
    <div ref={ref} className="scroll-my-4 animate-pop rounded-lg border-2 bg-surface p-2 shadow-lg" style={{ borderColor: color }}>
      <p className="truncate text-[11px] font-semibold">{st.contact.name}</p>
      <p className="truncate text-[10px] text-muted">{st.opp.name}</p>
      <p className="mt-0.5 text-xs font-bold" style={{ color }}>
        {money(st.opp.value)}
      </p>
      <p className="truncate text-[10px] text-muted">{st.lead.owner}</p>
    </div>
  );
}

// ── Ficha del contacto ────────────────────────────────────────────────────
function ContactCard({ st }) {
  if (!st.contact) {
    return (
      <Panel title="Ficha del contacto" icon="user">
        <p className="text-xs text-muted">Todavía no hay contacto. Aparece en cuanto llega el lead.</p>
      </Panel>
    );
  }
  const h = st.health;
  const hColor = h >= 65 ? "#10B981" : h >= 40 ? "#F59E0B" : "#EF4444";
  const hLabel = h >= 65 ? "Caliente" : h >= 40 ? "Tibio" : "Frío";
  const next = st.activities.find((a) => !a.done);
  return (
    <>
      <div className="animate-pop rounded-2xl border border-line bg-bg/40 p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
            {st.contact.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{st.contact.name}</p>
            <p className="truncate text-[11px] text-muted">{st.contact.phone}</p>
          </div>
          <span className="ml-auto">
            <Badge color={st.contact.type === "Estudiante" ? "#10B981" : "#3B82F6"}>{st.contact.type}</Badge>
          </span>
        </div>
        {st.contact.reused && <p className="mt-2 rounded-lg bg-warm/10 px-2 py-1 text-[11px] text-warm">Contacto existente: no se duplicó</p>}
      </div>

      <Panel title="Origen y responsable" icon="megaphone">
        <Row k="Origen" v={st.lead?.source ?? "—"} />
        <Row k="Campaña" v={st.lead?.campaign ?? "—"} />
        <Row k="Responsable" v={st.lead?.owner ?? <span className="text-muted">Asignando…</span>} />
        <Row k="Curso" v={st.lead?.course ?? "—"} />
        <Row k="Nivel" v={st.lead?.level ?? <span className="text-muted">Por calificar</span>} />
        <Row k="Horario" v={st.lead?.schedule ?? <span className="text-muted">Por calificar</span>} />
        <Row k="Conversación" v={st.ai ? <span className="text-accent">Con IA</span> : <span className="text-warm">Con asesor</span>} />
      </Panel>

      <Panel title="Salud comercial" icon="bolt" guide="crm-health">
        <div className="flex items-end justify-between">
          <p className="font-display text-3xl font-bold transition-colors" style={{ color: hColor }}>
            {h}
          </p>
          <span className="mb-1">
            <Badge color={hColor}>{hLabel}</Badge>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${h}%`, background: hColor }} />
        </div>
        <ul className="space-y-1 pt-1.5">
          {st.signals.slice(0, 6).map((sg) => (
            <li key={sg.id} className="flex animate-pop items-center justify-between gap-2 text-[11px]">
              <span className="truncate">{sg.text}</span>
              <span className={`shrink-0 font-mono font-semibold ${sg.delta >= 0 ? "text-accent" : "text-warm"}`}>
                {sg.delta >= 0 ? `+${sg.delta}` : sg.delta}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {st.opp && (
        <Panel title="Oportunidad" icon="grid">
          <Row k="Curso" v={st.opp.name} />
          <Row k="Valor" v={money(st.opp.value)} />
          <Row k="Etapa" v={<Badge color={stageColor(st.opp.stage)}>{st.opp.stage}</Badge>} />
          {st.opp.lostReason && <Row k="Motivo" v={st.opp.lostReason} />}
          {next && <Row k="Próxima" v={`${next.title} · ${next.when}`} />}
        </Panel>
      )}

      <Panel title="Línea de tiempo" icon="calendar">
        <ol className="relative space-y-1.5 border-l border-line pl-3">
          {[...st.timeline].reverse().map((e) => (
            <li key={e.id} className="relative animate-pop text-[11px]">
              <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-accent" />
              <span className="font-medium">{e.text}</span>
              <span className="block text-[10px] text-muted">{e.t}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Notificaciones" icon="bell">
        {st.notifications.length === 0 ? (
          <p className="text-xs text-muted">Nada por ahora.</p>
        ) : (
          <ul className="space-y-1.5">
            {st.notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="animate-pop rounded-lg bg-bg/70 px-2 py-1.5 text-[11px]">
                <span className="font-semibold text-warm">{n.to}</span> · {n.msg}
                <span className="block text-[10px] text-muted">{n.t}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

// ── Piezas del diagrama ───────────────────────────────────────────────────
const STATE_STYLES = {
  idle: "border-line bg-bg/60",
  active: "border-accent bg-accent/10 ring-4 ring-accent/20",
  done: "border-accent/60 bg-accent/5",
  skipped: "border-dashed border-line opacity-40",
};

function Step({ kind, title, icon, state, detail, compact, children }) {
  const ref = useRef(null);
  // Mantiene a la vista el paso que se está ejecutando
  useEffect(() => {
    if (state === "active") ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state]);
  return (
    <div ref={ref} className={`scroll-my-4 rounded-xl border transition-all duration-500 ${compact ? "p-2.5" : "p-3"} ${STATE_STYLES[state]}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`grid shrink-0 place-items-center rounded-lg transition ${compact ? "h-7 w-7" : "h-8 w-8"} ${
            state === "idle" || state === "skipped" ? "bg-line/60 text-muted" : "bg-accent text-bg"
          }`}
        >
          <Icon name={state === "done" ? "check" : icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{kind}</p>
          <p className={`font-semibold ${compact ? "text-xs" : "truncate text-sm"}`}>{title}</p>
          {detail && <p className="truncate text-[11px] text-accent">{detail}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Node({ id, state, compact, children }) {
  const n = NODES[id];
  return (
    <Step kind={n.kind} title={n.title} icon={n.icon} state={state} compact={compact}>
      {children}
    </Step>
  );
}

function Line({ on }) {
  return <div className={`mx-auto h-4 w-0.5 transition-colors duration-500 ${on ? "bg-accent" : "bg-line"}`} />;
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
      className={`grid flex-1 place-items-center rounded-xl border border-dashed px-2 py-2 text-center text-xs transition ${
        active ? "border-accent/60 text-accent" : "border-line text-muted"
      }`}
    >
      {children}
    </div>
  );
}

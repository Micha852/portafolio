"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Icon } from "../Icons";

// Pasos de la guía de cada simulador: [data-guide, título, descripción]
const GUIDES = {
  crm: [
    ["crm-source", "Elige por dónde llega el lead", "Llena el formulario web de la academia o escoge un anuncio de Facebook o Instagram. Marca la casilla si quieres ver cómo se evita un contacto duplicado."],
    ["crm-views", "Tres vistas del proceso", "Entrada muestra lo que hace el CRM al recibir el lead, Automatización el flujo de WhatsApp con IA y Embudo cómo avanza la oportunidad."],
    ["crm-process", "Mira qué pasa por dentro", "Los pasos se encienden mientras corren y el registro cuenta cada cosa: webhook, deduplicación, rotación, avisos y cambios de etapa."],
    ["crm-actions", "Juegas los dos papeles", "En el chat respondes como el lead; cuando la IA pasa la conversación, tomas las decisiones del asesor: agendar la clase, enviar la propuesta y hacer seguimiento."],
    ["crm-card", "La ficha del contacto", "Origen, campaña, responsable, salud comercial, línea de tiempo y notificaciones del equipo se actualizan con cada acción."],
  ],
  restaurant: [
    ["rest-pasos", "La historia en 6 pasos", "Sedes, reservas, llegada de la mesa, cocina, menú público y cierre del día. Puedes saltar entre pasos cuando quieras; lo que hagas se conserva."],
    ["rest-hint", "Te digo qué hacer", "Esta franja cambia en cada paso con la siguiente acción que te toca."],
    ["rest-plano", "El plano del salón", "Mesas y puestos de la sede activa. Al reservar ves la mesa sugerida, o las mesas unidas para grupos grandes; con la sesión abierta ves de quién es cada mesa."],
    ["rest-etapa", "Aquí trabajas", "Configuras la sede, reservas, tomas el pedido, mueves la cocina, diseñas el menú público y revisas el cierre."],
    ["rest-sistema", "Lo que pasa en el sistema", "Reservas, sesiones con su mesero, avisos y el registro de cada paso, incluida la disponibilidad que cambia en vivo."],
  ],
  ph: [
    ["ph-tabs", "Una historia en siete pasos", "Empieza creando la copropiedad: las unidades y coeficientes que generes son los que usan reservas, cobros, documentos, asamblea y PQRS."],
    ["ph-hint", "Te digo qué hacer", "Esta franja cambia con tu avance y te propone el siguiente paso, incluso probar los casos que el sistema rechaza."],
    ["ph-main", "Interactúa aquí", "Crea torres, abre unidades, reserva zonas, envía recordatorios, sube documentos, vota y responde PQRS."],
    ["ph-system", "Lo que pasa en el sistema", "Registros clave, notificaciones enviadas por correo, WhatsApp o app, y el registro de cada acción."],
  ],
  automations: [
    ["auto-tabs", "Tres vistas", "Aquí cambias entre crear flujos con IA, ver tus flujos y revisar, como admin, las solicitudes de lo que aún no se puede automatizar."],
    ["auto-module", "Elige el negocio", "Cada negocio de Grupo Nova usa un módulo distinto: la academia (CRM), el conjunto (PH) y el café-bar (restaurante)."],
    ["auto-examples", "Pídele un flujo a la IA", "Elige un pedido. Tres se pueden armar (uno queda en borrador porque le falta un dato) y uno todavía no existe: ese lo puedes dejar como solicitud."],
    ["auto-canvas", "Mira el flujo dibujarse", "La IA arma disparadores, condiciones y acciones en el lienzo. Créalo, pruébalo con datos de ejemplo y actívalo."],
  ],
  ai: [
    ["ai-cards", "Un modelo para cada uso", "Cada uso de la IA tiene su proveedor, su modelo y un respaldo. Cámbialos con los chips y usa «Probar» para medir la latencia."],
    ["ai-outage", "Simula una caída", "Activa la caída del proveedor principal y elige el tipo de error. Luego ve al Asistente o al Lector de PDFs: verás responder al respaldo, o un error si no hay respaldo."],
    ["ai-tabs", "Asistente, lector y plantillas", "En el Asistente, un router detecta el área de cada pregunta. En el Lector de PDFs, la primera lista de un proveedor crea la plantilla con IA y las siguientes se leen sin gastar tokens."],
  ],
};

// Primer elemento visible con ese data-guide (algunos simuladores tienen varias vistas montadas)
const visible = (key) => [...document.querySelectorAll(`[role="dialog"] [data-guide="${key}"]`)].find((el) => el.offsetParent !== null);

// Invitación dentro del modal del simulador + guía paso a paso con driver.js
export default function SimulatorGuide({ id }) {
  // mode: "hidden" → "card" (invitación) → "pill" (botón «Guía» tras cerrarla o terminar); "touring" mientras corre
  const [mode, setMode] = useState("hidden");

  useEffect(() => {
    const t = setTimeout(() => setMode((m) => (m === "hidden" ? "card" : m)), 900);
    return () => clearTimeout(t);
  }, []);

  if (!GUIDES[id] || mode === "hidden" || mode === "touring") return null;

  const start = () => {
    setMode("touring");
    driver({
      onDestroyed: () => setMode("pill"),
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente →",
      prevBtnText: "← Atrás",
      doneBtnText: "¡A probar!",
      popoverClass: "tour-popover",
      stagePadding: 4,
      stageRadius: 14,
      steps: GUIDES[id].map(([key, title, description]) => ({
        // Si la zona no está a la vista (p. ej. otra pestaña en móvil), el paso sale centrado
        element: () => visible(key),
        popover: { title, description },
      })),
    }).drive();
  };

  if (mode === "pill") {
    return (
      <button
        onClick={() => setMode("card")}
        aria-label="Abrir la guía del simulador"
        className="fixed bottom-6 right-6 z-[60] inline-flex animate-pop items-center gap-2 rounded-full border border-warm/60 bg-surface px-4 py-2.5 text-sm font-semibold text-warm shadow-xl shadow-black/50 transition hover:-translate-y-0.5 hover:bg-warm hover:text-bg"
      >
        <Icon name="sparkles" className="h-4 w-4" />
        Guía
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-[min(88vw,320px)] animate-heartbeat rounded-2xl border border-warm/60 bg-surface p-4 shadow-2xl shadow-black/50 hover:[animation-play-state:paused]">
      <div className="flex items-start gap-3">
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warm/15 text-warm">
          <span className="absolute inset-0 animate-ping rounded-xl bg-warm/25" />
          <Icon name="sparkles" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">¿Te guío en el simulador?</p>
          <p className="mt-0.5 text-xs text-muted">Te muestro por dónde empezar y qué mirar en cada parte.</p>
        </div>
        <button onClick={() => setMode("pill")} aria-label="Cerrar" className="-mr-2 -mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-bg/70 text-ink transition hover:border-accent hover:text-accent">
          <Icon name="close" className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={start} className="flex-1 rounded-full bg-warm px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110">
          Sí, guíame
        </button>
        <button onClick={() => setMode("pill")} className="rounded-full border border-line px-4 py-2 text-xs transition hover:border-accent hover:text-accent">
          Ahora no
        </button>
      </div>
    </div>
  );
}

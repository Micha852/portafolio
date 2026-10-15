"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Icon } from "../Icons";

// Pasos de la guía de cada simulador: [data-guide, título, descripción]
const GUIDES = {
  crm: [
    ["crm-choices", "Empieza aquí", "Eres un cliente que vio un anuncio. Elige qué le escribes al equipo: con cada mensaje corre el flujo."],
    ["crm-flow", "El flujo en vivo", "Mira cómo se ilumina cada paso: reparto por turnos, la asistente IA «Ana» con su agenda y el paso a un asesor."],
    ["crm-views", "Flujo o embudo", "Cuando el asesor toma la conversación, cambia al embudo de ventas para ver la oportunidad avanzar hasta ganarse o perderse."],
    ["crm-panel", "Lo que guarda el CRM", "Aquí aparecen el contacto, el lead, la oportunidad y las notificaciones que recibe el equipo."],
  ],
  restaurant: [
    ["rest-hint", "Te digo qué hacer", "Esta franja cambia en cada paso con la siguiente acción."],
    ["rest-mesero", "Eres el mesero", "Elige una mesa libre, arma platos con variantes, adiciones y notas, y envíalos a preparación."],
    ["rest-cocina", "Ahora eres la cocina", "Los pedidos llegan por estación. Márcalos «Preparando» y luego «¡Listo!»; mira el cronómetro."],
    ["rest-sistema", "Lo que pasa por dentro", "Pedido impreso, consumo de recetas, factura y, al cobrar, el inventario y los asientos contables."],
    ["rest-views", "Sedes y menú público", "En esta pestaña decides qué muestra el menú por QR de cada sede."],
  ],
  ph: [
    ["ph-tabs", "Cinco escenarios", "Facturación, mora y pronto pago, portería, asamblea y PQRS. Cada uno se puede probar por separado."],
    ["ph-hint", "Te digo qué hacer", "Esta franja indica el siguiente paso del escenario que tengas abierto."],
    ["ph-main", "Interactúa aquí", "Usa los botones del escenario: en «Mora y pronto pago» prueba mover la fecha con el deslizador."],
    ["ph-side", "Resultado en el sistema", "Contabilidad, estado de cuenta, correos y flujos que se disparan con lo que hagas."],
  ],
  automations: [
    ["auto-module", "Elige el módulo", "CRM, propiedad horizontal o restaurante: cada uno tiene sus propios disparadores y acciones."],
    ["auto-examples", "Pídele un flujo a la IA", "Elige un ejemplo. Los marcados «no existe aún» muestran cómo queda como solicitud para el equipo."],
    ["auto-canvas", "El lienzo", "El flujo se dibuja nodo a nodo. Debajo podrás crearlo, probarlo y activarlo."],
    ["auto-tabs", "Flujos y solicitudes", "Revisa los flujos creados y, como admin, aprueba solicitudes para que el usuario reciba el aviso."],
  ],
  ai: [
    ["ai-tabs", "Cuatro pestañas conectadas", "Configuración, chat, extractos y plantillas: lo que cambies en la configuración afecta a las demás."],
    ["ai-who", "Quién responde", "Qué proveedor y modelo atiende cada funcionalidad según la configuración."],
    ["ai-quota", "Provoca una falla", "Activa esto y ve al chat: verás contestar al respaldo o un error si no hay respaldo."],
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

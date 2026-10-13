"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Icon } from "./Icons";
import { contagracia } from "@/data/profile";

const STORAGE_KEY = "tour-simuladores";

// Qué se dice de cada simulador en el recorrido
const TOUR_TEXT = {
  ph: "Factura una copropiedad por coeficiente, mueve la fecha para ver mora y pronto pago, y maneja portería, asamblea y PQRS.",
  restaurant: "Atiende una mesa: arma platos con adiciones, haz de cocina, cobra en el POS y mira cuándo se mueve el inventario.",
  crm: "Escríbele al equipo como cliente y mira el flujo de WhatsApp, el agente IA y la oportunidad avanzando por el embudo.",
  automations: "Pídele un flujo a la IA, míralo dibujarse en el lienzo, simúlalo y préndelo. Lo que no existe queda como petición.",
  ai: "Configura proveedores con respaldo, pregúntale al chat que detecta el módulo y procesa extractos bancarios.",
};

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const save = (v) => {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {}
};

// Invitación opcional al entrar y recorrido por los simuladores con driver.js
export default function GuidedTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (read()) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    save("visto");
    setShow(false);
  };

  const start = () => {
    dismiss();
    const modules = contagracia.modules.filter((m) => m.simulator);
    const card = (id) => () => document.querySelector(`[data-tour="sim-${id}"]`)?.closest(".rounded-3xl");

    const tour = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente →",
      prevBtnText: "← Atrás",
      doneBtnText: "Listo",
      popoverClass: "tour-popover",
      stagePadding: 6,
      stageRadius: 24,
      steps: modules.map((m) => ({
        element: card(m.simulator.id),
        popover: {
          title: m.title,
          description: TOUR_TEXT[m.simulator.id],
          side: "top",
          align: "center",
        },
      })),
      // Botón extra para abrir el simulador del paso actual
      onPopoverRender: (popover, { state }) => {
        const id = modules[state.activeIndex]?.simulator.id;
        const btn = document.createElement("button");
        btn.innerText = "▶ Probar ahora";
        btn.className = "tour-try";
        btn.onclick = () => {
          tour.destroy();
          document.querySelector(`[data-tour="sim-${id}"]`)?.click();
        };
        popover.footer.before(btn);
      },
    });
    tour.drive();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(92vw,360px)] animate-pop rounded-2xl border border-warm/40 bg-surface p-4 shadow-2xl shadow-black/40">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warm/15 text-warm">
          <Icon name="play" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">¿Quieres probar lo que he construido?</p>
          <p className="mt-1 text-xs text-muted">Te muestro {contagracia.modules.filter((m) => m.simulator).length} simuladores interactivos de funcionalidades que programé en mi experiencia.</p>
        </div>
        <button onClick={dismiss} aria-label="Cerrar" className="-mr-1 -mt-1 shrink-0 text-muted transition hover:text-ink">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={start} className="flex-1 rounded-full bg-warm px-4 py-2 text-xs font-semibold text-bg transition hover:brightness-110">
          Sí, muéstrame
        </button>
        <button onClick={dismiss} className="rounded-full border border-line px-4 py-2 text-xs transition hover:border-accent hover:text-accent">
          Ahora no
        </button>
      </div>
    </div>
  );
}

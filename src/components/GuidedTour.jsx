"use client";

import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Icon } from "./Icons";
import { contagracia } from "@/data/profile";

// Qué se dice de cada simulador en el recorrido
const TOUR_TEXT = {
  ph: "Crea una copropiedad con torres y unidades, y síguela por reservas, recordatorios de cobro, documentos, asamblea y PQRS.",
  restaurant: "Reserva y mira cómo se asignan las mesas, atiende como mesero, mueve la cocina, diseña el menú público y cierra el día.",
  crm: "Haz llegar un lead por formulario o anuncio de Meta, mira cómo se asigna, cómo lo califica la IA por WhatsApp y llévalo hasta la matrícula.",
  automations: "Pídele un flujo a la IA, míralo dibujarse en el lienzo, pruébalo y actívalo. Lo que no se puede hacer queda como solicitud.",
  ai: "Elige modelos con respaldo, simula una caída, pregúntale al asistente y lee listas de precios en PDF con plantillas.",
};

// Invitación al recorrido por los simuladores (driver.js).
// mode: "hidden" (aún no aparece) → "card" (invitación completa) → "pill" (botón pequeño «Demos» tras cerrarla)
export default function GuidedTour() {
  const [mode, setMode] = useState("hidden");
  const [touringNow, setTouringNow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const touring = useRef(false);
  const cleanup = useRef(null);

  const setTouring = (v) => {
    touring.current = v;
    setTouringNow(v);
    // Al terminar el recorrido queda el botón «Demos» para repetirlo
    if (!v) setMode("pill");
  };

  useEffect(() => {
    const t = setTimeout(() => setMode((m) => (m === "hidden" ? "card" : m)), 800);
    // Se oculta mientras haya un simulador abierto, para no tapar su guía
    const onOpen = () => setModalOpen(true);
    const onClose = () => setModalOpen(false);
    window.addEventListener("simulator:opened", onOpen);
    window.addEventListener("simulator:closed", onClose);
    return () => {
      clearTimeout(t);
      window.removeEventListener("simulator:opened", onOpen);
      window.removeEventListener("simulator:closed", onClose);
    };
  }, []);

  const dismiss = () => setMode("pill");

  // Arranca (o retoma) el recorrido en el paso indicado
  const runTour = (startIndex = 0) => {
    setTouring(true);
    const modules = contagracia.modules.filter((m) => m.simulator);
    const card = (id) => () => document.querySelector(`[data-tour="sim-${id}"]`)?.closest(".rounded-3xl");
    let resumeAt = null; // se fija al abrir un simulador desde el recorrido

    const tour = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente →",
      prevBtnText: "← Atrás",
      doneBtnText: "Listo",
      popoverClass: "tour-popover",
      stagePadding: 6,
      stageRadius: 24,
      onDestroyed: () => {
        cleanup.current?.();
        if (resumeAt == null) setTouring(false);
      },
      steps: modules.map((m) => ({
        element: card(m.simulator.id),
        popover: {
          title: m.title,
          description: TOUR_TEXT[m.simulator.id],
          side: "top",
          align: "center",
        },
      })),
      // Botón extra: abre el simulador y, al cerrarlo, el recorrido sigue con el siguiente
      onPopoverRender: (popover, { state }) => {
        const index = state.activeIndex;
        const id = modules[index]?.simulator.id;
        const btn = document.createElement("button");
        btn.innerText = "▶ Probar ahora";
        btn.className = "tour-try";
        // Abre el simulador; el aviso "simulator:opened" se encarga de pausar el recorrido
        btn.onclick = () => document.querySelector(`[data-tour="sim-${id}"]`)?.click();
        popover.footer.before(btn);
      },
    });

    // Si se abre cualquier simulador con el recorrido activo (por "Probar ahora" o desde la tarjeta),
    // el recorrido se cierra y, al salir del simulador, sigue con el siguiente
    const onOpened = (e) => {
      const index = modules.findIndex((m) => m.simulator.id === e.detail);
      resumeAt = (index >= 0 ? index : tour.getActiveIndex() ?? 0) + 1;
      tour.destroy();
      window.addEventListener(
        "simulator:closed",
        () => {
          if (resumeAt < modules.length) setTimeout(() => runTour(resumeAt), 250);
          else setTouring(false);
        },
        { once: true }
      );
    };
    window.addEventListener("simulator:opened", onOpened);
    cleanup.current = () => window.removeEventListener("simulator:opened", onOpened);

    tour.drive(startIndex);
  };

  const start = () => {
    window.dispatchEvent(new Event("tour:started"));
    runTour(0);
  };

  if (mode === "hidden" || touringNow || modalOpen) return null;

  if (mode === "pill") {
    return (
      <button
        onClick={() => setMode("card")}
        className="fixed bottom-5 right-5 z-40 inline-flex animate-pop items-center gap-2 rounded-full border border-warm/60 bg-surface px-4 py-2.5 text-sm font-semibold text-warm shadow-xl shadow-black/40 transition hover:-translate-y-0.5 hover:bg-warm hover:text-bg"
        aria-label="Ver los simuladores interactivos"
      >
        <Icon name="play" className="h-4 w-4" />
        Demos
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(92vw,360px)] animate-heartbeat hover:[animation-play-state:paused] rounded-2xl border border-warm/60 bg-surface p-4 shadow-2xl shadow-black/40">
      <div className="flex items-start gap-3">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warm/15 text-warm">
          <span className="absolute inset-0 animate-ping rounded-xl bg-warm/25" />
          <Icon name="play" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">¿Quieres probar lo que he construido?</p>
          <p className="mt-1 text-xs text-muted">Te muestro {contagracia.modules.filter((m) => m.simulator).length} demos interactivas inspiradas en lo que he construido.</p>
        </div>
        <button onClick={dismiss} aria-label="Cerrar" className="-mr-2 -mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-bg/70 text-ink transition hover:border-accent hover:text-accent">
          <Icon name="close" className="h-4 w-4" strokeWidth={2.5} />
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

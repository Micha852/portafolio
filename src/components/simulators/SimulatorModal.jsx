"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Modal from "../Modal";
import { Icon } from "../Icons";

const loading = () => <p className="grid h-full place-items-center text-sm text-muted">Cargando simulador…</p>;

// Cada simulador se descarga solo cuando alguien lo abre
const simulators = {
  crm: dynamic(() => import("./CrmSimulator"), { ssr: false, loading }),
  restaurant: dynamic(() => import("./RestaurantSimulator"), { ssr: false, loading }),
  ph: dynamic(() => import("./PhSimulator"), { ssr: false, loading }),
  automations: dynamic(() => import("./AutomationsSimulator"), { ssr: false, loading }),
  ai: dynamic(() => import("./AiSimulator"), { ssr: false, loading }),
};

// Abre el simulador en un modal. variant: "card" (botón ancho al pie de la tarjeta) | "chip" (acceso rápido con nombre)
export default function SimulatorModal({ simulator, variant = "card", label }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const Simulator = simulators[simulator.id];
  if (!Simulator) return null;

  return (
    <>
      {variant === "chip" ? (
        <button
          onClick={() => setOpen(true)}
          className="group/sim inline-flex items-center gap-2 rounded-full border border-warm/50 bg-warm/10 px-3.5 py-1.5 text-xs font-semibold text-warm transition hover:-translate-y-0.5 hover:border-warm hover:bg-warm hover:text-bg"
        >
          <Icon name="play" className="h-3 w-3" />
          {label}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group/sim mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-warm px-4 py-2.5 text-sm font-semibold text-bg shadow-lg shadow-warm/20 transition hover:-translate-y-0.5 hover:brightness-110"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bg opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-bg" />
          </span>
          Ver cómo funciona
          <Icon name="play" className="h-3.5 w-3.5" />
        </button>
      )}

      <Modal open={open} onClose={close} title={simulator.title} subtitle={simulator.subtitle} size="lg" bodyClassName="overflow-hidden">
        <Simulator />
      </Modal>
    </>
  );
}

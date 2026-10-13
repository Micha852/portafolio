"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Modal from "../Modal";
import { Icon } from "../Icons";

const loading = () => <p className="grid h-full place-items-center text-sm text-muted">Cargando simulador…</p>;

// Cada simulador se descarga solo cuando alguien lo abre
const simulators = {
  crm: dynamic(() => import("./CrmSimulator"), { ssr: false, loading }),
};

export default function SimulatorModal({ simulator }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const Simulator = simulators[simulator.id];
  if (!Simulator) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group/sim mt-5 inline-flex items-center gap-2 self-start rounded-full border border-warm/50 bg-warm/10 px-4 py-2 text-sm font-semibold text-warm transition hover:border-warm hover:bg-warm hover:text-bg"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm opacity-75 group-hover/sim:bg-bg" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-warm group-hover/sim:bg-bg" />
        </span>
        Ver cómo funciona
        <Icon name="play" className="h-3.5 w-3.5" />
      </button>

      <Modal open={open} onClose={close} title={simulator.title} subtitle={simulator.subtitle} size="lg" bodyClassName="overflow-hidden">
        <Simulator />
      </Modal>
    </>
  );
}

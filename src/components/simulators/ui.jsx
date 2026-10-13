"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";

const CANCEL = Symbol("cancel");

// Estado mutable + secuencias animadas que se cancelan al reiniciar o cerrar el simulador
export function useSim(initialState) {
  const [, setTick] = useState(0);
  const s = useRef(initialState());
  const run = useRef(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => void run.current++, []);

  const update = (fn) => {
    fn(s.current);
    setTick((t) => t + 1);
  };

  const reset = () => {
    run.current++;
    s.current = initialState();
    setBusy(false);
    setTick((t) => t + 1);
  };

  const sequence = async (body) => {
    const id = ++run.current;
    const wait = (ms) => new Promise((resolve, reject) => setTimeout(() => (run.current === id ? resolve() : reject(CANCEL)), ms));
    setBusy(true);
    try {
      await body(wait);
    } catch (e) {
      if (e !== CANCEL) throw e;
    } finally {
      if (run.current === id) setBusy(false);
    }
  };

  return { st: s.current, update, reset, sequence, busy };
}

// Pestañas para pantallas pequeñas; marca con un punto la que tiene actividad
export function MobileTabs({ tabs, tab, setTab, pulse }) {
  return (
    <div className="flex shrink-0 gap-1 border-b border-line p-2 lg:hidden">
      {tabs.map(([k, label]) => (
        <button
          key={k}
          onClick={() => setTab(k)}
          className={`relative flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${tab === k ? "bg-accent/15 text-accent" : "text-muted"}`}
        >
          {label}
          {pulse === k && tab !== k && <span className="absolute right-3 top-1.5 h-2 w-2 animate-ping rounded-full bg-warm" />}
        </button>
      ))}
    </div>
  );
}

// Registro de ejecución con desplazamiento automático
export function ExecLog({ log, empty = "Esperando la primera acción…", className = "h-36" }) {
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log.length]);
  return (
    <div className={`shrink-0 overflow-y-auto border-t border-line bg-bg/60 px-5 py-3 font-mono text-xs ${className}`}>
      <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-widest text-muted">Registro de ejecución</p>
      {log.length === 0 && <p className="text-muted">{empty}</p>}
      {log.map((l) => (
        <p key={l.id} className={l.tone === "warn" ? "text-warm" : l.tone === "ok" ? "text-accent" : "text-muted"}>
          › {l.msg}
        </p>
      ))}
      <div ref={end} />
    </div>
  );
}

export function Panel({ title, icon, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-line bg-bg/40 p-3 ${className}`}>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
        {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="truncate text-right font-medium">{v}</span>
    </div>
  );
}

export function Badge({ color, children }) {
  return (
    <span className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px]" style={{ background: `${color}26`, color }}>
      {children}
    </span>
  );
}

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icons";

const sizes = {
  md: "h-[min(85vh,720px)] max-w-5xl",
  lg: "h-[min(92vh,840px)] max-w-[1360px]",
};

// Modal de tamaño fijo: encabezado arriba y el cuerpo maneja su propio scroll.
// Se monta en <body>: dentro de una tarjeta, su transform encerraría al position: fixed.
export default function Modal({ open, onClose, title, subtitle, size = "md", bodyClassName = "overflow-y-auto p-6", children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl ${sizes[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold sm:text-2xl">{title}</h3>
            {subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted sm:line-clamp-none">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className={`min-h-0 flex-1 overscroll-contain ${bodyClassName}`}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

"use client";

import Reveal from "./Reveal";

// Tarjeta que se abre al hacer clic en cualquier parte: dispara la acción principal que tenga dentro.
// Las acciones se marcan con data-card-action="1|2|3" (menor número = más prioridad):
// 1 simulador, 2 galería, 3 enlace. Los clics en botones y enlaces propios siguen funcionando igual.
export default function ClickableCard({ children, className = "", ...rest }) {
  const onClick = (e) => {
    const card = e.currentTarget;
    // Los modales salen por un portal: sus clics burbujean en React pero no están dentro de la tarjeta
    if (!card.contains(e.target)) return;
    if (e.target.closest("a, button, input, textarea, select, details, [role=button]")) return;
    // Si el usuario está seleccionando texto, no abrir nada
    if (window.getSelection()?.toString()) return;
    const action = [...card.querySelectorAll("[data-card-action]")].sort(
      (a, b) => a.dataset.cardAction - b.dataset.cardAction
    )[0];
    action?.click();
  };

  return (
    <Reveal {...rest} className={`cursor-pointer ${className}`} onClick={onClick}>
      {children}
    </Reveal>
  );
}

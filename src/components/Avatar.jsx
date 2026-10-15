"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Carrusel de fotos del perfil: avanza cada `interval` ms (se pausa al pasar el mouse)
// y se puede deslizar con el dedo o arrastrando con el mouse.
// photos: [{ src, position }]. Si no hay fotos, muestra las iniciales.
export default function Avatar({ name, photos = [], interval = 5000, className = "" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(null); // desplazamiento en px mientras se arrastra
  const drag = useRef(null);

  // Un timeout por foto: al cambiarla a mano, el conteo vuelve a empezar
  useEffect(() => {
    if (photos.length < 2 || paused || dragX !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % photos.length), interval);
    return () => clearTimeout(t);
  }, [photos.length, paused, dragX, index, interval]);

  const onPointerDown = (e) => {
    if (photos.length < 2 || e.button !== 0 || e.target.closest("button")) return;
    drag.current = { x: e.clientX, y: e.clientY, width: e.currentTarget.offsetWidth, horizontal: null };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    // Decide la dirección con los primeros píxeles: si es vertical, deja hacer scroll
    if (d.horizontal === null) {
      if (Math.abs(dx) < 6 && Math.abs(e.clientY - d.y) < 6) return;
      d.horizontal = Math.abs(dx) > Math.abs(e.clientY - d.y);
      if (!d.horizontal) return (drag.current = null);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // En los extremos ofrece resistencia
    const atEdge = (index === 0 && dx > 0) || (index === photos.length - 1 && dx < 0);
    setDragX(atEdge ? dx / 3 : dx);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || dragX === null) return;
    const threshold = Math.min(80, d.width * 0.2);
    if (dragX < -threshold) setIndex((i) => Math.min(i + 1, photos.length - 1));
    else if (dragX > threshold) setIndex((i) => Math.max(i - 1, 0));
    setDragX(null);
  };

  return (
    <div className={className}>
      <div
        className={`relative h-full w-full touch-pan-y select-none overflow-hidden rounded-[2rem] border border-line bg-surface ${photos.length > 1 ? (dragX !== null ? "cursor-grabbing" : "cursor-grab") : ""}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {photos.length > 0 ? (
          <div
            className={`absolute inset-0 flex ${dragX !== null ? "" : "transition-transform duration-700 ease-out"}`}
            style={{ transform: `translateX(calc(${-index * 100}% + ${dragX ?? 0}px))` }}
          >
            {photos.map((p, i) => (
              <div key={p.src} className="relative h-full w-full shrink-0">
                <Image
                  src={p.src}
                  alt={p.alt ?? name}
                  aria-hidden={i !== index}
                  draggable={false}
                  fill
                  sizes="(max-width: 768px) 80vw, 400px"
                  className="pointer-events-none object-cover"
                  style={{ objectPosition: p.position ?? "center" }}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent/25 via-surface to-warm/20">
            <span className="font-display text-7xl font-bold text-accent">{initials(name)}</span>
          </div>
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur-sm">
            {photos.map((p, i) => (
              <button
                key={p.src}
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-accent" : "w-2 bg-white/60 hover:bg-white"}`}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

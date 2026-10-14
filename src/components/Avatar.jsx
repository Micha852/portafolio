"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Muestra las fotos del perfil con un fundido cada `interval` ms (se pausa al pasar el mouse).
// photos: [{ src, position }]. Si no hay fotos, muestra las iniciales.
export default function Avatar({ name, photos = [], interval = 5000, className = "" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (photos.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % photos.length), interval);
    return () => clearInterval(t);
  }, [photos.length, paused, interval]);

  return (
    <div className={className}>
      <div
        className="relative h-full w-full overflow-hidden rounded-[2rem] border border-line bg-surface"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {photos.length > 0 ? (
          photos.map((p, i) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt ?? name}
              aria-hidden={i !== index}
              fill
              sizes="(max-width: 768px) 80vw, 400px"
              className={`object-cover transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
              style={{ objectPosition: p.position ?? "center" }}
              priority={i === 0}
            />
          ))
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

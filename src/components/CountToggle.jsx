"use client";

import { useEffect, useState } from "react";

// Marca (o desmarca) este navegador para que el contador de visitas no lo cuente y vuelve al inicio
export default function CountToggle({ count }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      if (count) localStorage.removeItem("no-contar");
      else localStorage.setItem("no-contar", "1");
    } catch {}
    setDone(true);
    const t = setTimeout(() => location.replace("/"), 2000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <section className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <p className="font-display text-2xl font-bold">
          {!done ? "Un momento…" : count ? "Listo: este navegador vuelve a contar" : "Listo: este navegador ya no cuenta"}
        </p>
        <p className="text-sm text-muted">
          {count ? "Tus próximas visitas aparecerán en las estadísticas." : "Tus visitas desde aquí no aparecerán en las estadísticas."} Te llevo al inicio…
        </p>
        <a href="/" className="inline-block text-sm font-semibold text-accent hover:underline">
          Ir ya
        </a>
      </div>
    </section>
  );
}

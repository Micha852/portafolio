"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Icon } from "./Icons";

function SiteCard({ site }) {
  return (
    <a
      href={site.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-line bg-bg transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl hover:shadow-accent/10"
    >
      {/* Barra de navegador para que se lea como un sitio web */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="ml-2 truncate text-[11px] text-muted">{site.href.replace(/^https?:\/\/|\/$/g, "")}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={site.image}
          alt={`Sitio web de ${site.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{site.name}</p>
          <p className="text-xs text-muted">{site.category}</p>
        </div>
        <Icon name="external" className="w-4 h-4 shrink-0 text-muted transition group-hover:text-accent" />
      </div>
    </a>
  );
}

// Botón que abre un modal con capturas de sitios
export default function GalleryModal({ gallery }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-bg"
      >
        <Icon name="grid" className="w-4 h-4" />
        Ver {gallery.sites.length} sitios
      </button>

      {/* Se monta en <body>: dentro de la tarjeta, su transform encerraría al position: fixed */}
      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={gallery.title}
        >
          {/* min-h-full centra el panel si cabe, y si es más alto deja hacer scroll desde arriba */}
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
          <div
            className="relative w-full max-w-6xl rounded-3xl border border-line bg-surface p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>

            <h3 className="font-display pr-12 text-2xl font-bold sm:text-3xl">{gallery.title}</h3>
            {gallery.subtitle && <p className="mt-2 max-w-2xl text-muted">{gallery.subtitle}</p>}

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.sites.map((site) => (
                <SiteCard key={site.href} site={site} />
              ))}
            </div>
          </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}

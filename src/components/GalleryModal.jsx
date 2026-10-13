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

// Miniaturas superpuestas: se abren en abanico al pasar el mouse
function ThumbsTrigger({ gallery, onOpen }) {
  const shown = gallery.sites.slice(0, 4);
  const rest = gallery.sites.length - shown.length;

  return (
    <button
      onClick={onOpen}
      className="group/thumbs mt-6 w-full rounded-2xl border border-accent/40 bg-accent/5 p-4 text-left transition hover:border-accent hover:bg-accent/10"
    >
      <div className="flex">
        {shown.map((site, i) => (
          <div
            key={site.href}
            className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-surface shadow-md transition-all duration-300 ${
              i > 0 ? "-ml-7 group-hover/thumbs:-ml-3" : ""
            }`}
            style={{ zIndex: shown.length - i }}
          >
            <Image src={site.image} alt="" fill sizes="64px" className="object-cover object-top" />
          </div>
        ))}
        {rest > 0 && (
          <div className="-ml-3 grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 border-surface bg-accent text-sm font-bold text-bg transition-all duration-300 group-hover/thumbs:ml-1">
            +{rest}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-accent">Ver los {gallery.sites.length} sitios</p>
          <p className="text-xs text-muted">Negocios reales que usan este CMS</p>
        </div>
        <Icon name="arrow" className="ml-auto h-4 w-4 shrink-0 text-accent transition group-hover/thumbs:translate-x-1" />
      </div>
    </button>
  );
}

// Mosaico 2×2 que ocupa el área de imagen de la tarjeta
function MosaicTrigger({ gallery, onOpen }) {
  return (
    <button onClick={onOpen} aria-label={`Ver ${gallery.sites.length} sitios`} className="group/mosaic absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
      {gallery.sites.slice(0, 4).map((site) => (
        <span key={site.href} className="relative overflow-hidden rounded-lg">
          <Image src={site.image} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover object-top transition duration-500 group-hover/mosaic:scale-105" />
        </span>
      ))}
      <span className="absolute inset-0 grid place-items-center bg-bg/0 transition group-hover/mosaic:bg-bg/60">
        <span className="inline-flex translate-y-2 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg opacity-0 shadow-lg transition group-hover/mosaic:translate-y-0 group-hover/mosaic:opacity-100">
          <Icon name="grid" className="h-4 w-4" />
          Ver {gallery.sites.length} sitios
        </span>
      </span>
    </button>
  );
}

// Abre un modal con capturas de sitios. variant: "button" | "thumbs" | "mosaic"
export default function GalleryModal({ gallery, variant = "button" }) {
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
      {variant === "thumbs" && <ThumbsTrigger gallery={gallery} onOpen={() => setOpen(true)} />}
      {variant === "mosaic" && <MosaicTrigger gallery={gallery} onOpen={() => setOpen(true)} />}
      {variant === "button" && (
        <button
          onClick={() => setOpen(true)}
          className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:brightness-110"
        >
          <Icon name="grid" className="w-4 h-4" />
          Ver {gallery.sites.length} sitios
          <Icon name="arrow" className="w-4 h-4" />
        </button>
      )}

      {/* Se monta en <body>: dentro de la tarjeta, su transform encerraría al position: fixed */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={gallery.title}
          >
            {/* Tamaño fijo: el encabezado queda arriba y solo la grilla hace scroll */}
            <div
              className="relative flex h-[min(85vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-start gap-4 border-b border-line p-6">
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-bold">{gallery.title}</h3>
                  {gallery.subtitle && <p className="mt-1 text-sm text-muted">{gallery.subtitle}</p>}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
                >
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

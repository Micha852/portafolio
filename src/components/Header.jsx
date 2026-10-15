"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { Icon } from "./Icons";
import { profile } from "@/data/profile";

const navItems = [
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "proyectos", label: "Proyectos" },
  { id: "experiencia", label: "Experiencia" },
  { id: "habilidades", label: "Habilidades" },
  { id: "contacto", label: "Contacto" },
];

export default function Header() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Marca en el menú la sección que está en pantalla
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <header className="fixed top-4 inset-x-4 z-40 flex justify-center">
      <div
        className={`flex w-full max-w-5xl items-center justify-between rounded-full border px-5 py-2.5 transition-all duration-500 ${
          scrolled ? "border-line bg-surface/80 shadow-lg shadow-black/10 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <a href="#inicio" className="font-display text-xl font-bold tracking-tight">
          {profile.shortName}
          <span className="text-accent">.</span>
        </a>

        <nav className="hidden md:block">
          <ul className="flex gap-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active === item.id ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-line"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md flex flex-col items-center justify-center md:hidden">
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="absolute top-6 right-6 grid place-items-center w-10 h-10 rounded-full border border-line"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
          <ul className="flex flex-col items-center gap-6">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setMenuOpen(false)}
                  className={`font-display text-3xl font-semibold ${active === item.id ? "text-accent" : ""}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="grid place-items-center w-10 h-10 rounded-full border border-line text-muted hover:text-accent hover:border-accent transition"
    >
      <Icon name={isDark ? "sun" : "moon"} className="w-5 h-5" />
    </button>
  );
}

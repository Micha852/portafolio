"use client";

import { useEffect } from "react";

const SKIP_KEY = "no-contar";
const VID_KEY = "vid";

const storage = {
  get: (s, k) => {
    try {
      return window[s].getItem(k);
    } catch {
      return null;
    }
  },
  set: (s, k, v) => {
    try {
      window[s].setItem(k, v);
    } catch {}
  },
  del: (s, k) => {
    try {
      window[s].removeItem(k);
    } catch {}
  },
};

// De dónde llegó la visita, en palabras simples
function source() {
  const params = new URLSearchParams(location.search);
  const utm = params.get("utm_source");
  if (utm) return utm;
  if (!document.referrer) return "Directo";
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (host === location.hostname) return null;
    if (/linkedin|lnkd/.test(host)) return "LinkedIn";
    if (/whatsapp/.test(host)) return "WhatsApp";
    if (/google\./.test(host)) return "Google";
    if (/facebook|fb\./.test(host)) return "Facebook";
    if (/instagram/.test(host)) return "Instagram";
    if (/github/.test(host)) return "GitHub";
    return host;
  } catch {
    return "Directo";
  }
}

// Contador de visitas propio: una visita por sesión del navegador + eventos de los simuladores.
// Para no contar tus propias visitas, entra una vez con ?no-contar (y ?contar para volver).
export default function Tracker() {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("no-contar")) storage.set("localStorage", SKIP_KEY, "1");
    if (params.has("contar")) storage.del("localStorage", SKIP_KEY);
    // Navegadores automatizados (pruebas) y los excluidos no cuentan
    if (storage.get("localStorage", SKIP_KEY) || navigator.webdriver || location.pathname.startsWith("/stats")) return;

    let vid = storage.get("localStorage", VID_KEY);
    if (!vid) {
      vid = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)) + "";
      storage.set("localStorage", VID_KEY, vid);
    }

    const send = (type, extra = {}) => {
      const body = JSON.stringify({ type, vid, ...extra });
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" })))
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    };

    if (!storage.get("sessionStorage", "visit-sent")) {
      storage.set("sessionStorage", "visit-sent", "1");
      send("visit", { ref: source() ?? "Directo" });
    }

    const onSim = (e) => send("simulator", { label: e.detail });
    const onTour = () => send("tour");
    const onClick = (e) => {
      const a = e.target.closest?.("a[href]");
      if (a && /\/cv-[^/]*\.pdf$/.test(a.getAttribute("href"))) send("cv");
    };
    const onContact = () => send("contact");

    window.addEventListener("simulator:opened", onSim);
    window.addEventListener("tour:started", onTour);
    window.addEventListener("contact:sent", onContact);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("simulator:opened", onSim);
      window.removeEventListener("tour:started", onTour);
      window.removeEventListener("contact:sent", onContact);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}

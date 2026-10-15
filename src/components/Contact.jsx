"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { Icon } from "./Icons";
import { contact } from "@/data/profile";

// Al tocar un enlace con data-attention, espera a que el destino esté en pantalla y lo hace palpitar.
// "Hablemos" del hero → botón de WhatsApp; la tarjeta de correo → formulario (además de abrir el correo).
function useAttention() {
  const refs = { whatsapp: useRef(null), form: useRef(null) };
  const classes = { whatsapp: ["attention", "attention-warm"], form: ["attention"] };

  useEffect(() => {
    const flash = (key) => {
      const el = refs[key]?.current;
      if (!el) return;
      const started = performance.now();
      let lastTop = null;
      // Espera a que termine el scroll suave y el elemento esté a la vista (máx. 2,5 s)
      const wait = () => {
        const r = el.getBoundingClientRect();
        const settled = lastTop !== null && Math.abs(r.top - lastTop) < 1 && r.top < innerHeight && r.bottom > 0;
        lastTop = r.top;
        if (!settled && performance.now() - started < 2500) return requestAnimationFrame(wait);
        el.classList.remove(...classes[key]);
        void el.offsetWidth; // reinicia la animación si se vuelve a tocar
        el.classList.add(...classes[key]);
        setTimeout(() => el.classList.remove(...classes[key]), 3200);
      };
      requestAnimationFrame(wait);
    };
    const onClick = (e) => {
      const key = e.target.closest?.("[data-attention]")?.dataset.attention;
      if (key) flash(key);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { refs };
}

const initialForm = { name: "", email: "", message: "", website: "" };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const attention = useAttention();
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      window.dispatchEvent(new Event("contact:sent"));
      setForm(initialForm);
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <section id="contacto" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading number="05" title="Contacto" subtitle="¿Tienes una idea o proyecto en mente? Escríbeme y conversemos." />

        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4">
            <a
              href={`mailto:${contact.email}`}
              data-attention="form"
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-accent"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon name="mail" className="w-6 h-6" />
              </span>
              <span>
                <span className="block text-sm text-muted">Correo</span>
                <span className="font-semibold break-all">{contact.email}</span>
              </span>
            </a>
            <a
              href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              ref={attention.refs.whatsapp}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-accent"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-warm/10 text-warm">
                <Icon name="whatsapp" className="w-6 h-6" />
              </span>
              <span>
                <span className="block text-sm text-muted">WhatsApp</span>
                <span className="font-semibold">Escríbeme directo</span>
              </span>
            </a>
            <div className="flex gap-3 pt-2">
              {contact.socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="grid h-12 w-12 place-items-center rounded-xl border border-line text-muted transition hover:border-accent hover:text-accent"
                >
                  <Icon name={s.icon} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <form ref={attention.refs.form} onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Nombre</span>
                  <input name="name" required maxLength={100} value={form.name} onChange={update} className={inputClass} placeholder="Tu nombre" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Correo</span>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    value={form.email}
                    onChange={update}
                    className={inputClass}
                    placeholder="tu@correo.com"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Mensaje</span>
                <textarea
                  name="message"
                  required
                  rows={5}
                  maxLength={5000}
                  value={form.message}
                  onChange={update}
                  className={`${inputClass} resize-none`}
                  placeholder="Cuéntame sobre tu proyecto..."
                />
              </label>

              {/* Campo trampa contra bots: las personas no lo ven */}
              <input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button type="submit" disabled={status === "sending"} className="btn-solid disabled:opacity-60 disabled:hover:translate-y-0">
                  {status === "sending" ? "Enviando..." : "Enviar mensaje"}
                </button>
                {status === "sent" && <p className="text-sm text-accent">¡Gracias! Te responderé pronto.</p>}
                {status === "error" && <p className="text-sm text-red-500">No se pudo enviar. Intenta por WhatsApp o correo.</p>}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

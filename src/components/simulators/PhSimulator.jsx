"use client";

import { useState } from "react";
import { Icon } from "../Icons";
import { useSim, ExecLog, Panel, Row, Badge, ProdLink } from "./ui";

// Réplica del módulo de Propiedad Horizontal de Contagracia (Ley 675): facturación por coeficiente,
// mora y pronto pago por días del mes, portería, asambleas con quórum por coeficiente y PQRS con flujos.
// Reglas, estados y etiquetas siguen el código real; la copropiedad y los valores son de ejemplo.

const cop = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;
const pct = (n) => `${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

const SCENARIOS = [
  ["billing", "Facturación del mes", "calendar"],
  ["mora", "Mora y pronto pago", "bolt"],
  ["porteria", "Portería", "user"],
  ["asamblea", "Asamblea", "users"],
  ["pqrs", "PQRS", "mail"],
];

export default function PhSimulator() {
  const [scenario, setScenario] = useState("billing");
  return (
    <div className="flex h-full flex-col">
      <div data-guide="ph-tabs" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {SCENARIOS.map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setScenario(k)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              scenario === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name={icon} className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      {/* Todos quedan montados para conservar su avance al cambiar de pestaña */}
      <div className="min-h-0 flex-1">
        <div className={scenario === "billing" ? "h-full" : "hidden"}>
          <Billing />
        </div>
        <div className={scenario === "mora" ? "h-full" : "hidden"}>
          <Mora />
        </div>
        <div className={scenario === "porteria" ? "h-full" : "hidden"}>
          <Porteria />
        </div>
        <div className={scenario === "asamblea" ? "h-full" : "hidden"}>
          <Asamblea />
        </div>
        <div className={scenario === "pqrs" ? "h-full" : "hidden"}>
          <Pqrs />
        </div>
      </div>
    </div>
  );
}

// Columna principal + columna lateral "Sistema"; en móvil se apilan
function Layout({ hint, main, side, log }) {
  return (
    <div className="h-full overflow-y-auto lg:grid lg:min-h-0 lg:grid-cols-[1fr_300px] lg:overflow-hidden">
      <section className="flex flex-col lg:min-h-0">
        <div data-guide="ph-hint" className="shrink-0 border-b border-line bg-warm/10 px-5 py-2.5 text-xs font-medium text-warm">{hint}</div>
        <div data-guide="ph-main" className="p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">{main}</div>
        <ExecLog log={log} className="h-32" />
      </section>
      <aside data-guide="ph-side" className="flex flex-col gap-3 border-t border-line p-4 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">{side}</aside>
    </div>
  );
}

function Btn({ onClick, disabled, children, tone = "accent", full }) {
  const tones = {
    accent: "bg-accent text-bg",
    warm: "bg-warm text-bg",
    ghost: "border border-line text-ink hover:border-accent hover:text-accent",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} rounded-full px-4 py-2 text-xs font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

const addLog = (update) => (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));

/* ───────────────────────────── 1. Facturación del mes ───────────────────────────── */

const CONDO = "Conjunto La Finca";
const UNITS = [
  { tower: "Torre A", apt: "101", coef: 1.1, payer: "Carlos Pérez" },
  { tower: "Torre A", apt: "102", coef: 1.1, payer: "Ana Ríos" },
  { tower: "Torre A", apt: "201", coef: 1.18, payer: null },
  { tower: "Torre B", apt: "301", coef: 1.25, payer: "Jorge Díaz" },
  { tower: "Torre B", apt: "302", coef: 1.25, payer: "Laura Gómez" },
  { tower: "Torre B", apt: "401", coef: 1.32, payer: "Marta León" },
];
// Conceptos: "coefficient" = valor por cada 1 % de coeficiente; "fixed" = valor fijo por unidad
const CONCEPTS = [
  { id: "ord", name: "Cuota ordinaria de administración", mode: "coefficient", value: 148000, on: true },
  { id: "fondo", name: "Fondo de imprevistos", mode: "coefficient", value: 1480, on: true },
  { id: "extra", name: "Cuota extraordinaria", mode: "fixed", value: 50000, on: false },
];
const BILL_STEPS = ["draft", "preview", "generated", "sent", "closed"];
const PERIOD_LABEL = { draft: "Borrador", preview: "Borrador", generated: "Generado", sent: "Generado", closed: "Cerrado" };

function Billing() {
  const { st, update, sequence, busy, reset } = useSim(() => ({
    step: null,
    concepts: CONCEPTS.map((c) => ({ ...c })),
    removed: [],
    fees: [],
    entry: null,
    emails: 0,
    log: [],
  }));
  const log = addLog(update);
  const active = st.concepts.filter((c) => c.on);
  const amountFor = (u, c) => (c.mode === "coefficient" ? c.value * u.coef : c.value);
  const unitTotal = (u) => active.reduce((a, c) => a + amountFor(u, c), 0);
  const included = UNITS.filter((u) => !st.removed.includes(u.apt));

  const createPeriod = () => {
    update((x) => (x.step = "draft"));
    log("Nuevo período: «Facturación Octubre 2026» · vence el 10 de octubre");
  };
  const preview = () => {
    update((x) => (x.step = "preview"));
    log(`Previsualizar la facturación: ${UNITS.length} unidades, ${UNITS.filter((u) => !u.payer).length} sin responsable de pagos`);
  };
  const generate = () =>
    sequence(async (wait) => {
      for (const u of included) {
        update((x) =>
          x.fees.push({ apt: u.apt, tower: u.tower, payer: u.payer, total: unitTotal(u), status: "Pendiente", sent: false })
        );
        await wait(220);
      }
      update((x) => (x.step = "generated"));
      log(`Generar Cuotas: ${included.length} cuotas en estado Pendiente`, "ok");
    });
  const send = () =>
    sequence(async (wait) => {
      for (const f of st.fees.filter((f) => f.payer)) {
        update((x) => {
          x.fees.find((y) => y.apt === f.apt).sent = true;
          x.emails += 1;
        });
        await wait(250);
      }
      update((x) => (x.step = "sent"));
      log(`Enviar Facturas por Email: ${st.emails} correos «Factura de Administración» con su PDF`, "ok");
      if (st.fees.some((f) => !f.payer)) log("Apto 201 sin responsable de pagos: no se envía", "warn");
    });
  const close = () =>
    sequence(async (wait) => {
      const caused = st.fees.filter((f) => f.payer);
      const byConcept = active.map((c) => ({
        name: c.name,
        amount: UNITS.filter((u) => u.payer && caused.some((f) => f.apt === u.apt)).reduce((a, u) => a + amountFor(u, c), 0),
      }));
      await wait(600);
      update((x) => {
        x.entry = { number: "JEPH-0031", total: caused.reduce((a, f) => a + f.total, 0), lines: byConcept, ararp: caused.length };
        x.step = "closed";
      });
      log(`Cerrar Período: asiento JEPH-0031 «Facturación PH» y ${caused.length} cuentas por cobrar`, "ok");
      if (st.fees.some((f) => !f.payer)) log("Las unidades sin responsable no se causan", "warn");
    });

  const idx = BILL_STEPS.indexOf(st.step);
  const hint = [
    "Crea el período de octubre para la copropiedad.",
    "Elige los conceptos y previsualiza cuánto paga cada unidad.",
    "Revisa la previsualización y genera las cuotas.",
    "Envía las facturas de administración por correo.",
    "Cierra el período para causar la cartera.",
    "Período cerrado y causado.",
  ][idx + 1];

  return (
    <Layout
      hint={hint}
      log={st.log}
      main={
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold">{CONDO}</p>
              <p className="text-xs text-muted">
                {st.step ? "Facturación Octubre 2026 · vence 10 oct 2026" : "Sin período abierto"}
              </p>
            </div>
            {st.step && <Badge color={st.step === "closed" ? "#10B981" : st.step === "draft" || st.step === "preview" ? "#94A3B8" : "#3B82F6"}>{PERIOD_LABEL[st.step]}</Badge>}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Conceptos</p>
            <div className="space-y-1.5">
              {st.concepts.map((c) => (
                <label key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={c.on}
                      disabled={idx >= 2}
                      onChange={(e) => update((x) => (x.concepts.find((y) => y.id === c.id).on = e.target.checked))}
                      className="accent-[rgb(var(--accent))]"
                    />
                    {c.name}
                  </span>
                  <span className="text-xs text-muted">{c.mode === "coefficient" ? `${cop(c.value)} × coeficiente` : `${cop(c.value)} fijo`}</span>
                </label>
              ))}
            </div>
          </div>

          {idx >= 1 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2">Unidad</th>
                    <th>Coeficiente %</th>
                    <th>Responsable de pagos</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {UNITS.map((u) => {
                    const fee = st.fees.find((f) => f.apt === u.apt);
                    const removed = st.removed.includes(u.apt);
                    return (
                      <tr key={u.apt} className={`border-b border-line/60 ${removed ? "opacity-40" : ""}`}>
                        <td className="py-2 font-medium">
                          {u.tower} · Apto {u.apt}
                        </td>
                        <td>{pct(u.coef)}</td>
                        <td>{u.payer ?? <span className="text-warm">Sin responsable</span>}</td>
                        <td className="text-right font-semibold">{cop(unitTotal(u))}</td>
                        <td className="text-right">
                          {fee ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Badge color="#F59E0B">{fee.status}</Badge>
                              {fee.sent && <Badge color="#10B981">Enviada</Badge>}
                            </span>
                          ) : idx === 1 ? (
                            <button
                              onClick={() =>
                                update((x) => (x.removed = removed ? x.removed.filter((a) => a !== u.apt) : [...x.removed, u.apt]))
                              }
                              className="text-[11px] text-muted underline-offset-2 hover:text-accent hover:underline"
                            >
                              {removed ? "Incluir" : "Quitar"}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-muted">
                Cuota ordinaria del Apto 302: {cop(148000)} × 1,25 = {cop(185000)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {idx === -1 && <Btn onClick={createPeriod}>Nuevo período</Btn>}
            {idx === 0 && <Btn onClick={preview}>Previsualizar la facturación</Btn>}
            {idx === 1 && (
              <Btn onClick={generate} disabled={busy || included.length === 0}>
                Generar Cuotas
              </Btn>
            )}
            {idx === 2 && (
              <Btn onClick={send} disabled={busy}>
                Enviar Facturas por Email
              </Btn>
            )}
            {idx === 3 && (
              <Btn onClick={close} disabled={busy} tone="warm">
                Cerrar Período
              </Btn>
            )}
            {idx === 4 && (
              <Btn onClick={reset} tone="ghost">
                Reiniciar
              </Btn>
            )}
          </div>
        </div>
      }
      side={
        <>
          <Panel title="Período">
            <Row k="Nombre" v={st.step ? "Facturación Octubre 2026" : "—"} />
            <Row k="Estado" v={st.step ? PERIOD_LABEL[st.step] : "—"} />
            <Row k="Cuotas" v={st.fees.length} />
            <Row k="Correos enviados" v={st.emails} />
          </Panel>
          <Panel title="Contabilidad">
            {st.entry ? (
              <div className="animate-pop space-y-1 text-[11px]">
                <p className="font-semibold">{st.entry.number} · Facturación PH</p>
                <div className="flex justify-between">
                  <span className="text-muted">Db Cuentas por cobrar</span>
                  <span>{cop(st.entry.total)}</span>
                </div>
                {st.entry.lines.map((l) => (
                  <div key={l.name} className="flex justify-between gap-2">
                    <span className="truncate text-muted">Cr {l.name}</span>
                    <span>{cop(l.amount)}</span>
                  </div>
                ))}
                <p className="pt-1 text-accent">{st.entry.ararp} cuentas por cobrar creadas</p>
              </div>
            ) : (
              <p className="text-xs text-muted">El asiento se genera al cerrar el período. No es factura electrónica DIAN: es una cuota interna con su cuenta por cobrar.</p>
            )}
          </Panel>
        </>
      }
    />
  );
}

/* ───────────────────────────── 2. Mora y pronto pago ───────────────────────────── */

const FEE = 185000;
const DISCOUNT = { pct: 5, from: 1, to: 5 };
const INTEREST = { pct: 1.5, cutoff: 10 };
const dayLabel = (d) => (d < 31 ? `${d + 1} oct` : `${d - 30} nov`);

function Mora() {
  const { st, update, reset } = useSim(() => ({ day: 0, compound: false, forgiven: [], paid: null, log: [] }));
  const log = addLog(update);
  const d = st.paid ? st.paid.day : st.day;

  // Intereses: uno por mes, creados por el proceso diario de las 6:00 a. m.
  const interests = [];
  if (d >= 10) interests.push({ id: "oct", label: "Interés de mora · octubre", base: FEE });
  if (d >= 41) interests.push({ id: "nov", label: "Interés de mora · noviembre", base: st.compound && !st.forgiven.includes("oct") ? FEE + FEE * 0.015 : FEE });
  interests.forEach((i) => (i.amount = Math.round((i.base * INTEREST.pct) / 100)));
  const activeInterest = interests.filter((i) => !st.forgiven.includes(i.id));
  const discount = d <= 4 ? Math.round((FEE * DISCOUNT.pct) / 100) : 0;
  const due = FEE + activeInterest.reduce((a, i) => a + i.amount, 0) - discount;
  const state = discount ? ["Con descuento", "#10B981"] : activeInterest.length ? ["Con mora", "#EF4444"] : ["Normal", "#94A3B8"];
  const cartera = st.paid ? "a paz y salvo" : d >= 10 ? "en mora" : "al día, con saldo pendiente";

  const timeline = [
    { at: 0, text: "Flujo «Recordatorio mensual de pago de administración» (día 1, 8:00 a. m.)" },
    { at: 6, text: "Flujo «Recordatorio de administración 3 días antes»" },
    { at: 9, text: "Vence la cuota (10 oct)" },
    { at: 10, text: `Calcular mora: interés de ${cop(Math.round(FEE * 0.015))} + correo «Aviso de Interés por mora»` },
    { at: 14, text: "Flujo «Aviso de cuota vencida a los 5 días»" },
    { at: 41, text: "Segundo interés de mora (noviembre)" },
  ];

  const pay = () => {
    update((x) => (x.paid = { day: x.day, amount: due, discount, interests: activeInterest.length }));
    log(`Registrar pago el ${dayLabel(d)}: recibo de caja RC-0218 por ${cop(due)}`, "ok");
    if (discount) log(`Línea de descuento por pronto pago: ${cop(discount)} (${DISCOUNT.pct} %)`);
    if (activeInterest.length) log(`Se pagan también ${activeInterest.length} cargo(s) de interés`);
    log("Cuota Pagada · la unidad queda a paz y salvo", "ok");
  };

  return (
    <Layout
      hint={st.paid ? "Pago registrado. Reinicia para probar otra fecha." : "Mueve la fecha y mira cómo cambia lo que debe pagar el Apto 302 hoy."}
      log={st.log}
      main={
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold">Torre B · Apto 302</p>
              <p className="text-xs text-muted">Laura Gómez · Cuota ordinaria octubre {cop(FEE)} · vence 10 oct</p>
            </div>
            <Badge color={state[1]}>{state[0]}</Badge>
          </div>

          <div className="rounded-2xl border border-line p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs text-muted">Hoy es</span>
              <span className="font-display text-2xl font-bold">{dayLabel(d)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={d}
              disabled={!!st.paid}
              onChange={(e) => update((x) => (x.day = Number(e.target.value)))}
              className="w-full accent-[rgb(var(--accent))]"
              aria-label="Fecha"
            />
            {/* Franjas: pronto pago y mora */}
            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full">
              <span className="bg-[#10B981]" style={{ width: `${(5 / 61) * 100}%` }} />
              <span className="bg-line" style={{ width: `${(5 / 61) * 100}%` }} />
              <span className="bg-[#EF4444]/70" style={{ width: `${(51 / 61) * 100}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>1 oct</span>
              <span>10 oct · vence</span>
              <span>11 nov</span>
              <span>30 nov</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">A pagar hoy</p>
              <p className="mt-1 font-display text-3xl font-bold text-accent">{cop(due)}</p>
              <div className="mt-2 space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Cuota</span>
                  <span>{cop(FEE)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#10B981]">
                    <span>Descuento pronto pago</span>
                    <span>−{cop(discount)}</span>
                  </div>
                )}
                {interests.map((i) => (
                  <div key={i.id} className={`flex justify-between ${st.forgiven.includes(i.id) ? "text-muted line-through" : "text-[#EF4444]"}`}>
                    <span>{i.label}</span>
                    <span>+{cop(i.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-line p-4 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Reglas</p>
              <p>Hay descuento a quien pague entre el día {DISCOUNT.from} y el {DISCOUNT.to} de cada mes ({DISCOUNT.pct} %).</p>
              <p>El interés empieza a correr pasado el día {INTEREST.cutoff} de cada mes ({INTEREST.pct} % mensual).</p>
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <input type="checkbox" checked={st.compound} disabled={!!st.paid} onChange={(e) => update((x) => (x.compound = e.target.checked))} className="accent-[rgb(var(--accent))]" />
                Interés Compuesto
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!st.paid && activeInterest.length > 0 && (
              <Btn
                tone="ghost"
                onClick={() => {
                  update((x) => x.forgiven.push(...activeInterest.map((i) => i.id)));
                  log("Perdonar interés de mora: el cargo queda anulado", "warn");
                }}
              >
                Perdonar interés de mora
              </Btn>
            )}
            {!st.paid && <Btn onClick={pay}>Registrar pago · {cop(due)}</Btn>}
            {st.paid && (
              <Btn tone="ghost" onClick={reset}>
                Reiniciar
              </Btn>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Lo que pasa solo con el calendario</p>
            <ol className="space-y-1.5">
              {timeline.map((t) => {
                const done = d >= t.at;
                return (
                  <li key={t.at} className={`flex items-center gap-2 text-xs transition ${done ? "" : "opacity-40"}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${done ? "bg-accent text-bg" : "border border-line"}`}>
                      {done && <Icon name="check" className="h-3 w-3" />}
                    </span>
                    <span className="w-12 shrink-0 text-muted">{dayLabel(t.at)}</span>
                    {t.text}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      }
      side={
        <>
          <Panel title="Estado de cuenta">
            <Row k="Saldo cuota" v={st.paid ? "$0" : cop(FEE)} />
            <Row k="Intereses" v={st.paid ? "$0" : cop(activeInterest.reduce((a, i) => a + i.amount, 0))} />
            <Row k="Cartera" v={<span className={st.paid ? "text-accent" : d >= 10 ? "text-[#EF4444]" : ""}>{cartera}</span>} />
          </Panel>
          <Panel title="Recibo de caja">
            {st.paid ? (
              <div className="animate-pop space-y-0.5 text-[11px]">
                <p className="font-semibold">RC-0218 · {dayLabel(st.paid.day)}</p>
                <div className="flex justify-between">
                  <span className="text-muted">Banco</span>
                  <span>{cop(st.paid.amount)}</span>
                </div>
                {st.paid.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Descuento pronto pago</span>
                    <span>{cop(st.paid.discount)}</span>
                  </div>
                )}
                <p className="pt-1 text-accent">Cuota Pagada</p>
              </div>
            ) : (
              <p className="text-xs text-muted">El pago se registra contra la cuenta por cobrar de la cuota.</p>
            )}
          </Panel>
          <Panel title="Correos al residente" icon="mail">
            <ul className="space-y-1 text-xs">
              {d >= 0 && <li>Recordatorio mensual de pago</li>}
              {d >= 6 && <li>Tu administración vence en 3 días</li>}
              {d >= 10 && <li>Aviso de Interés por mora</li>}
              {d >= 14 && <li>Tu cuota lleva 5 días vencida</li>}
            </ul>
          </Panel>
        </>
      }
    />
  );
}

/* ───────────────────────────── 3. Portería ───────────────────────────── */

const MINUTA_PRESETS = [
  { type: "Novedad", text: "Ronda nocturna por parqueaderos sin novedad" },
  { type: "Incidente", text: "Reporte de ruido en Torre A, piso 2" },
  { type: "Mantenimiento", text: "Falla en el citófono de la Torre B" },
];

function Porteria() {
  const { st, update, sequence, busy, reset } = useSim(() => ({ visits: [], packages: [], minuta: [], emails: [], log: [], clock: 19 * 60 + 5 }));
  const log = addLog(update);
  const time = () => {
    const t = st.clock;
    update((x) => (x.clock += 7));
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };

  const registerVisit = () => {
    const at = time();
    update((x) => x.visits.push({ id: x.visits.length, name: "Andrés Molina", doc: "CC 1.020.333.444", to: "Torre B · Apto 302", type: "Visitante", in: at, out: null }));
    log(`Ingreso ${at}: Visitante Andrés Molina → Torre B · Apto 302`);
  };
  const exit = (id) => {
    const at = time();
    update((x) => (x.visits.find((v) => v.id === id).out = at));
    log(`Registrar salida ${at}: Andrés Molina`);
  };
  const receivePackage = () =>
    sequence(async (wait) => {
      const at = time();
      const id = st.packages.length;
      update((x) => x.packages.push({ id, carrier: "Servientrega", desc: "Caja mediana", to: "Torre B · Apto 302", status: "Pendiente", at, deliveredTo: null }));
      log(`Paquete recibido ${at}: Servientrega para Torre B · Apto 302`);
      await wait(1200);
      update((x) => {
        x.packages.find((p) => p.id === id).status = "Notificado";
        x.emails.unshift("📦 Paquete recibido en portería → Laura Gómez");
      });
      log("Correo y notificación al residente: «📦 Paquete recibido en portería»", "ok");
    });
  const deliver = (id) => {
    const at = time();
    update((x) => {
      const p = x.packages.find((y) => y.id === id);
      p.status = "Entregado";
      p.deliveredTo = "Laura Gómez";
      p.deliveredAt = at;
    });
    log(`Entregado ${at} a Laura Gómez (entregó: portero de turno)`);
  };
  const addMinuta = (preset) => {
    const at = time();
    update((x) => x.minuta.push({ id: x.minuta.length, ...preset, shift: "Noche", at, notes: [] }));
    log(`Minuta · ${preset.type} (turno Noche): ${preset.text}`);
  };
  const addNote = (id) => {
    const at = time();
    update((x) => x.minuta.find((m) => m.id === id).notes.push({ text: "Se informó a la administración.", at, by: "Portero de turno" }));
    log(`Nota agregada a la minuta (${at})`);
  };

  const pkgColor = { Pendiente: "#F59E0B", Notificado: "#3B82F6", Entregado: "#10B981" };
  const unusedPresets = MINUTA_PRESETS.filter((p) => !st.minuta.some((m) => m.text === p.text));

  return (
    <Layout
      hint="Turno de la noche: registra un visitante, recibe un paquete y escribe en la minuta."
      log={st.log}
      main={
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            {["Pendiente", "Notificado", "Entregado"].map((s) => (
              <div key={s} className="rounded-xl border border-line p-2">
                <p className="font-display text-xl font-bold" style={{ color: pkgColor[s] }}>
                  {st.packages.filter((p) => p.status === s).length}
                </p>
                <p className="text-[10px] text-muted">{s === "Entregado" ? "Entregados hoy" : `${s}s`}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Control de acceso · Hoy</p>
              {st.visits.length === 0 && <Btn onClick={registerVisit}>Registrar visitante</Btn>}
            </div>
            {st.visits.map((v) => (
              <div key={v.id} className="flex animate-pop items-center justify-between gap-2 rounded-xl border border-line p-3 text-xs">
                <div>
                  <p className="font-semibold">
                    {v.name} <span className="font-normal text-muted">· {v.doc}</span>
                  </p>
                  <p className="text-muted">
                    {v.type} → {v.to} · entró {v.in}
                    {v.out && ` · salió ${v.out}`}
                  </p>
                </div>
                {!v.out ? <Btn tone="ghost" onClick={() => exit(v.id)}>Registrar salida</Btn> : <Badge color="#94A3B8">Salió</Badge>}
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Paquetería · Hoy</p>
              {st.packages.length === 0 && (
                <Btn onClick={receivePackage} disabled={busy}>
                  Recibir paquete
                </Btn>
              )}
            </div>
            {st.packages.map((p) => (
              <div key={p.id} className="flex animate-pop items-center justify-between gap-2 rounded-xl border border-line p-3 text-xs">
                <div>
                  <p className="font-semibold">
                    {p.carrier} · {p.desc}
                  </p>
                  <p className="text-muted">
                    {p.to} · recibido {p.at}
                    {p.deliveredTo && ` · entregado a ${p.deliveredTo} ${p.deliveredAt}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={pkgColor[p.status]}>{p.status}</Badge>
                  {p.status === "Notificado" && <Btn onClick={() => deliver(p.id)}>Entregar</Btn>}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Minuta · turno Noche</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {unusedPresets.map((p) => (
                <button key={p.text} onClick={() => addMinuta(p)} className="rounded-full border border-accent/40 px-3 py-1 text-xs text-accent transition hover:bg-accent/10">
                  + {p.type}: {p.text}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {st.minuta.map((m) => (
                <div key={m.id} className="animate-pop rounded-xl border border-line p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p>
                      <span className="font-semibold">{m.type}</span> · {m.at} · {m.text}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted" title="Las entradas de la minuta no se editan ni se borran">
                      🔒 No editable
                    </span>
                  </div>
                  {m.notes.map((n, i) => (
                    <p key={i} className="mt-1 border-l-2 border-accent/50 pl-2 text-muted">
                      {n.text} <span className="text-[10px]">— {n.by}, {n.at}</span>
                    </p>
                  ))}
                  {m.notes.length === 0 && (
                    <button onClick={() => addNote(m.id)} className="mt-1 text-[11px] text-accent hover:underline">
                      Agregar una nota
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {st.log.length > 0 && (
            <Btn tone="ghost" onClick={reset}>
              Reiniciar
            </Btn>
          )}
        </div>
      }
      side={
        <>
          <Panel title="Notificaciones al residente" icon="bell">
            {st.emails.length === 0 ? (
              <p className="text-xs text-muted">Los paquetes avisan al residente por correo y en la plataforma.</p>
            ) : (
              st.emails.map((e, i) => (
                <p key={i} className="animate-pop rounded-lg bg-bg/70 px-2 py-1.5 text-xs">
                  {e}
                </p>
              ))
            )}
          </Panel>
          <Panel title="Reglas de la minuta">
            <p className="text-xs text-muted">Tipos: Novedad, Observación, Incidente y Mantenimiento. Turnos: Mañana, Tarde y Noche. Una entrada nunca se edita ni se borra: solo se le agregan notas firmadas.</p>
          </Panel>
        </>
      }
    />
  );
}

/* ───────────────────────────── 4. Asamblea ───────────────────────────── */

const OWNERS = [
  ["Apto 101", "Carlos Pérez", 12.5],
  ["Apto 102", "Ana Ríos", 11.8],
  ["Apto 201", "Pedro Silva", 11.2],
  ["Apto 202", "Lucía Torres", 10.6],
  ["Apto 301", "Jorge Díaz", 10.1],
  ["Apto 302", "Laura Gómez", 9.7],
  ["Apto 401", "Marta León", 9.4],
  ["Apto 402", "Felipe Rojas", 8.9],
  ["Apto 501", "Sara Méndez", 8.3],
  ["Apto 502", "Diego Vargas", 7.5],
].map(([unit, name, coef]) => ({ unit, name, coef }));
const QUORUM = 51;
const VOTE_COLORS = { Sí: "#10B981", No: "#EF4444", Abstención: "#94A3B8" };

function Asamblea() {
  const { st, update, sequence, busy, reset } = useSim(() => ({ present: [], status: "Programada", vote: "pending", votes: {}, log: [] }));
  const log = addLog(update);
  const presentCoef = OWNERS.filter((o) => st.present.includes(o.unit)).reduce((a, o) => a + o.coef, 0);
  const hasQuorum = presentCoef >= QUORUM;
  const statusColor = { Programada: "#94A3B8", "En Curso": "#3B82F6", Finalizada: "#10B981" }[st.status];

  const checkIn = (o) => {
    update((x) => x.present.push(o.unit));
    const total = presentCoef + o.coef;
    log(`Asistencia por QR: ${o.name} (${o.unit}, ${pct(o.coef)}) · quórum ${pct(total)}`, total >= QUORUM && presentCoef < QUORUM ? "ok" : "info");
  };
  const voteRest = () =>
    sequence(async (wait) => {
      const options = ["Sí", "Sí", "Sí", "No", "Abstención"];
      for (const o of OWNERS.filter((y) => st.present.includes(y.unit) && !st.votes[y.unit])) {
        update((x) => (x.votes[o.unit] = options[Math.floor(Math.random() * options.length)]));
        await wait(350);
      }
    });
  const tally = Object.values(st.votes).reduce((a, v) => ({ ...a, [v]: (a[v] ?? 0) + 1 }), {});
  const allVoted = st.present.length > 0 && st.present.every((u) => st.votes[u]);

  return (
    <Layout
      hint={
        st.status === "Programada"
          ? hasQuorum
            ? "Hay quórum: ya puedes iniciar la asamblea."
            : `Registra la asistencia de los propietarios hasta superar el ${QUORUM} % del coeficiente.`
          : st.vote === "open"
          ? "Vota por algunos propietarios o completa los votos al azar, y cierra la votación."
          : st.status === "Finalizada"
          ? "Asamblea finalizada."
          : "Abre la votación del presupuesto."
      }
      log={st.log}
      main={
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold">Asamblea ordinaria · Edificio Las Palmas</p>
              <p className="text-xs text-muted">Quórum por coeficiente de los propietarios presentes</p>
            </div>
            <Badge color={statusColor}>{st.status}</Badge>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold">Quórum {pct(presentCoef)}</span>
              <span className="text-muted">requerido {QUORUM} %</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-line/60">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${presentCoef}%`, background: hasQuorum ? "#10B981" : "#F59E0B" }} />
              <span className="absolute inset-y-0 w-0.5 bg-ink/70" style={{ left: `${QUORUM}%` }} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {OWNERS.map((o) => {
              const here = st.present.includes(o.unit);
              const v = st.votes[o.unit];
              return (
                <div key={o.unit} className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition ${here ? "border-accent/50 bg-accent/5" : "border-line"}`}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.name}</p>
                    <p className="text-muted">
                      {o.unit} · {pct(o.coef)}
                    </p>
                  </div>
                  {!here && st.status !== "Finalizada" && (
                    <button onClick={() => checkIn(o)} className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] transition hover:border-accent hover:text-accent">
                      Registrar asistencia
                    </button>
                  )}
                  {here && st.vote === "open" && !v && (
                    <div className="flex shrink-0 gap-1">
                      {["Sí", "No", "Abstención"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => update((x) => (x.votes[o.unit] = opt))}
                          className="rounded-full border px-2 py-0.5 text-[10px] transition hover:brightness-125"
                          style={{ borderColor: VOTE_COLORS[opt], color: VOTE_COLORS[opt] }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {here && v && <Badge color={VOTE_COLORS[v]}>{v}</Badge>}
                  {here && !v && st.vote !== "open" && <Badge color="#10B981">Presente</Badge>}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {st.status === "Programada" && (
              <Btn
                disabled={!hasQuorum}
                onClick={() => {
                  update((x) => (x.status = "En Curso"));
                  log("Asamblea En Curso", "ok");
                }}
              >
                Iniciar asamblea
              </Btn>
            )}
            {st.status === "En Curso" && st.vote === "pending" && (
              <Btn
                onClick={() => {
                  update((x) => (x.vote = "open"));
                  log("Votación abierta: «¿Aprobar el presupuesto 2027?» (Sí / No / Abstención)");
                }}
              >
                Abrir votación
              </Btn>
            )}
            {st.vote === "open" && !allVoted && (
              <Btn tone="ghost" onClick={voteRest} disabled={busy}>
                Completar votos al azar
              </Btn>
            )}
            {st.vote === "open" && (
              <Btn
                tone="warm"
                disabled={Object.keys(st.votes).length === 0}
                onClick={() => {
                  update((x) => {
                    x.vote = "closed";
                    x.status = "Finalizada";
                  });
                  log(`Votación cerrada: Sí ${tally["Sí"] ?? 0}, No ${tally.No ?? 0}, Abstención ${tally["Abstención"] ?? 0}`, "ok");
                  log("Asamblea Finalizada");
                }}
              >
                Cerrar votación
              </Btn>
            )}
            {st.status === "Finalizada" && (
              <Btn tone="ghost" onClick={reset}>
                Reiniciar
              </Btn>
            )}
          </div>
        </div>
      }
      side={
        <>
          <Panel title="Votación">
            <p className="text-xs font-semibold">¿Aprobar el presupuesto 2027?</p>
            <Row k="Estado" v={{ pending: "Pendiente", open: "Abierta", closed: "Cerrada" }[st.vote]} />
            {["Sí", "No", "Abstención"].map((opt) => (
              <div key={opt}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: VOTE_COLORS[opt] }}>{opt}</span>
                  <span>{tally[opt] ?? 0}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
                  <div className="h-full transition-all" style={{ width: `${((tally[opt] ?? 0) / Math.max(1, st.present.length)) * 100}%`, background: VOTE_COLORS[opt] }} />
                </div>
              </div>
            ))}
          </Panel>
          <Panel title="Cómo cuenta el sistema">
            <p className="text-xs text-muted">
              El quórum suma el coeficiente de los propietarios presentes. En los resultados, cada propietario presente cuenta como un voto. Solo los propietarios votan.
            </p>
          </Panel>
        </>
      }
    />
  );
}

/* ───────────────────────────── 5. PQRS ───────────────────────────── */

const PQRS_FORM_URL = "https://contagracia.com/ph/pqrs/2bf7cc00-acfc-444c-98df-1790907c4c4a";
const PQRS_STATUS = { Abierto: "#3B82F6", "En Proceso": "#F59E0B", Resuelto: "#10B981", Cerrado: "#94A3B8" };

function Pqrs() {
  const { st, update, sequence, busy, reset } = useSim(() => ({ ticket: null, day: 0, flows: [], messages: [], emails: [], log: [] }));
  const log = addLog(update);

  const file = () =>
    sequence(async (wait) => {
      update((x) => {
        x.ticket = { number: 42, type: "Queja", priority: "Alta", subject: "Filtración en el parqueadero", status: "Abierto" };
        x.messages.push({ from: "Residente (QR público)", text: "Hay una filtración de agua en el sótano 1, cerca del parqueadero P-12." });
      });
      log("PQRS #42 radicada desde el formulario público (QR)");
      await wait(900);
      update((x) => x.flows.push({ trigger: "PQRS radicada", flow: "Acuse de recibo automático de PQRS" }));
      update((x) => {
        x.messages.push({ from: "Contagracia (automático)", text: "Recibimos tu PQRS #42. Te mantendremos al tanto por este medio." });
        x.emails.unshift("Acuse de recibo de la PQRS #42 → residente");
      });
      log("Flujo «Acuse de recibo automático de PQRS»: mensaje y correo al residente", "ok");
      await wait(900);
      update((x) => {
        x.flows.push({ trigger: "PQRS radicada", flow: "Resumen de PQRS nueva en la campanita" });
        x.emails.unshift("🔔 Nueva PQRS #42 · Queja · Alta → administración");
      });
      log("Flujo «Resumen de PQRS nueva en la campanita»: aviso a la administración");
    });

  const skip = () =>
    sequence(async (wait) => {
      update((x) => (x.day = 3));
      log("Pasan 3 días sin respuesta de la administración", "warn");
      await wait(900);
      update((x) => {
        x.flows.push({ trigger: "Una PQRS lleva días sin respuesta", flow: "Escalar PQRS sin respuesta a los 3 días" });
        x.ticket.status = "En Proceso";
        x.emails.unshift("⚠️ PQRS #42 sin respuesta hace 3 días → administrador");
      });
      log("Flujo «Escalar PQRS sin respuesta a los 3 días»: pasa a En Proceso y avisa al administrador", "ok");
    });

  const answer = () => {
    update((x) => {
      x.messages.push({ from: "Administración", text: "Ya vino el plomero y reparó la tubería. Gracias por avisar." });
      x.ticket.status = "Resuelto";
      x.emails.unshift("Tu PQRS #42 cambió a Resuelto → residente");
    });
    log("La administración responde: PQRS Resuelto (correo al residente)");
  };
  const closeTicket = () => {
    update((x) => {
      x.ticket.status = "Cerrado";
      x.emails.unshift("Tu PQRS #42 fue cerrada → residente");
    });
    log("PQRS #42 Cerrado", "ok");
  };

  return (
    <Layout
      hint={
        !st.ticket
          ? "Radica una PQRS como residente desde el QR del conjunto."
          : st.ticket.status === "Abierto"
          ? "Nadie ha respondido… adelanta el tiempo y mira el escalamiento."
          : st.ticket.status === "En Proceso"
          ? "Responde como administración."
          : st.ticket.status === "Resuelto"
          ? "Cierra la PQRS."
          : "PQRS cerrada."
      }
      log={st.log}
      main={
        <div className="space-y-5">
          {!st.ticket ? (
            <div className="rounded-2xl border border-line p-4 text-sm">
              <p className="mb-3 font-display font-bold">Formulario público de PQRS</p>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <Row k="Tipo" v="Queja" />
                <Row k="Prioridad" v="Alta" />
                <Row k="Asunto" v="Filtración en el parqueadero" />
                <Row k="Unidad" v="Torre B · Apto 302" />
              </div>
              <div className="mt-4">
                <Btn onClick={file} disabled={busy}>
                  Radicar PQRS
                </Btn>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">
                    #{st.ticket.number} · {st.ticket.subject}
                  </p>
                  <p className="text-xs text-muted">
                    {st.ticket.type} · prioridad {st.ticket.priority} · {st.day === 0 ? "radicada hoy" : `hace ${st.day} días`}
                  </p>
                </div>
                <Badge color={PQRS_STATUS[st.ticket.status]}>{st.ticket.status}</Badge>
              </div>
              <div className="flex gap-1.5 text-[10px]">
                {Object.keys(PQRS_STATUS).map((s) => (
                  <span key={s} className={`flex-1 rounded-full py-1 text-center ${st.ticket.status === s ? "font-semibold text-bg" : "text-muted"}`} style={{ background: st.ticket.status === s ? PQRS_STATUS[s] : "transparent", border: `1px solid ${PQRS_STATUS[s]}55` }}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                {st.messages.map((m, i) => (
                  <div key={i} className="animate-pop rounded-xl border border-line p-3 text-xs">
                    <p className="mb-0.5 text-[10px] font-semibold text-accent">{m.from}</p>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {st.ticket.status === "Abierto" && (
                  <Btn tone="warm" onClick={skip} disabled={busy}>
                    ⏩ Pasan 3 días sin respuesta
                  </Btn>
                )}
                {st.ticket.status === "En Proceso" && <Btn onClick={answer}>Responder como administración</Btn>}
                {st.ticket.status === "Resuelto" && <Btn onClick={closeTicket}>Cerrar PQRS</Btn>}
                {st.ticket.status === "Cerrado" && (
                  <Btn tone="ghost" onClick={reset}>
                    Reiniciar
                  </Btn>
                )}
              </div>
            </>
          )}
        </div>
      }
      side={
        <>
          <ProdLink
            href={PQRS_FORM_URL}
            title="Formulario público de PQRS"
            description="Ejemplo real: así lo ve el residente al escanear el QR del conjunto. Puede radicar de forma anónima y recibe un código de seguimiento."
          />
          <Panel title="Flujos que se dispararon" icon="bolt">
            {st.flows.length === 0 ? (
              <p className="text-xs text-muted">Ninguno todavía.</p>
            ) : (
              st.flows.map((f, i) => (
                <div key={i} className="animate-pop rounded-lg border border-line p-2 text-[11px]">
                  <p className="text-muted">Disparador: {f.trigger}</p>
                  <p className="font-semibold">{f.flow}</p>
                </div>
              ))
            )}
          </Panel>
          <Panel title="Correos y avisos" icon="mail">
            {st.emails.length === 0 ? (
              <p className="text-xs text-muted">Cada cambio de estado avisa por correo.</p>
            ) : (
              st.emails.map((e, i) => (
                <p key={i} className="animate-pop rounded-lg bg-bg/70 px-2 py-1.5 text-xs">
                  {e}
                </p>
              ))
            )}
          </Panel>
        </>
      }
    />
  );
}

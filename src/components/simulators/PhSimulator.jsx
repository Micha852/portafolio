"use client";

import { useState } from "react";
import { Icon } from "../Icons";
import { useSim, MobileTabs, ExecLog, Panel, Row, Badge, ProdLink } from "./ui";

// Demo propia de un software de propiedad horizontal con datos ficticios de Grupo Nova.
// Siete pasos de una misma historia: lo que creas en el asistente (torres, unidades, coeficientes)
// es lo que usan después las reservas, los cobros, los documentos, la asamblea y las PQRS.

const cop = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;
const coefTxt = (m) => `${(m / 1000).toLocaleString("es-CO", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} %`;
const pct1 = (n) => `${n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const pad = (n) => String(n).padStart(2, "0");
const hour = (h) => `${pad(h)}:00`;

const TABS = [
  ["setup", "Crear copropiedad", "grid"],
  ["units", "Unidades", "users"],
  ["zones", "Zonas comunes", "calendar"],
  ["billing", "Cobros", "bell"],
  ["docs", "Documentos", "download"],
  ["asm", "Asamblea", "megaphone"],
  ["pqrs", "PQRS", "mail"],
];

const COLORS = [
  ["#0EA5A4", "Turquesa"],
  ["#6366F1", "Índigo"],
  ["#F97316", "Naranja"],
  ["#10B981", "Esmeralda"],
  ["#E11D48", "Rubí"],
];
const LOGOS = [
  ["initials", "Iniciales"],
  ["grid", "Edificio"],
  ["sparkles", "Destello"],
];

// Nombres inventados para propietarios, arrendatarios y familiares
const FIRST = ["Andrés", "Beatriz", "Carlos", "Daniela", "Esteban", "Fernanda", "Gustavo", "Helena", "Iván", "Julián", "Karen", "Lorena", "Mauricio", "Natalia", "Óscar", "Patricia", "Ricardo", "Silvia", "Tomás", "Verónica", "Wilson", "Ximena", "Yesid", "Zulma"];
const LAST = ["Arango", "Bermúdez", "Cárdenas", "Duarte", "Escobar", "Franco", "Galindo", "Herrera", "Isaza", "Jaramillo", "Londoño", "Montoya", "Navarro", "Osorio", "Pineda", "Quintero", "Restrepo", "Salazar", "Trujillo", "Vélez", "Zapata", "Acosta"];
const FAMILY = ["Martín", "Emilia", "Simón", "Renata", "Jacobo", "Antonia"];
const person = (i) => `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`;
const NEW_OWNERS = [230, 231, 232, 233].map(person);
const NEW_RESIDENTS = [240, 241, 242, 243].map(person);
const PLATES = ["JKM 482", "RTV 315", "HQL 907", "BNZ 228", "FWX 640"];
const plate = (i) => `${String.fromCharCode(65 + ((i * 5) % 26))}${String.fromCharCode(65 + ((i * 11 + 4) % 26))}${String.fromCharCode(65 + ((i * 3 + 9) % 26))} ${100 + ((i * 137) % 900)}`;

const DAYS = [
  ["sab", "Sáb 17 oct"],
  ["dom", "Dom 18 oct"],
];
const ZONE_PRESETS = [
  { name: "Gimnasio", cap: 8, from: 6, to: 21, slot: 1 },
  { name: "Terraza de juegos", cap: 15, from: 9, to: 19, slot: 2 },
  { name: "Cancha múltiple", cap: 20, from: 7, to: 21, slot: 2 },
];
const UPLOAD_PRESETS = [
  { name: "Acta de consejo · septiembre.pdf", cat: "Actas", size: "320 KB" },
  { name: "Plano hidráulico.pdf", cat: "Planos", size: "2,4 MB" },
  { name: "Contrato de aseo 2027.pdf", cat: "Contratos", size: "610 KB" },
  { name: "Reglamento de mascotas.pdf", cat: "Reglamento", size: "180 KB" },
];
const FOLDERS = ["Actas", "Reglamento", "Contratos", "Planos"];
const COMM_PRESETS = [
  { subject: "Corte de agua programado", body: "El martes 20 de octubre, de 8:00 a 14:00, no habrá agua por lavado de tanques." },
  { subject: "Mantenimiento de ascensores", body: "Esta semana el ascensor quedará fuera de servicio de 9:00 a 12:00 cada día." },
  { subject: "Jornada de fumigación", body: "El sábado fumigaremos zonas comunes. Mantén las mascotas dentro de casa." },
];
const PQRS_PRESETS = [
  { type: "Queja", subject: "Ruido después de las 22:00", text: "Hay música alta en el piso de arriba casi todas las noches." },
  { type: "Petición", subject: "Copia del reglamento firmado", text: "Necesito una copia del reglamento para mi contrato de arriendo." },
  { type: "Reclamo", subject: "Gotera en el parqueadero", text: "Cae agua sobre los carros cerca de la columna 12 cuando llueve." },
];
const ADMIN_REPLIES = [
  "Recibimos tu solicitud. Ya la asignamos al equipo de mantenimiento.",
  "Hoy pasa el técnico a revisar. Te contamos qué encuentra.",
  "Quedó solucionado. Si vuelve a pasar, responde aquí mismo.",
];
const PQRS_STATES = [
  ["Recibida", "#3B82F6"],
  ["En trámite", "#F59E0B"],
  ["Resuelta", "#10B981"],
];
const VOTE_COLORS = { Sí: "#10B981", No: "#EF4444", Abstención: "#94A3B8" };
const VOTE_PATTERN = ["Sí", "Sí", "No", "Sí", "Abstención", "Sí", "No", "Sí"];
const ROLE_COLORS = { Propietario: "#10B981", Arrendatario: "#F59E0B", Familiar: "#94A3B8" };

/* ───────────────────────── Generación de la copropiedad ───────────────────────── */

// Crea las unidades, reparte el coeficiente por área privada y ajusta el redondeo para que sume 100 %
function buildCopro(c) {
  const units = [];
  let k = 0;
  for (let t = 1; t <= c.towers; t++)
    for (let f = 1; f <= c.floors; f++)
      for (let n = 1; n <= c.perFloor; n++) {
        const num = `${f}${pad(n)}`;
        units.push({ id: `T${t}-${num}`, label: `Apto ${num}`, group: `Torre ${t}`, tower: t, floor: f, type: "apto", area: n === 1 || n === c.perFloor ? 78 : 64, i: k++ });
      }
  for (let n = 1; n <= c.locales; n++) units.push({ id: `L-${pad(n)}`, label: `Local ${pad(n)}`, group: "Comercial", tower: 0, floor: 1, type: "local", area: 52, i: k++ });
  for (let n = 1; n <= c.parq; n++) units.push({ id: `P-${pad(n)}`, label: `Parqueadero ${pad(n)}`, group: "Parqueaderos", tower: 0, floor: 0, type: "parq", area: 12.5, i: k++ });

  const total = units.reduce((a, u) => a + u.area, 0);
  units.forEach((u) => (u.coefM = Math.round((u.area / total) * 100000)));
  const diff = 100000 - units.reduce((a, u) => a + u.coefM, 0);
  units[0].coefM += diff;

  const focusId = `T1-${Math.min(3, c.floors)}02`;
  const aptos = units.filter((u) => u.type === "apto");
  let tenants = 0;
  units.forEach((u) => {
    u.parking = null;
    u.vehicles = [];
    u.residents = [];
    u.history = [{ text: `Unidad creada · ${u.area} m² · coeficiente ${coefTxt(u.coefM)}` }];
    u.pending = false;
    u.reminder = null;
    if (u.type === "parq") {
      const linked = aptos[u.i - aptos.length - c.locales];
      u.owner = linked ? linked.owner : person(u.i);
      if (linked) {
        linked.parking = u.id;
        linked.vehicles.push({ plate: plate(linked.i), kind: "Carro" });
      }
      return;
    }
    u.owner = person(u.i);
    const rented = u.id === focusId || (u.type === "apto" && u.i % 5 === 2);
    if (rented) {
      const tenant = person(150 + tenants++);
      u.residents.push({ name: tenant, role: "Arrendatario" });
      u.history.push({ text: `Arriendo registrado: vive ${tenant}` });
    } else {
      u.residents.push({ name: u.owner, role: "Propietario" });
    }
    if (u.type === "apto" && u.i % 3 === 0) u.residents.push({ name: `${FAMILY[u.i % FAMILY.length]} ${u.residents[0].name.split(" ")[1]}`, role: "Familiar" });
    u.pending = u.id !== focusId && (u.i * 7 + 3) % 10 < 3;
  });
  // Tercera unidad con saldo pendiente: no tiene WhatsApp registrado
  const noPhone = units.filter((u) => u.pending)[2];
  if (noPhone) noPhone.noPhone = true;
  return { units, focusId, diff };
}

const visibleTo = (doc, u) => doc.vis === "all" || (doc.vis === "tower" && u && u.tower === doc.visValue) || (doc.vis === "unit" && u && u.id === doc.visValue);
const visLabel = (doc) => (doc.vis === "all" ? "Todos" : doc.vis === "tower" ? `Torre ${doc.visValue}` : `Unidad ${doc.visValue}`);

function ownersOf(units) {
  const map = new Map();
  for (const u of units) {
    if (!u.owner) continue;
    const o = map.get(u.owner) ?? { name: u.owner, coefM: 0, units: [] };
    o.coefM += u.coefM;
    o.units.push(u.id);
    map.set(u.owner, o);
  }
  return [...map.values()];
}

const init = () => ({
  wiz: { step: 0, name: "Conjunto Residencial Prados de Nova", address: "Carrera 9 # 140-25, Bogotá", color: COLORS[0][0], logo: "initials", towers: 2, floors: 5, perFloor: 4, locales: 2, parq: 8 },
  built: null,
  progress: 0,
  units: [],
  focusId: null,
  sel: null,
  group: "Torre 1",
  ownerPick: 0,
  resPick: 0,
  resRole: "Familiar",
  carPick: 0,
  zones: [
    { id: "salon", name: "Salón social", cap: 40, from: 10, to: 22, slot: 4, alDia: true, approval: false, weekly: true },
    { id: "bbq", name: "Zona BBQ", cap: 12, from: 11, to: 21, slot: 2, alDia: false, approval: true, weekly: false },
  ],
  zoneForm: null,
  bookings: [],
  bk: { zone: "salon", unit: null, day: "sab", start: 14, guests: 25 },
  checks: null,
  budget: 16000000,
  channel: "whatsapp",
  preview: false,
  filter: "all",
  docs: [],
  folder: "Actas",
  upload: { preset: 0, vis: "tower", tower: 1 },
  uploading: null,
  viewAs: "admin",
  comms: [],
  comm: { preset: 0, audience: "all" },
  asm: { present: [], tried: false, question: null, votes: {}, closed: false },
  tickets: [],
  pq: 0,
  pqNew: false,
  speaker: "admin",
  reply: ADMIN_REPLIES[0],
  notes: [],
  log: [],
  clock: 9 * 60 + 12,
});

/* ───────────────────────────── Componente principal ───────────────────────────── */

export default function PhSimulator() {
  const sim = useSim(init);
  const { st, update, reset } = sim;
  const [tab, setTab] = useState("setup");
  const [view, setView] = useState("main");
  const [seen, setSeen] = useState(0);

  const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));
  const notify = (channel, to, text) => update((x) => x.notes.unshift({ id: x.notes.length, channel, to, text }));
  const tick = () => {
    const t = st.clock;
    update((x) => (x.clock += 6));
    return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
  };
  const ctx = { ...sim, log, notify, tick, setTab };

  const unitById = (id) => st.units.find((u) => u.id === id);
  const focus = unitById(st.focusId);
  const blocked = st.units.find((u) => u.pending && u.type === "apto");
  const color = st.wiz.color;

  // Datos de ejemplo para quien entra directo a otra pestaña
  const quickBuild = () => applyBuild(ctx, false);

  const views = {
    setup: Setup,
    units: Units,
    zones: Zones,
    billing: Billing,
    docs: Docs,
    asm: Assembly,
    pqrs: Pqrs,
  };
  const View = views[tab];
  const screen = st.built || tab === "setup" ? View({ ctx, unitById, focus, blocked }) : null;

  const switchView = (v) => {
    setView(v);
    if (v === "system") setSeen(st.log.length);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera: identidad de la copropiedad + reinicio */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo wiz={st.wiz} size="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{st.wiz.name || "Copropiedad sin nombre"}</p>
            <p className="truncate text-[11px] text-muted">
              Grupo Nova · {st.built ? `${st.units.length} unidades · ${st.wiz.towers} torre${st.wiz.towers > 1 ? "s" : ""}` : "en configuración"}
            </p>
          </div>
        </div>
        <button
          data-guide="ph-reset"
          onClick={() => {
            reset();
            setTab("setup");
            setSeen(0);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
        >
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Reiniciar
        </button>
      </div>

      <div data-guide="ph-tabs" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {TABS.map(([k, label, icon], i) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === k ? "text-bg" : "text-muted hover:text-ink"}`}
            style={tab === k ? { background: color } : undefined}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${tab === k ? "bg-bg/25" : "border border-line"}`}>{i + 1}</span>
            <Icon name={icon} className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <MobileTabs
        tabs={[
          ["main", "Pantalla"],
          ["system", "Sistema"],
        ]}
        tab={view}
        setTab={switchView}
        pulse={st.log.length > seen ? "system" : null}
      />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[1fr_320px]">
        <section className={`${view === "main" ? "flex" : "hidden"} h-full min-h-0 flex-col lg:flex`}>
          <div data-guide="ph-hint" className="flex shrink-0 items-center gap-2 border-b border-line bg-warm/10 px-5 py-2.5 text-xs font-medium text-warm">
            <Icon name="arrow" className="h-3.5 w-3.5 shrink-0" />
            <span>{screen ? screen.hint : "Primero crea la copropiedad: todo lo demás sale de su estructura."}</span>
          </div>
          <div data-guide="ph-main" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {screen ? (
              screen.main
            ) : (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed border-line p-6 text-center">
                <Icon name="grid" className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-2 font-display font-bold">Aún no hay copropiedad</p>
                <p className="mt-1 text-xs text-muted">Esta pantalla trabaja sobre las torres, unidades y coeficientes que crees en el paso 1.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Btn onClick={() => setTab("setup")} tone="ghost">
                    Ir al asistente
                  </Btn>
                  <Btn onClick={quickBuild} color={color}>
                    Usar datos de ejemplo
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside data-guide="ph-system" className={`${view === "system" ? "flex" : "hidden"} h-full min-h-0 flex-col border-line lg:flex lg:border-l`}>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Lo que pasa en el sistema
            </p>
            {screen?.side}
            <Panel title={`Notificaciones enviadas · ${st.notes.length}`} icon="bell">
              {st.notes.length === 0 ? (
                <p className="text-xs text-muted">Correos, WhatsApp y avisos en la app aparecen aquí.</p>
              ) : (
                st.notes.slice(0, 4).map((n) => (
                  <div key={n.id} className="animate-pop rounded-lg bg-bg/70 px-2 py-1.5 text-[11px]">
                    <span className="font-semibold text-accent">{n.channel}</span> → {n.to}
                    <p className="text-muted">{n.text}</p>
                  </div>
                ))
              )}
            </Panel>
          </div>
          <ExecLog key={view} log={st.log} className="h-40 lg:h-52" />
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────────── Piezas compartidas ───────────────────────────── */

function Btn({ onClick, disabled, children, tone = "accent", color, small }) {
  const tones = {
    accent: "bg-accent text-bg",
    warm: "bg-warm text-bg",
    ghost: "border border-line text-ink hover:border-accent hover:text-accent",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={color && tone === "accent" ? { background: color } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full ${small ? "px-3 py-1 text-[11px]" : "px-4 py-2 text-xs"} font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function Logo({ wiz, size }) {
  const initials = (wiz.name || "?")
    .split(" ")
    .filter((w) => w.length > 2 && w[0] === w[0].toUpperCase())
    .slice(-2)
    .map((w) => w[0])
    .join("");
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${size}`} style={{ background: wiz.color }}>
      {wiz.logo === "initials" ? initials || "PH" : <Icon name={wiz.logo} className="h-1/2 w-1/2" />}
    </span>
  );
}

function Stepper({ label, value, min, max, onChange, disabled }) {
  return (
    <div className="rounded-xl border border-line p-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <button disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line text-sm disabled:opacity-30">
          −
        </button>
        <span className="font-display text-lg font-bold">{value}</span>
        <button disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line text-sm disabled:opacity-30">
          +
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted">{label}</span>
      {children}
    </label>
  );
}

function Title({ children, right }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</p>
      {right}
    </div>
  );
}

function Toggle({ on, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="accent-[rgb(var(--accent))]" />
      {children}
    </label>
  );
}

const unitName = (u) => (u ? (u.type === "apto" ? `${u.group} · ${u.label}` : u.label) : "—");
const contactOf = (u) => u.residents[0]?.name ?? u.owner;

// Guarda la copropiedad generada y deja listas las piezas que usan las otras pestañas
function applyBuild({ update, log, st }, silent) {
  const { units, focusId, diff } = buildCopro(st.wiz);
  const other = units.find((u) => u.type === "apto" && u.id !== focusId && !u.pending && u.i > 3) ?? units[0];
  update((x) => {
    x.units = units;
    x.focusId = focusId;
    x.sel = focusId;
    x.group = "Torre 1";
    x.built = { diff, at: Date.now() };
    x.progress = 100;
    x.bk.unit = focusId;
    x.upload.tower = x.wiz.towers;
    x.wiz.step = 2;
    x.bookings = [{ id: 0, zone: "salon", day: "sab", start: 14, unit: other.id, by: contactOf(other), status: "Confirmada" }];
    x.docs = [
      { id: 0, name: "Reglamento de propiedad horizontal.pdf", cat: "Reglamento", vis: "all", size: "1,1 MB" },
      { id: 1, name: "Manual de convivencia.pdf", cat: "Reglamento", vis: "all", size: "540 KB" },
      { id: 2, name: "Acta asamblea ordinaria 2026.pdf", cat: "Actas", vis: "all", size: "890 KB" },
      { id: 3, name: "Contrato de vigilancia 2026.pdf", cat: "Contratos", vis: "all", size: "700 KB" },
      { id: 4, name: "Planos eléctricos Torre 1.pdf", cat: "Planos", vis: "tower", visValue: 1, size: "3,2 MB" },
      { id: 5, name: `Plano de la unidad ${focusId}.pdf`, cat: "Planos", vis: "unit", visValue: focusId, size: "450 KB" },
    ];
  });
  if (silent !== true) {
    log(`Copropiedad creada con datos de ejemplo: ${units.length} unidades`, "ok");
    log("Coeficientes calculados por área privada · suma 100,000 %", "ok");
  }
}

/* ───────────────────────────── 1. Crear la copropiedad ───────────────────────────── */

function Setup({ ctx }) {
  const { st, update, log, sequence, busy, setTab } = ctx;
  const w = st.wiz;
  const set = (k) => (v) => update((x) => (x.wiz[k] = v));
  const aptCount = w.towers * w.floors * w.perFloor;
  const total = aptCount + w.locales + w.parq;
  const locked = !!st.built || busy;

  const generate = () =>
    sequence(async (wait) => {
      update((x) => (x.progress = 0));
      log(`Asistente: «${w.name}» · ${w.address}`);
      for (let t = 1; t <= w.towers; t++) {
        log(`Torre ${t}: ${w.floors} pisos × ${w.perFloor} apartamentos`);
        update((x) => (x.progress = Math.round((t / (w.towers + 2)) * 100)));
        await wait(450);
      }
      if (w.locales || w.parq) {
        log(`${w.locales} locales comerciales y ${w.parq} parqueaderos privados`);
        update((x) => (x.progress = Math.round(((w.towers + 1) / (w.towers + 2)) * 100)));
        await wait(450);
      }
      log("Calculando coeficientes: área privada de cada unidad ÷ área total");
      await wait(500);
      applyBuild(ctx, true);
      const diff = st.built.diff;
      log(`${total} unidades creadas · suma de coeficientes 100,000 %`, "ok");
      if (diff) log(`Ajuste de redondeo de ${coefTxt(Math.abs(diff))} aplicado a ${st.units[0].id}`, "warn");
    });

  const hint = st.built
    ? `Listo: ${st.units.length} unidades que suman 100 %. Sigue con «Unidades» para ver quién vive en cada una.`
    : ["Ponle nombre a la copropiedad, escribe la dirección y elige su color y su logo.", "Define torres, pisos y unidades por piso. Mira cómo cambia el edificio.", "Revisa el resumen y genera las unidades: el sistema reparte los coeficientes."][w.step];

  const byType = [
    ["Apartamentos", "apto", aptCount, "64 m² interior · 78 m² esquinero"],
    ["Locales", "local", w.locales, "52 m²"],
    ["Parqueaderos privados", "parq", w.parq, "12,5 m²"],
  ].filter((r) => r[2] > 0);

  const main = (
    <div className="space-y-5">
      <div data-guide="ph-wizard" className="flex gap-1.5 text-[11px]">
        {["Datos", "Estructura", "Generar"].map((s, i) => (
          <button
            key={s}
            disabled={locked}
            onClick={() => update((x) => (x.wiz.step = i))}
            className={`flex-1 rounded-full border py-1.5 font-semibold transition ${w.step === i ? "text-white" : w.step > i ? "text-ink" : "text-muted"}`}
            style={{ borderColor: w.step >= i ? w.color : undefined, background: w.step === i ? w.color : undefined }}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {w.step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Field label="Nombre de la copropiedad">
              <input className={inputCls} value={w.name} disabled={locked} onChange={(e) => set("name")(e.target.value)} />
            </Field>
            <Field label="Dirección">
              <input className={inputCls} value={w.address} disabled={locked} onChange={(e) => set("address")(e.target.value)} />
            </Field>
            <Field label="Color de la marca">
              <div className="flex gap-2">
                {COLORS.map(([c, n]) => (
                  <button key={c} title={n} disabled={locked} onClick={() => set("color")(c)} className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition ${w.color === c ? "ring-2" : ""}`} style={{ background: c, "--tw-ring-color": c }} />
                ))}
              </div>
            </Field>
            <Field label="Logo">
              <div className="flex gap-2">
                {LOGOS.map(([k, n]) => (
                  <button key={k} disabled={locked} onClick={() => set("logo")(k)} className={`rounded-full border px-3 py-1 text-[11px] transition ${w.logo === k ? "border-accent text-accent" : "border-line text-muted"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] text-muted">Así lo ven los residentes al entrar</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-2 px-3 py-2.5 text-white" style={{ background: w.color }}>
                <Logo wiz={{ ...w, color: "rgba(255,255,255,.2)" }} size="h-8 w-8" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{w.name || "Sin nombre"}</p>
                  <p className="truncate text-[10px] opacity-80">{w.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-3 text-center text-[10px] text-muted">
                {["Reservas", "Mis pagos", "Documentos"].map((s) => (
                  <span key={s} className="rounded-lg border border-line py-2">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {w.step === 1 && (
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Stepper label="Torres" value={w.towers} min={1} max={3} onChange={set("towers")} disabled={locked} />
              <Stepper label="Pisos" value={w.floors} min={3} max={8} onChange={set("floors")} disabled={locked} />
              <Stepper label="Aptos/piso" value={w.perFloor} min={2} max={6} onChange={set("perFloor")} disabled={locked} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stepper label="Locales" value={w.locales} min={0} max={4} onChange={set("locales")} disabled={locked} />
              <Stepper label="Parqueaderos privados" value={w.parq} min={0} max={12} onChange={set("parq")} disabled={locked} />
            </div>
            <p className="text-xs text-muted">
              Tipos de unidad: <b className="text-ink">apartamento</b>, <b className="text-ink">local</b> y <b className="text-ink">parqueadero</b>. Cada parqueadero privado queda a nombre del dueño de un apartamento.
            </p>
          </div>
          <div className="flex items-end justify-center gap-3 rounded-2xl border border-line p-4">
            {Array.from({ length: w.towers }, (_, t) => (
              <div key={t} className="text-center">
                <div className="space-y-0.5 rounded-t-lg border border-line p-1">
                  {Array.from({ length: w.floors }, (_, f) => (
                    <div key={f} className="flex gap-0.5">
                      {Array.from({ length: w.perFloor }, (_, n) => (
                        <span key={n} className="h-3 w-3 rounded-sm transition" style={{ background: w.color, opacity: n === 0 || n === w.perFloor - 1 ? 0.9 : 0.5 }} />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted">Torre {t + 1}</p>
              </div>
            ))}
            {w.locales > 0 && (
              <div className="text-center">
                <div className="flex gap-0.5 rounded-t-lg border border-line p-1">
                  {Array.from({ length: w.locales }, (_, n) => (
                    <span key={n} className="h-4 w-4 rounded-sm bg-warm/70" />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted">Comercial</p>
              </div>
            )}
          </div>
        </div>
      )}

      {w.step === 2 && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th className="py-2">Tipo</th>
                  <th>Cantidad</th>
                  <th>Área privada</th>
                  <th className="text-right">Coeficiente total</th>
                </tr>
              </thead>
              <tbody>
                {byType.map(([n, type, count, area]) => (
                  <tr key={type} className="border-b border-line/60">
                    <td className="py-2 font-medium">{n}</td>
                    <td>{count}</td>
                    <td className="text-muted">{area}</td>
                    <td className="text-right font-semibold">{st.built ? coefTxt(st.units.filter((u) => u.type === type).reduce((a, u) => a + u.coefM, 0)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted">{st.built ? `${st.units.length} unidades creadas` : busy ? "Generando…" : `${total} unidades por crear`}</span>
              <span className={`font-display text-xl font-bold ${st.built ? "text-accent" : ""}`}>{st.built ? "Suma 100,000 %" : `${st.progress} %`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line/60">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${st.progress}%`, background: w.color }} />
            </div>
            {st.built && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-accent">
                <Icon name="check" className="h-3.5 w-3.5" />
                Ejemplo: {st.units[0].id} ({st.units[0].area} m²) tiene {coefTxt(st.units[0].coefM)}; {st.units[1]?.id} ({st.units[1]?.area} m²) tiene {coefTxt(st.units[1]?.coefM ?? 0)}.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {w.step > 0 && !locked && (
          <Btn tone="ghost" onClick={() => update((x) => x.wiz.step--)}>
            Atrás
          </Btn>
        )}
        {w.step < 2 && (
          <Btn color={w.color} disabled={!w.name.trim() || busy} onClick={() => update((x) => x.wiz.step++)}>
            Siguiente
          </Btn>
        )}
        {w.step === 2 && !st.built && (
          <Btn color={w.color} disabled={busy} onClick={generate}>
            <Icon name="bolt" className="h-3.5 w-3.5" /> Generar {total} unidades
          </Btn>
        )}
        {st.built && (
          <Btn color={w.color} onClick={() => setTab("units")}>
            Ver unidades <Icon name="arrow" className="h-3.5 w-3.5" />
          </Btn>
        )}
      </div>
    </div>
  );

  const side = (
    <Panel title="Registro de la copropiedad" icon="grid">
      <Row k="Nombre" v={w.name || "—"} />
      <Row k="Dirección" v={w.address || "—"} />
      <Row k="Torres" v={w.towers} />
      <Row k="Unidades" v={st.built ? st.units.length : `${total} (sin crear)`} />
      <Row k="Suma de coeficientes" v={st.built ? <span className="text-accent">100,000 %</span> : "—"} />
    </Panel>
  );
  return { hint, main, side };
}

/* ───────────────────────────── 2. Unidades y copropietarios ───────────────────────────── */

function Units({ ctx, unitById, focus }) {
  const { st, update, log, notify } = ctx;
  const u = unitById(st.sel) ?? focus;
  const groups = [...new Set(st.units.map((x) => x.group))];
  const inGroup = st.units.filter((x) => x.group === st.group);
  const floors = [...new Set(inGroup.map((x) => x.floor))].sort((a, b) => b - a);
  const tenant = u.residents.find((r) => r.role === "Arrendatario");

  const changeOwner = () => {
    const name = NEW_OWNERS[st.ownerPick];
    if (name === u.owner) return;
    const old = u.owner;
    update((x) => {
      const y = x.units.find((z) => z.id === u.id);
      y.owner = name;
      y.residents.forEach((r) => r.role === "Propietario" && (r.name = name));
      y.history.unshift({ text: `Cambio de propietario: ${old} → ${name}` });
      x.ownerPick = (x.ownerPick + 1) % NEW_OWNERS.length;
    });
    log(`${u.id}: nuevo propietario ${name} (antes ${old})`, "ok");
    log("Desde ahora vota en asamblea con el coeficiente de esta unidad");
    notify("Correo", name, `Bienvenido a ${st.wiz.name}: ya tienes acceso a ${u.id}`);
  };
  const addResident = () => {
    const name = NEW_RESIDENTS[st.resPick];
    const role = st.resRole;
    update((x) => {
      const y = x.units.find((z) => z.id === u.id);
      y.residents.push({ name, role });
      y.history.unshift({ text: `${role} registrado: ${name}` });
      x.resPick = (x.resPick + 1) % NEW_RESIDENTS.length;
    });
    log(`${u.id}: ${role.toLowerCase()} ${name} agregado`);
    if (role === "Arrendatario") log("Arrendatario: usa la app y reserva, pero no vota en asamblea", "warn");
    notify("App", name, `Tu acceso a ${u.id} está activo`);
  };
  const addCar = () => {
    const p = PLATES[st.carPick];
    update((x) => {
      const y = x.units.find((z) => z.id === u.id);
      y.vehicles.push({ plate: p, kind: st.carPick % 2 ? "Moto" : "Carro" });
      y.history.unshift({ text: `Vehículo ${p} registrado${y.parking ? ` en ${y.parking}` : ""}` });
      x.carPick = (x.carPick + 1) % PLATES.length;
    });
    log(`${u.id}: vehículo ${p} ${u.parking ? `asociado al parqueadero ${u.parking}` : "sin parqueadero privado (lista de visitantes)"}`);
  };
  const removeResident = (i) => {
    const r = u.residents[i];
    update((x) => {
      const y = x.units.find((z) => z.id === u.id);
      y.residents.splice(i, 1);
      y.history.unshift({ text: `Salió de la unidad: ${r.name}` });
    });
    log(`${u.id}: ${r.name} ya no figura como residente`);
  };

  const hint =
    u.history.length > 2
      ? "Bien. Todo lo que cambias queda en el historial y lo usan las demás pestañas. Sigue con «Zonas comunes»."
      : `Abre una unidad de la grilla. ${focus.id} está arrendada: cambia su propietario, agrega un residente o un vehículo.`;

  const main = (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <button key={g} onClick={() => update((x) => (x.group = g))} className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${st.group === g ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`}>
              {g}
            </button>
          ))}
        </div>
        <div data-guide="ph-grid" className="space-y-1 overflow-x-auto rounded-2xl border border-line p-3">
          {st.group.startsWith("Torre") ? (
            floors.map((f) => (
              <div key={f} className="flex items-center gap-1">
                <span className="w-10 shrink-0 text-[10px] text-muted">Piso {f}</span>
                {inGroup
                  .filter((x) => x.floor === f)
                  .map((x) => (
                    <UnitCell key={x.id} u={x} sel={u.id === x.id} color={st.wiz.color} onClick={() => update((y) => (y.sel = x.id))} />
                  ))}
              </div>
            ))
          ) : (
            <div className="flex flex-wrap gap-1">
              {inGroup.map((x) => (
                <UnitCell key={x.id} u={x} sel={u.id === x.id} color={st.wiz.color} onClick={() => update((y) => (y.sel = x.id))} />
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warm" /> Saldo pendiente
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-warm">A</span> Arrendada
          </span>
          <span>Esquineros 78 m² · interiores 64 m²</span>
        </div>
      </div>

      <div className="animate-pop space-y-3 rounded-2xl border border-line p-4" key={u.id}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg font-bold">{unitName(u)}</p>
            <p className="text-[11px] text-muted">
              {u.id} · {u.area} m² · coeficiente {coefTxt(u.coefM)}
            </p>
          </div>
          <Badge color={u.pending ? "#F59E0B" : "#10B981"}>{u.pending ? "Pendiente" : "Al día"}</Badge>
        </div>

        <div>
          <Title>Propietario</Title>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg/60 p-2 text-xs">
            <span className="font-semibold">{u.owner}</span>
            <span className="flex items-center gap-1">
              <select className={`${inputCls} w-36`} value={st.ownerPick} onChange={(e) => update((x) => (x.ownerPick = Number(e.target.value)))}>
                {NEW_OWNERS.map((n, i) => (
                  <option key={n} value={i}>
                    {n}
                  </option>
                ))}
              </select>
              <Btn small tone="ghost" onClick={changeOwner}>
                Cambiar
              </Btn>
            </span>
          </div>
        </div>

        {u.type !== "parq" && (
          <div>
            <Title>Residentes</Title>
            <div className="space-y-1">
              {u.residents.length === 0 && <p className="text-xs text-muted">Nadie vive aquí todavía.</p>}
              {u.residents.map((r, i) => (
                <div key={r.name + i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{r.name}</span>
                  <span className="flex items-center gap-1.5">
                    <Badge color={ROLE_COLORS[r.role]}>{r.role}</Badge>
                    <button onClick={() => removeResident(i)} className="text-muted hover:text-warm" aria-label={`Quitar a ${r.name}`}>
                      <Icon name="close" className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <select className={`${inputCls} w-auto`} value={st.resRole} onChange={(e) => update((x) => (x.resRole = e.target.value))}>
                <option>Familiar</option>
                <option>Arrendatario</option>
              </select>
              <Btn small tone="ghost" onClick={addResident}>
                + {NEW_RESIDENTS[st.resPick]}
              </Btn>
            </div>
            {tenant && <p className="mt-1 text-[10px] text-muted">Vive un arrendatario: recibe avisos y reserva, pero en asamblea vota {u.owner}.</p>}
          </div>
        )}

        {u.type === "apto" && (
          <div>
            <Title right={<Btn small tone="ghost" onClick={addCar}>+ Vehículo</Btn>}>Vehículos y parqueadero</Title>
            <p className="text-xs">
              Parqueadero: <b>{u.parking ?? "sin parqueadero privado"}</b>
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {u.vehicles.map((v) => (
                <span key={v.plate} className="rounded-md border border-line bg-bg/60 px-2 py-0.5 font-mono text-[11px]">
                  {v.kind} · {v.plate}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <Title>Historial</Title>
          <ol className="max-h-32 space-y-1 overflow-y-auto border-l border-line pl-3 text-[11px]">
            {u.history.map((h, i) => (
              <li key={u.history.length - i} className={i === 0 ? "text-ink" : "text-muted"}>
                {h.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );

  const owners = ownersOf(st.units);
  const side = (
    <Panel title="Censo de la copropiedad" icon="users">
      <Row k="Unidades" v={st.units.length} />
      <Row k="Propietarios distintos" v={owners.length} />
      <Row k="Unidades arrendadas" v={st.units.filter((x) => x.residents.some((r) => r.role === "Arrendatario")).length} />
      <Row k="Residentes registrados" v={st.units.reduce((a, x) => a + x.residents.length, 0)} />
      <Row k="Vehículos" v={st.units.reduce((a, x) => a + x.vehicles.length, 0)} />
    </Panel>
  );
  return { hint, main, side };
}

function UnitCell({ u, sel, color, onClick }) {
  const rented = u.residents.some((r) => r.role === "Arrendatario");
  return (
    <button
      onClick={onClick}
      className={`relative h-8 min-w-[3rem] shrink-0 rounded-lg border px-1.5 text-[11px] font-semibold transition ${sel ? "text-white" : "border-line hover:border-accent"}`}
      style={sel ? { background: color, borderColor: color } : undefined}
    >
      {u.type === "apto" ? u.label.replace("Apto ", "") : u.id}
      {u.pending && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-warm" />}
      {rented && <span className={`absolute bottom-0 left-1 text-[8px] font-bold ${sel ? "text-white" : "text-warm"}`}>A</span>}
    </button>
  );
}

/* ───────────────────────────── 3. Zonas comunes ───────────────────────────── */

function Zones({ ctx, unitById, focus, blocked }) {
  const { st, update, log, notify, sequence, busy, setTab } = ctx;
  const zone = st.zones.find((z) => z.id === st.bk.zone);
  const bu = unitById(st.bk.unit) ?? focus;
  const slots = [];
  for (let h = zone.from; h + zone.slot <= zone.to; h += zone.slot) slots.push(h);
  const taken = (h) => st.bookings.find((b) => b.zone === zone.id && b.day === st.bk.day && b.start === h && b.status !== "Rechazada");
  const aptos = st.units.filter((x) => x.type !== "parq");
  const bk = (k, v) => update((x) => {
    x.bk[k] = v;
    x.checks = null;
  });

  const book = () =>
    sequence(async (wait) => {
      const who = contactOf(bu);
      const clash = taken(st.bk.start);
      const already = st.bookings.some((b) => b.zone === zone.id && b.unit === bu.id && b.status !== "Rechazada");
      const steps = [
        ["Horario dentro de " + `${hour(zone.from)}–${hour(zone.to)}`, true],
        [`Aforo: ${st.bk.guests} de ${zone.cap} personas`, st.bk.guests <= zone.cap],
        [clash ? `Choque con la reserva de ${clash.unit}` : "Espacio libre a esa hora", !clash],
        ...(zone.alDia ? [[bu.pending ? `${bu.id} tiene saldo pendiente` : `${bu.id} está al día`, !bu.pending]] : []),
        ...(zone.weekly ? [[already ? "Ya tiene una reserva esta semana" : "Sin otras reservas esta semana", !already]] : []),
      ];
      update((x) => (x.checks = steps.map(([label]) => ({ label, state: "wait" }))));
      log(`Solicitud de reserva: ${zone.name} · ${DAYS.find((d) => d[0] === st.bk.day)[1]} ${hour(st.bk.start)} · ${bu.id}`);
      for (let i = 0; i < steps.length; i++) {
        await wait(380);
        update((x) => (x.checks[i].state = steps[i][1] ? "ok" : "fail"));
        if (!steps[i][1]) {
          log(`Reserva rechazada · ${steps[i][0]}`, "warn");
          if (bu.pending && zone.alDia) log("Regla de la zona: solo unidades al día. Mira «Cobros».", "warn");
          return;
        }
      }
      await wait(300);
      const status = zone.approval ? "Por aprobar" : "Confirmada";
      update((x) => {
        x.bookings.push({ id: x.bookings.length, zone: zone.id, day: x.bk.day, start: x.bk.start, unit: bu.id, by: who, status });
        x.units.find((z) => z.id === bu.id).history.unshift({ text: `Reserva ${zone.name} · ${hour(x.bk.start)} (${status.toLowerCase()})` });
      });
      log(`Reserva ${status.toLowerCase()} para ${who} (${bu.id})`, "ok");
      notify("Correo y app", who, zone.approval ? `Tu reserva de ${zone.name} espera aprobación` : `Reserva confirmada: ${zone.name}, ${hour(st.bk.start)}–${hour(st.bk.start + zone.slot)}`);
    });

  const approve = (b) => {
    update((x) => (x.bookings.find((y) => y.id === b.id).status = "Confirmada"));
    log(`Administración aprueba la reserva de ${b.unit}`, "ok");
    notify("App", b.by, "Tu reserva fue aprobada");
  };

  const createZone = () => {
    const f = st.zoneForm;
    const id = `z${st.zones.length}`;
    update((x) => {
      x.zones.push({ ...f, id });
      x.zoneForm = null;
      x.bk.zone = id;
      x.bk.start = f.from;
      x.bk.guests = Math.min(x.bk.guests, f.cap);
      x.checks = null;
    });
    log(`Zona creada: ${f.name} · aforo ${f.cap} · ${hour(f.from)}–${hour(f.to)} en turnos de ${f.slot} h`, "ok");
    if (f.alDia) log("Regla activa: solo reservan unidades al día");
  };

  const failed = st.checks?.some((c) => c.state === "fail");
  const mine = st.bookings.filter((b) => b.unit === focus.id && b.status !== "Rechazada");
  const hint = st.zoneForm
    ? "Define aforo, horario, duración del turno y reglas, y guarda la zona."
    : failed && bu.pending
    ? `Bloqueada por saldo pendiente. Ve a «Cobros», registra el pago de ${bu.id} y vuelve.`
    : failed
    ? "El sistema detectó el problema. Cambia la hora o el número de personas y vuelve a intentar."
    : mine.length && blocked
    ? `Reservado. Ahora prueba como ${blocked.id}, que tiene saldo pendiente, en el salón social.`
    : `Reserva como ${focus.id}. Prueba el sábado a las 14:00: ya está ocupado. O crea una zona nueva.`;

  const main = (
    <div className="space-y-5">
      <div>
        <Title
          right={
            !st.zoneForm && (
              <Btn small tone="ghost" onClick={() => update((x) => (x.zoneForm = { ...ZONE_PRESETS[(x.zones.length - 2) % ZONE_PRESETS.length], alDia: true, approval: false, weekly: false }))}>
                + Crear zona
              </Btn>
            )
          }
        >
          Zonas comunes
        </Title>
        <div className="flex flex-wrap gap-2">
          {st.zones.map((z) => (
            <button
              key={z.id}
              onClick={() => update((x) => {
                x.bk.zone = z.id;
                x.bk.start = z.from;
                x.checks = null;
              })}
              className={`animate-pop rounded-xl border p-2.5 text-left text-xs transition ${st.bk.zone === z.id ? "border-accent bg-accent/5" : "border-line hover:border-accent"}`}
            >
              <p className="font-semibold">{z.name}</p>
              <p className="text-[10px] text-muted">
                Aforo {z.cap} · {hour(z.from)}–{hour(z.to)} · turnos de {z.slot} h
              </p>
              <p className="mt-1 flex flex-wrap gap-1">
                {z.alDia && <Badge color="#F59E0B">Solo al día</Badge>}
                {z.approval && <Badge color="#3B82F6">Con aprobación</Badge>}
                {z.weekly && <Badge color="#94A3B8">1 por semana</Badge>}
              </p>
            </button>
          ))}
        </div>
      </div>

      {st.zoneForm && (
        <div className="animate-pop space-y-3 rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nombre">
              <input className={inputCls} value={st.zoneForm.name} onChange={(e) => update((x) => (x.zoneForm.name = e.target.value))} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Abre">
                <select className={inputCls} value={st.zoneForm.from} onChange={(e) => update((x) => (x.zoneForm.from = Number(e.target.value)))}>
                  {[6, 7, 8, 9, 10].map((h) => (
                    <option key={h} value={h}>
                      {hour(h)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cierra">
                <select className={inputCls} value={st.zoneForm.to} onChange={(e) => update((x) => (x.zoneForm.to = Number(e.target.value)))}>
                  {[18, 19, 20, 21, 22].map((h) => (
                    <option key={h} value={h}>
                      {hour(h)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stepper label="Aforo" value={st.zoneForm.cap} min={2} max={60} onChange={(v) => update((x) => (x.zoneForm.cap = v))} />
            <Stepper label="Horas por turno" value={st.zoneForm.slot} min={1} max={4} onChange={(v) => update((x) => (x.zoneForm.slot = v))} />
          </div>
          <div className="flex flex-wrap gap-4">
            <Toggle on={st.zoneForm.alDia} onChange={(v) => update((x) => (x.zoneForm.alDia = v))}>
              Solo unidades al día
            </Toggle>
            <Toggle on={st.zoneForm.approval} onChange={(v) => update((x) => (x.zoneForm.approval = v))}>
              Requiere aprobación
            </Toggle>
            <Toggle on={st.zoneForm.weekly} onChange={(v) => update((x) => (x.zoneForm.weekly = v))}>
              Una reserva por semana
            </Toggle>
          </div>
          <div className="flex gap-2">
            <Btn tone="ghost" onClick={() => update((x) => (x.zoneForm = null))}>
              Cancelar
            </Btn>
            <Btn disabled={!st.zoneForm.name.trim()} onClick={createZone}>
              Guardar zona
            </Btn>
          </div>
        </div>
      )}

      <div data-guide="ph-booking" className="rounded-2xl border border-line p-4">
        <Title>Reservar · {zone.name}</Title>
        <div className="grid items-end gap-2 sm:grid-cols-3">
          <Field label="Unidad que reserva">
            <select className={inputCls} value={bu.id} onChange={(e) => bk("unit", e.target.value)}>
              {aptos.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.id} · {contactOf(x)}
                  {x.pending ? " (pendiente)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Día">
            <div className="flex gap-1">
              {DAYS.map(([k, l]) => (
                <button key={k} onClick={() => bk("day", k)} className={`flex-1 rounded-lg border py-1.5 text-[11px] ${st.bk.day === k ? "border-accent text-accent" : "border-line text-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Stepper label="Personas" value={st.bk.guests} min={1} max={60} onChange={(v) => bk("guests", v)} />
        </div>
        {blocked && bu.id !== blocked.id && (
          <button onClick={() => bk("unit", blocked.id)} className="mt-2 text-[11px] text-warm hover:underline">
            Probar como {blocked.id}, con saldo pendiente →
          </button>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {slots.map((h) => {
            const t = taken(h);
            return (
              <button
                key={h}
                onClick={() => bk("start", h)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${st.bk.start === h ? "border-accent bg-accent/10 font-semibold text-accent" : t ? "border-warm/40 bg-warm/10 text-warm" : "border-line text-muted hover:border-accent"}`}
              >
                {hour(h)}–{hour(h + zone.slot)}
                {t && <span className="block text-[9px]">ocupado · {t.unit}</span>}
              </button>
            );
          })}
        </div>
        {st.checks && (
          <ul className="mt-3 space-y-1 text-xs">
            {st.checks.map((c, i) => (
              <li key={i} className={`flex items-center gap-2 ${c.state === "fail" ? "text-warm" : c.state === "ok" ? "" : "text-muted"}`}>
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${c.state === "ok" ? "bg-accent text-bg" : c.state === "fail" ? "bg-warm text-bg" : "border border-line"}`}>
                  {c.state === "ok" ? <Icon name="check" className="h-2.5 w-2.5" /> : c.state === "fail" ? "!" : ""}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn disabled={busy} onClick={book}>
            Reservar
          </Btn>
          {failed && bu.pending && (
            <Btn tone="ghost" onClick={() => setTab("billing")}>
              Ir a Cobros
            </Btn>
          )}
        </div>
      </div>
    </div>
  );

  const side = (
    <Panel title={`Reservas · ${st.bookings.length}`} icon="calendar">
      {st.bookings.map((b) => (
        <div key={b.id} className="animate-pop flex items-center justify-between gap-2 rounded-lg border border-line p-2 text-[11px]">
          <div className="min-w-0">
            <p className="truncate font-semibold">{st.zones.find((z) => z.id === b.zone)?.name}</p>
            <p className="truncate text-muted">
              {DAYS.find((d) => d[0] === b.day)[1]} {hour(b.start)} · {b.unit}
            </p>
          </div>
          {b.status === "Por aprobar" ? (
            <Btn small onClick={() => approve(b)}>
              Aprobar
            </Btn>
          ) : (
            <Badge color="#10B981">{b.status}</Badge>
          )}
        </div>
      ))}
    </Panel>
  );
  return { hint, main, side };
}

/* ───────────────────────────── 4. Cobros y recordatorios ───────────────────────────── */

function Billing({ ctx, focus, blocked }) {
  const { st, update, log, notify, sequence, busy } = ctx;
  const fee = (u) => (st.budget * u.coefM) / 100000;
  const billable = st.units;
  const pending = billable.filter((u) => u.pending);
  const shown = st.filter === "pending" ? pending : st.filter === "ok" ? billable.filter((u) => !u.pending) : billable;
  const sample = pending[0];
  const channelName = st.channel === "whatsapp" ? "WhatsApp" : "Correo";
  const message = (u) => `Hola, ${contactOf(u).split(" ")[0]}. Te recordamos que la cuota de administración de octubre de ${u.id} (${cop(fee(u))}) está pendiente. Puedes pagarla desde la app de ${st.wiz.name}.`;
  const REM = { sending: ["Enviando", "#94A3B8"], delivered: ["Entregado", "#3B82F6"], read: ["Leído", "#10B981"], failed: ["Sin número", "#EF4444"] };

  const send = () =>
    sequence(async (wait) => {
      const targets = pending.map((u) => u.id);
      update((x) => (x.preview = false));
      log(`Recordatorio por ${channelName} a ${targets.length} unidades con saldo pendiente`);
      for (const id of targets) {
        update((x) => (x.units.find((u) => u.id === id).reminder = "sending"));
        await wait(160);
      }
      await wait(400);
      for (const id of targets) {
        const u = st.units.find((y) => y.id === id);
        const fail = st.channel === "whatsapp" && u.noPhone;
        update((x) => {
          const y = x.units.find((z) => z.id === id);
          y.reminder = fail ? "failed" : "delivered";
          y.history.unshift({ text: `Recordatorio de pago por ${channelName}${fail ? " (sin número)" : ""}` });
        });
        if (fail) log(`${id}: sin WhatsApp registrado. Reintenta por correo`, "warn");
        await wait(120);
      }
      notify(channelName, `${targets.length} unidades`, "Recordatorio de cuota de administración pendiente");
      log("Entregas confirmadas por el proveedor", "ok");
      await wait(900);
      const reads = targets.filter((_, i) => i % 2 === 0);
      update((x) => reads.forEach((id) => {
        const y = x.units.find((z) => z.id === id);
        if (y.reminder === "delivered") y.reminder = "read";
      }));
      log(`${reads.length} residentes ya abrieron el mensaje`);
    });

  const pay = (u) => {
    update((x) => {
      const y = x.units.find((z) => z.id === u.id);
      y.pending = false;
      y.history.unshift({ text: `Pago de administración recibido · ${cop(fee(u))}` });
    });
    log(`Pago registrado: ${u.id} queda al día`, "ok");
    notify("App", contactOf(u), "Pago recibido: tu unidad quedó al día");
    if (u.id === st.bk.unit) log("Esta unidad ya puede reservar zonas con la regla «solo al día»");
  };
  const retry = (u) => {
    update((x) => {
      const y = x.units.find((z) => z.id === u.id);
      y.reminder = "delivered";
      y.history.unshift({ text: "Recordatorio reenviado por correo" });
    });
    log(`${u.id}: reenviado por correo`, "ok");
    notify("Correo", contactOf(u), "Recordatorio de cuota pendiente");
  };

  const sent = st.units.some((u) => u.reminder);
  const hint = st.preview
    ? "Revisa el mensaje y el canal. Cada unidad recibe su propio valor."
    : !sent
    ? "La cuota de cada unidad sale del presupuesto × su coeficiente. Envía un recordatorio a quienes deben."
    : blocked && blocked.id === st.bk.unit
    ? `Registra el pago de ${blocked.id} y vuelve a «Zonas comunes»: ya podrá reservar.`
    : "Mira el estado de entrega por unidad. Registra pagos para dejarlas al día.";

  const main = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-line p-3">
          <p className="text-[11px] text-muted">Presupuesto mensual de administración</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[12000000, 16000000, 20000000].map((b) => (
              <button key={b} onClick={() => update((x) => (x.budget = b))} className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.budget === b ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`}>
                {cop(b)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Ejemplo: {focus.id} paga {cop(st.budget)} × {coefTxt(focus.coefM)} = <b className="text-ink">{cop(fee(focus))}</b>
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-line p-3">
          <div className="flex gap-1">
            {[
              ["whatsapp", "WhatsApp"],
              ["mail", "Correo"],
            ].map(([k, l]) => (
              <button key={k} onClick={() => update((x) => (x.channel = k))} className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-1 text-[11px] ${st.channel === k ? "border-accent text-accent" : "border-line text-muted"}`}>
                <Icon name={k} className="h-3 w-3" /> {l}
              </button>
            ))}
          </div>
          <Btn tone="warm" disabled={busy || pending.length === 0} onClick={() => update((x) => (x.preview = !x.preview))}>
            <Icon name="send" className="h-3.5 w-3.5" /> Enviar recordatorio ({pending.length})
          </Btn>
        </div>
      </div>

      {st.preview && sample && (
        <div data-guide="ph-reminder" className="animate-pop rounded-2xl border border-warm/40 bg-warm/5 p-4">
          <Title>Vista previa · {channelName}</Title>
          <div className={`max-w-sm rounded-2xl p-3 text-xs ${st.channel === "whatsapp" ? "rounded-tl-sm bg-[#10B981]/15" : "border border-line bg-surface"}`}>
            {st.channel === "mail" && <p className="mb-1 font-semibold">Asunto: Tu cuota de administración está pendiente</p>}
            {message(sample)}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Para {pending.length} unidades: al propietario y, si hay arrendatario, también a quien vive ahí.
          </p>
          <div className="mt-3 flex gap-2">
            <Btn tone="ghost" onClick={() => update((x) => (x.preview = false))}>
              Cancelar
            </Btn>
            <Btn onClick={send}>Enviar a {pending.length}</Btn>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {[
            ["all", `Todas (${billable.length})`],
            ["pending", `Pendientes (${pending.length})`],
            ["ok", `Al día (${billable.length - pending.length})`],
          ].map(([k, l]) => (
            <button key={k} onClick={() => update((x) => (x.filter = k))} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${st.filter === k ? "bg-accent/15 text-accent" : "text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
        <div data-guide="ph-fees" className="max-h-80 overflow-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="sticky top-0 bg-surface text-[10px] uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="px-3 py-2">Unidad</th>
                <th>Coeficiente</th>
                <th className="text-right">Cuota</th>
                <th className="pl-3">Estado</th>
                <th>Recordatorio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-b border-line/50">
                  <td className="px-3 py-1.5">
                    <p className="font-semibold">{u.id}</p>
                    <p className="text-[10px] text-muted">{u.owner}</p>
                  </td>
                  <td>{coefTxt(u.coefM)}</td>
                  <td className="text-right font-semibold">{cop(fee(u))}</td>
                  <td className="pl-3">
                    <Badge color={u.pending ? "#F59E0B" : "#10B981"}>{u.pending ? "Pendiente" : "Al día"}</Badge>
                  </td>
                  <td>{u.reminder ? <Badge color={REM[u.reminder][1]}>{REM[u.reminder][0]}</Badge> : <span className="text-muted">—</span>}</td>
                  <td className="pr-3 text-right">
                    {u.reminder === "failed" && (
                      <button onClick={() => retry(u)} className="mr-2 text-[11px] text-accent hover:underline">
                        Por correo
                      </button>
                    )}
                    {u.pending && (
                      <button onClick={() => pay(u)} disabled={busy} className="text-[11px] text-accent hover:underline disabled:opacity-40">
                        Registrar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const total = billable.reduce((a, u) => a + fee(u), 0);
  const due = pending.reduce((a, u) => a + fee(u), 0);
  const side = (
    <Panel title="Cobro de octubre" icon="bell">
      <Row k="Total del mes" v={cop(total)} />
      <Row k="Recaudado" v={<span className="text-accent">{cop(total - due)}</span>} />
      <Row k="Por cobrar" v={<span className="text-warm">{cop(due)}</span>} />
      <Row k="Unidades pendientes" v={pending.length} />
      <Row k="Recordatorios entregados" v={st.units.filter((u) => u.reminder === "delivered" || u.reminder === "read").length} />
      <Row k="Leídos" v={st.units.filter((u) => u.reminder === "read").length} />
    </Panel>
  );
  return { hint, main, side };
}

/* ───────────────────────────── 5. Documentos y comunicados ───────────────────────────── */

function Docs({ ctx, unitById, focus }) {
  const { st, update, log, notify, sequence, busy } = ctx;
  const viewer = st.viewAs === "admin" ? null : unitById(st.viewAs);
  const canSee = (d) => !viewer || visibleTo(d, viewer);
  const inFolder = st.docs.filter((d) => d.cat === st.folder);
  const towers = Array.from({ length: st.wiz.towers }, (_, i) => i + 1);
  const otherTower = st.units.find((u) => u.type === "apto" && u.tower === st.wiz.towers && u.id !== focus.id);
  const preset = UPLOAD_PRESETS[st.upload.preset];
  const audienceUnits = (vis, value) => st.units.filter((u) => u.type !== "parq" && (vis === "all" || (vis === "tower" && u.tower === value) || (vis === "unit" && u.id === value)));

  const upload = () =>
    sequence(async (wait) => {
      const up = st.upload;
      const doc = { id: st.docs.length, name: preset.name, cat: preset.cat, size: preset.size, vis: up.vis, visValue: up.vis === "tower" ? up.tower : up.vis === "unit" ? focus.id : undefined, isNew: true };
      log(`Subiendo «${doc.name}» a ${doc.cat}`);
      for (let p = 20; p <= 100; p += 20) {
        update((x) => (x.uploading = p));
        await wait(180);
      }
      const reach = audienceUnits(doc.vis, doc.visValue);
      update((x) => {
        x.docs.push(doc);
        x.uploading = null;
        x.folder = doc.cat;
        x.upload.preset = (x.upload.preset + 1) % UPLOAD_PRESETS.length;
        if (doc.vis === "unit") x.units.find((u) => u.id === focus.id).history.unshift({ text: `Documento compartido: ${doc.name}` });
      });
      log(`Guardado en ${doc.cat} · visible para ${visLabel(doc).toLowerCase()} (${reach.length} unidades)`, "ok");
      notify("App", `${reach.length} unidades`, `Nuevo documento: ${doc.name}`);
    });

  const sendComm = () =>
    sequence(async (wait) => {
      const p = COMM_PRESETS[st.comm.preset];
      const aud = st.comm.audience;
      const units = aud === "all" ? audienceUnits("all") : audienceUnits("tower", Number(aud));
      const people = units.reduce((a, u) => a + Math.max(1, u.residents.length), 0);
      const id = st.comms.length;
      update((x) => x.comms.unshift({ id, subject: p.subject, audience: aud === "all" ? "Todos" : `Torre ${aud}`, people, delivered: 0, read: 0 }));
      log(`Comunicado «${p.subject}» → ${aud === "all" ? "toda la copropiedad" : `Torre ${aud}`}: ${people} personas`);
      for (let k = 1; k <= 4; k++) {
        await wait(260);
        update((x) => (x.comms.find((c) => c.id === id).delivered = Math.round((people * k) / 4)));
      }
      log("Publicado en la app y enviado por correo", "ok");
      notify("Correo y app", `${people} personas`, p.subject);
      for (let k = 1; k <= 3; k++) {
        await wait(500);
        update((x) => (x.comms.find((c) => c.id === id).read = Math.round(people * 0.18 * k)));
      }
      update((x) => (x.comm.preset = (x.comm.preset + 1) % COMM_PRESETS.length));
    });

  const hint = viewer
    ? `Estás viendo como residente de ${viewer.id}: solo aparecen los documentos que le tocan. Vuelve a «Administración».`
    : st.docs.some((d) => d.isNew)
    ? st.comms.length
      ? "Comunicado en camino: mira cómo suben las lecturas. Después pasa a «Asamblea»."
      : "Ahora mira la carpeta «como residente» y envía un comunicado a todos o a una torre."
    : "Elige una carpeta y sube un documento con visibilidad para una torre o una unidad.";

  const main = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((f) => (
            <button key={f} onClick={() => update((x) => (x.folder = f))} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${st.folder === f ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`}>
              {f}
              <span className="rounded-full bg-line/70 px-1.5 text-[10px] text-ink">{st.docs.filter((d) => d.cat === f && canSee(d)).length}</span>
            </button>
          ))}
        </div>
        <select className={`${inputCls} w-auto`} value={st.viewAs} onChange={(e) => update((x) => (x.viewAs = e.target.value))}>
          <option value="admin">Ver como administración</option>
          <option value={focus.id}>Ver como residente de {focus.id}</option>
          {otherTower && <option value={otherTower.id}>Ver como residente de {otherTower.id}</option>}
        </select>
      </div>

      <div data-guide="ph-docs" className="space-y-1.5">
        {inFolder.length === 0 && <p className="text-xs text-muted">Carpeta vacía.</p>}
        {inFolder.map((d) => {
          const ok = canSee(d);
          return (
            <div key={d.id} className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition ${ok ? "border-line" : "border-dashed border-line opacity-40"} ${d.isNew ? "animate-pop" : ""}`}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-7 shrink-0 place-items-center rounded-md bg-warm/15 text-[9px] font-bold text-warm">PDF</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{ok ? d.name : "Documento no visible para esta unidad"}</p>
                  <p className="text-[10px] text-muted">{d.size}</p>
                </div>
              </div>
              <Badge color={d.vis === "all" ? "#10B981" : d.vis === "tower" ? "#3B82F6" : "#A855F7"}>{visLabel(d)}</Badge>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line p-4">
          <Title>Subir documento</Title>
          <div className="space-y-2">
            <Field label="Archivo">
              <select className={inputCls} value={st.upload.preset} onChange={(e) => update((x) => (x.upload.preset = Number(e.target.value)))}>
                {UPLOAD_PRESETS.map((p, i) => (
                  <option key={p.name} value={i}>
                    {p.name} · {p.cat}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="¿Quién lo ve?">
              <div className="flex flex-wrap gap-1">
                {[["all", "Todos"], ...towers.map((t) => [`t${t}`, `Torre ${t}`]), ["unit", `Solo ${focus.id}`]].map(([k, l]) => {
                  const on = k === "all" ? st.upload.vis === "all" : k === "unit" ? st.upload.vis === "unit" : st.upload.vis === "tower" && `t${st.upload.tower}` === k;
                  return (
                    <button
                      key={k}
                      onClick={() => update((x) => {
                        if (k.startsWith("t")) {
                          x.upload.vis = "tower";
                          x.upload.tower = Number(k.slice(1));
                        } else x.upload.vis = k;
                      })}
                      className={`rounded-full border px-2.5 py-1 text-[11px] ${on ? "border-accent text-accent" : "border-line text-muted"}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </Field>
            {st.uploading != null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
                <div className="h-full bg-accent transition-all" style={{ width: `${st.uploading}%` }} />
              </div>
            )}
            <Btn disabled={busy} onClick={upload}>
              <Icon name="download" className="h-3.5 w-3.5 rotate-180" /> Subir
            </Btn>
          </div>
        </div>

        <div className="rounded-2xl border border-line p-4">
          <Title>Comunicado</Title>
          <div className="space-y-2">
            <Field label="Mensaje">
              <select className={inputCls} value={st.comm.preset} onChange={(e) => update((x) => (x.comm.preset = Number(e.target.value)))}>
                {COMM_PRESETS.map((p, i) => (
                  <option key={p.subject} value={i}>
                    {p.subject}
                  </option>
                ))}
              </select>
            </Field>
            <p className="rounded-lg bg-bg/60 p-2 text-[11px] text-muted">{COMM_PRESETS[st.comm.preset].body}</p>
            <Field label="Para">
              <div className="flex flex-wrap gap-1">
                {[["all", "Todos"], ...towers.map((t) => [String(t), `Torre ${t}`])].map(([k, l]) => (
                  <button key={k} onClick={() => update((x) => (x.comm.audience = k))} className={`rounded-full border px-2.5 py-1 text-[11px] ${st.comm.audience === k ? "border-accent text-accent" : "border-line text-muted"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Btn disabled={busy} onClick={sendComm}>
              <Icon name="megaphone" className="h-3.5 w-3.5" /> Enviar comunicado
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  const side = (
    <>
      <Panel title="Archivo documental" icon="download">
        {FOLDERS.map((f) => (
          <Row key={f} k={f} v={st.docs.filter((d) => d.cat === f).length} />
        ))}
        <Row k="Solo para una torre" v={st.docs.filter((d) => d.vis === "tower").length} />
        <Row k="Solo para una unidad" v={st.docs.filter((d) => d.vis === "unit").length} />
      </Panel>
      {st.comms.length > 0 && (
        <Panel title="Comunicados" icon="megaphone">
          {st.comms.map((c) => (
            <div key={c.id} className="animate-pop rounded-lg border border-line p-2 text-[11px]">
              <p className="font-semibold">{c.subject}</p>
              <p className="text-muted">
                {c.audience} · entregado {c.delivered}/{c.people} · leído {c.read}
              </p>
            </div>
          ))}
        </Panel>
      )}
    </>
  );
  return { hint, main, side };
}

/* ───────────────────────────── 6. Asamblea ───────────────────────────── */

function Assembly({ ctx, focus }) {
  const { st, update, log, notify, sequence, busy, setTab } = ctx;
  const a = st.asm;
  const owners = ownersOf(st.units).sort((x, y) => y.coefM - x.coefM);
  const present = owners.filter((o) => a.present.includes(o.name));
  const presentM = present.reduce((s, o) => s + o.coefM, 0);
  const quorum = presentM > 50000;
  const tenant = focus.residents.find((r) => r.role === "Arrendatario");
  const QUESTION = "¿Aprobar la pintura de fachadas con cargo al fondo de reserva?";

  const arrive = (o) => {
    update((x) => x.asm.present.push(o.name));
    const total = presentM + o.coefM;
    log(`Asistencia: ${o.name} (${o.units.join(", ")}) · quórum ${pct1(total / 1000)}`, total > 50000 && !quorum ? "ok" : "info");
    if (total > 50000 && !quorum) log("Quórum alcanzado: más del 50 % del coeficiente", "ok");
  };
  const arriveMany = () =>
    sequence(async (wait) => {
      let m = presentM;
      for (const o of owners.filter((y) => !a.present.includes(y.name))) {
        if (m > 50000 + 6000) break;
        update((x) => x.asm.present.push(o.name));
        m += o.coefM;
        await wait(140);
      }
      log(`Llegaron varios propietarios · quórum ${pct1(m / 1000)}`, m > 50000 ? "ok" : "info");
    });
  const tenantTries = () => {
    update((x) => (x.asm.tried = true));
    log(`${tenant ? tenant.name : "Un arrendatario"} intenta registrarse por ${focus.id}: rechazado, no es propietario`, "warn");
    log(`Para esa unidad solo cuenta ${focus.owner} (o su apoderado)`);
  };
  const open = () => {
    update((x) => (x.asm.question = QUESTION));
    log(`Pregunta abierta: «${QUESTION}»`, "ok");
    notify("App", `${present.length} propietarios presentes`, "Ya puedes votar");
  };
  const vote = (o, v) => update((x) => (x.asm.votes[o.name] = v));
  const voteRest = () =>
    sequence(async (wait) => {
      let i = 0;
      for (const o of present.filter((y) => !a.votes[y.name])) {
        update((x) => (x.asm.votes[o.name] = VOTE_PATTERN[i++ % VOTE_PATTERN.length]));
        await wait(120);
      }
    });

  const tally = ["Sí", "No", "Abstención"].map((opt) => {
    const voters = present.filter((o) => a.votes[o.name] === opt);
    return { opt, n: voters.length, m: voters.reduce((s, o) => s + o.coefM, 0) };
  });
  const yes = tally[0];
  const approved = yes.m > presentM / 2;

  const close = () => {
    const doc = { id: st.docs.length, name: "Acta asamblea extraordinaria · 15 oct 2026.pdf", cat: "Actas", vis: "all", size: "410 KB", isNew: true };
    update((x) => {
      x.asm.closed = true;
      x.docs.push(doc);
    });
    log(`Votación cerrada: Sí ${pct1(yes.m / 1000)} del coeficiente → ${approved ? "aprobada" : "no aprobada"}`, approved ? "ok" : "warn");
    log("Acta generada y guardada en Documentos › Actas", "ok");
    notify("Correo", "Todos los propietarios", `Resultado: ${approved ? "aprobada" : "no aprobada"} la pintura de fachadas`);
  };

  const hint = a.closed
    ? "Asamblea cerrada. El acta ya está en «Documentos › Actas». Termina con «PQRS»."
    : a.question
    ? "Vota por algunos propietarios (o completa los votos) y cierra la votación. Mira la diferencia entre votos y coeficiente."
    : quorum
    ? "Hay quórum. Abre la pregunta para votar."
    : !a.tried && tenant
    ? `Registra la llegada de propietarios. Intenta también registrar a ${tenant.name}, que vive arrendada en ${focus.id}.`
    : "Registra la llegada de propietarios hasta pasar el 50 % del coeficiente.";

  const main = (
    <div className="space-y-4">
      <div data-guide="ph-quorum" className="rounded-2xl border border-line p-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs">
          <span className="font-semibold">
            Quórum {pct1(presentM / 1000)} · {present.length} de {owners.length} propietarios
          </span>
          <span className="text-muted">se necesita más del 50 %</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-line/60">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${presentM / 1000}%`, background: quorum ? "#10B981" : "#F59E0B" }} />
          <span className="absolute inset-y-0 left-1/2 w-0.5 bg-ink/70" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!a.question && (
            <Btn tone="ghost" disabled={busy || quorum} onClick={arriveMany}>
              Llegan varios propietarios
            </Btn>
          )}
          {tenant && !a.closed && (
            <Btn tone="ghost" disabled={a.tried} onClick={tenantTries}>
              Registrar a {tenant.name} (arrendatario)
            </Btn>
          )}
          {quorum && !a.question && <Btn onClick={open}>Abrir pregunta</Btn>}
          {a.question && !a.closed && (
            <>
              <Btn tone="ghost" disabled={busy || present.every((o) => a.votes[o.name])} onClick={voteRest}>
                Completar votos
              </Btn>
              <Btn tone="warm" disabled={busy || tally.every((t) => t.n === 0)} onClick={close}>
                Cerrar votación
              </Btn>
            </>
          )}
          {a.closed && (
            <Btn tone="ghost" onClick={() => setTab("docs")}>
              Ver el acta
            </Btn>
          )}
        </div>
      </div>

      {a.question && (
        <div className="animate-pop rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <p className="text-sm font-semibold">{a.question}</p>
          <div className="mt-3 space-y-2">
            {tally.map((t) => (
              <div key={t.opt}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: VOTE_COLORS[t.opt] }} className="font-semibold">
                    {t.opt}
                  </span>
                  <span>
                    {pct1(presentM ? (t.m / presentM) * 100 : 0)} del coeficiente presente · {t.n} voto{t.n === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line/60">
                  <div className="h-full transition-all" style={{ width: `${presentM ? (t.m / presentM) * 100 : 0}%`, background: VOTE_COLORS[t.opt] }} />
                </div>
              </div>
            ))}
          </div>
          {a.closed && <p className={`mt-3 text-sm font-bold ${approved ? "text-accent" : "text-warm"}`}>{approved ? "Aprobada" : "No aprobada"} por coeficiente</p>}
        </div>
      )}

      <div>
        <Title>Propietarios · cada uno pesa lo que suman sus unidades</Title>
        <div className="grid max-h-72 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {owners.map((o) => {
            const here = a.present.includes(o.name);
            const v = a.votes[o.name];
            return (
              <div key={o.name} className={`flex items-center justify-between gap-2 rounded-xl border p-2 text-xs ${here ? "border-accent/50 bg-accent/5" : "border-line"}`}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{o.name}</p>
                  <p className="truncate text-[10px] text-muted">
                    {o.units.join(" + ")} · {coefTxt(o.coefM)}
                  </p>
                </div>
                {!here && !a.closed && (
                  <button onClick={() => arrive(o)} disabled={busy} className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] transition hover:border-accent hover:text-accent">
                    Llegó
                  </button>
                )}
                {here && a.question && !v && !a.closed && (
                  <span className="flex shrink-0 gap-1">
                    {Object.keys(VOTE_COLORS).map((opt) => (
                      <button key={opt} onClick={() => vote(o, opt)} className="rounded-full border px-1.5 py-0.5 text-[10px]" style={{ borderColor: VOTE_COLORS[opt], color: VOTE_COLORS[opt] }}>
                        {opt === "Abstención" ? "Abst." : opt}
                      </button>
                    ))}
                  </span>
                )}
                {here && v && <Badge color={VOTE_COLORS[v]}>{v}</Badge>}
                {here && !v && (!a.question || a.closed) && <Badge color="#10B981">Presente</Badge>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const side = (
    <>
      <Panel title="Asamblea extraordinaria" icon="megaphone">
        <Row k="Estado" v={a.closed ? "Cerrada" : a.question ? "Votando" : quorum ? "Con quórum" : "Registrando asistencia"} />
        <Row k="Coeficiente presente" v={pct1(presentM / 1000)} />
        <Row k="Votos emitidos" v={Object.keys(a.votes).length} />
        <Row k="Arrendatarios rechazados" v={a.tried ? 1 : 0} />
      </Panel>
      <Panel title="Cómo cuenta">
        <p className="text-xs text-muted">Quórum y resultado se miden con el coeficiente, no por cabeza. Votan solo propietarios: quien tiene varias unidades suma sus coeficientes.</p>
      </Panel>
    </>
  );
  return { hint, main, side };
}

/* ───────────────────────────── 7. PQRS ───────────────────────────── */

const PQRS_FORM_URL = "https://contagracia.com/ph/pqrs/2bf7cc00-acfc-444c-98df-1790907c4c4a";

function Pqrs({ ctx, focus }) {
  const { st, update, log, notify, sequence, busy, tick } = ctx;
  const t = st.tickets[0];
  const resident = contactOf(focus);
  const preset = PQRS_PRESETS[st.pq];
  const stateIdx = t ? PQRS_STATES.findIndex(([s]) => s === t.status) : -1;

  const file = () =>
    sequence(async (wait) => {
      const rad = `PQRS-${2026}-${String(140 + st.tickets.length).padStart(4, "0")}`;
      const at = tick();
      update((x) => {
        x.tickets.unshift({ rad, ...preset, unit: focus.id, by: resident, status: "Recibida", thread: [{ who: resident, role: "res", text: preset.text, at }] });
        x.speaker = "admin";
        x.pqNew = false;
        x.reply = ADMIN_REPLIES[0];
      });
      log(`${resident} radica una ${preset.type.toLowerCase()} desde ${focus.id}`);
      await wait(600);
      update((x) => x.units.find((u) => u.id === focus.id).history.unshift({ text: `${rad} radicada: ${preset.subject}` }));
      log(`Radicado ${rad} asignado · estado Recibida`, "ok");
      notify("Correo", resident, `Recibimos tu solicitud. Tu radicado es ${rad}`);
      await wait(400);
      notify("App", "Administración", `Nueva ${preset.type.toLowerCase()} de ${focus.id}`);
      log("Aviso a la administración en la bandeja de PQRS");
    });

  const send = () => {
    const text = st.reply.trim();
    if (!text) return;
    const admin = st.speaker === "admin";
    const at = tick();
    update((x) => {
      const y = x.tickets[0];
      y.thread.push({ who: admin ? "Administración" : resident, role: admin ? "adm" : "res", text, at });
      if (admin && y.status === "Recibida") y.status = "En trámite";
      x.reply = admin ? ADMIN_REPLIES[Math.min(y.thread.filter((m) => m.role === "adm").length, ADMIN_REPLIES.length - 1)] : "";
    });
    log(`${admin ? "Administración" : resident} responde en ${t.rad}`);
    if (admin && t.status === "Recibida") log(`${t.rad} pasa a En trámite`, "ok");
    notify(admin ? "Correo y app" : "App", admin ? resident : "Administración", `Nueva respuesta en ${t.rad}`);
  };
  const setStatus = (s) => {
    update((x) => {
      x.tickets[0].status = s;
      x.units.find((u) => u.id === focus.id).history.unshift({ text: `${t.rad} → ${s}` });
    });
    log(`${t.rad} cambia a ${s}`, s === "Resuelta" ? "ok" : "info");
    notify("Correo", resident, `Tu solicitud ${t.rad} está ${s.toLowerCase()}`);
  };

  const hint = !t || st.pqNew
    ? `Eres ${resident}, residente de ${focus.id}. Elige el tipo de solicitud y radícala.`
    : t.status === "Recibida"
    ? "Ahora eres la administración: responde. Al responder, la solicitud pasa a «En trámite»."
    : t.status === "En trámite"
    ? "Conversa (cambia entre administración y residente) y marca la solicitud como resuelta."
    : `Resuelta. El historial de ${focus.id} en «Unidades» guarda todo el recorrido.`;

  const main = (
    <div className="space-y-4">
      {!t || st.pqNew ? (
        <div className="rounded-2xl border border-line p-4">
          <p className="font-display font-bold">Nueva solicitud</p>
          <p className="text-[11px] text-muted">
            {resident} · {unitName(focus)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PQRS_PRESETS.map((p, i) => (
              <button key={p.subject} onClick={() => update((x) => (x.pq = i))} className={`rounded-xl border px-3 py-1.5 text-left text-xs ${st.pq === i ? "border-accent bg-accent/10" : "border-line"}`}>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">{p.type}</span>
                {p.subject}
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-bg/60 p-2.5 text-xs">{preset.text}</p>
          <div className="mt-3">
            <Btn disabled={busy} onClick={file}>
              <Icon name="send" className="h-3.5 w-3.5" /> Radicar
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-accent">{t.rad}</p>
              <p className="font-display text-lg font-bold">{t.subject}</p>
              <p className="text-[11px] text-muted">
                {t.type} · {t.by} · {t.unit}
              </p>
            </div>
            <Badge color={PQRS_STATES[stateIdx][1]}>{t.status}</Badge>
          </div>
          <div data-guide="ph-pqrs-states" className="flex items-center gap-1 text-[10px]">
            {PQRS_STATES.map(([s, c], i) => (
              <span key={s} className={`flex-1 rounded-full border py-1 text-center transition ${i <= stateIdx ? "font-semibold text-bg" : "text-muted"}`} style={{ borderColor: `${c}66`, background: i <= stateIdx ? c : "transparent" }}>
                {s}
              </span>
            ))}
          </div>
          <div className="space-y-2 rounded-2xl border border-line bg-bg/40 p-3">
            {t.thread.map((m, i) => (
              <div key={i} className={`flex ${m.role === "adm" ? "justify-end" : ""}`}>
                <div className={`animate-pop max-w-[85%] rounded-2xl px-3 py-2 text-xs ${m.role === "adm" ? "rounded-br-sm bg-accent/15" : "rounded-bl-sm border border-line bg-surface"}`}>
                  <p className="mb-0.5 text-[10px] font-semibold text-muted">
                    {m.who} · {m.at}
                  </p>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          {t.status !== "Resuelta" ? (
            <div className="space-y-2">
              <div className="flex gap-1 text-[11px]">
                {[
                  ["admin", "Como administración"],
                  ["res", `Como ${resident.split(" ")[0]}`],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => update((x) => {
                      x.speaker = k;
                      x.reply = k === "admin" ? ADMIN_REPLIES[Math.min(x.tickets[0].thread.filter((m) => m.role === "adm").length, ADMIN_REPLIES.length - 1)] : "Perfecto, quedo atento.";
                    })}
                    className={`rounded-full border px-3 py-1 ${st.speaker === k ? "border-accent text-accent" : "border-line text-muted"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className={inputCls} value={st.reply} onChange={(e) => update((x) => (x.reply = e.target.value))} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escribe una respuesta…" />
                <Btn disabled={!st.reply.trim()} onClick={send}>
                  <Icon name="send" className="h-3.5 w-3.5" />
                </Btn>
              </div>
              {t.status === "En trámite" && (
                <Btn tone="warm" onClick={() => setStatus("Resuelta")}>
                  <Icon name="check" className="h-3.5 w-3.5" /> Marcar como resuelta
                </Btn>
              )}
            </div>
          ) : (
            <Btn
              tone="ghost"
              onClick={() => update((x) => {
                x.pqNew = true;
                x.pq = (x.pq + 1) % PQRS_PRESETS.length;
              })}
            >
              Radicar otra solicitud
            </Btn>
          )}
        </>
      )}
    </div>
  );

  const side = (
    <>
      <ProdLink href={PQRS_FORM_URL} title="Formulario público de PQRS" description="Formulario del producto real en el que trabajé: así llega el residente a radicar." />
      <Panel title="Solicitud" icon="mail">
        <Row k="Radicado" v={t?.rad ?? "—"} />
        <Row k="Estado" v={t?.status ?? "—"} />
        <Row k="Mensajes" v={t?.thread.length ?? 0} />
        <Row k="Solicitudes de la unidad" v={st.tickets.length} />
      </Panel>
    </>
  );
  return { hint, main, side };
}

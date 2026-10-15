"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { useSim, MobileTabs, ExecLog, Panel, Row, Badge, ProdLink } from "./ui";

// Demo propia con datos ficticios: un café-bar de Grupo Nova con dos sedes.
// Recorre sedes y plano de mesas, reservas con asignación automática (uniendo mesas vecinas),
// sesión de mesa con dueño, cocina en tablero con cronómetro, menú público editable y cierre del día.

const cop = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;
const RED = "#EF4444";
const VIOLET = "#8B5CF6";
const ROWS = 3;
const COLS = 4;

/* ───────────────────────────── Datos de ejemplo ───────────────────────────── */

const MENU = [
  { id: "capuchino", cat: "Café", name: "Capuchino", desc: "Doble espresso y leche texturizada", price: 7500, prep: 4, emoji: "☕" },
  { id: "latte", cat: "Café", name: "Latte de vainilla", desc: "Espresso, leche y vainilla de la casa", price: 9000, prep: 5, emoji: "🥛" },
  { id: "cold", cat: "Café", name: "Cold brew", desc: "Infusión en frío durante 16 horas", price: 8500, prep: 3, emoji: "🧊" },
  { id: "croissant", cat: "Comida", name: "Croissant de almendras", desc: "Hojaldre horneado cada mañana", price: 8000, prep: 6, emoji: "🥐" },
  { id: "tostada", cat: "Comida", name: "Tostada de aguacate", desc: "Pan de masa madre, aguacate y huevo", price: 15000, prep: 9, emoji: "🥑" },
  { id: "bowl", cat: "Comida", name: "Bowl de frutos rojos", desc: "Yogur, granola, fresas y miel", price: 16000, prep: 7, emoji: "🍓" },
  { id: "sandwich", cat: "Comida", name: "Sándwich de pavo", desc: "Pavo, pesto, tomate seco y queso", price: 18500, prep: 10, emoji: "🥪" },
  { id: "cerveza", cat: "Bar", name: "Cerveza artesanal", desc: "Rubia de la casa, 330 ml", price: 12000, prep: 2, emoji: "🍺" },
  { id: "spritz", cat: "Bar", name: "Spritz de maracuyá", desc: "Maracuyá, espumoso y soda", price: 22000, prep: 6, emoji: "🍹" },
];
const CATS = ["Café", "Comida", "Bar"];
const item = (id) => MENU.find((m) => m.id === id);

const T = (n, r, c, cap) => ({ id: `M${n}`, n, r, c, cap });
const SEDES = () => ({
  parque: {
    id: "parque",
    short: "Parque",
    name: "Nova Café Parque",
    address: "Cra. 7 # 45-10",
    open: "07:00",
    close: "22:00",
    waiters: ["Lucía Paredes", "Mateo Gil"],
    tables: [T(1, 0, 0, 2), T(2, 0, 1, 2), T(3, 0, 2, 4), T(4, 0, 3, 4), T(5, 1, 0, 4), T(6, 1, 1, 4), T(7, 1, 3, 2), T(8, 2, 0, 6), T(9, 2, 1, 2), T(10, 2, 2, 2)],
  },
  puerto: {
    id: "puerto",
    short: "Puerto",
    name: "Nova Café Puerto",
    address: "Av. del Mar # 12-30",
    open: "08:00",
    close: "23:00",
    waiters: ["Irene Salcedo", "Bruno Cárdenas"],
    tables: [T(1, 0, 0, 2), T(2, 0, 1, 2), T(3, 0, 3, 2), T(4, 1, 0, 4), T(5, 1, 1, 4), T(6, 1, 2, 4), T(7, 2, 1, 6), T(8, 2, 2, 2)],
  },
});
const SEDE_IDS = ["parque", "puerto"];

const DAYS = { hoy: { label: "Hoy · jue 15", short: "Jue 15" }, manana: { label: "Mañana · vie 16", short: "Vie 16" } };
const TIMES = ["12:30", "13:30", "19:00", "20:00", "21:00"];
const OPEN_OPTS = ["06:00", "07:00", "08:00", "09:00"];
const CLOSE_OPTS = ["20:00", "21:00", "22:00", "23:00"];
const WEB_GUESTS = ["Marina Toro", "Felipe Arango", "Rocío Zuluaga", "Germán Peña"];

const PALETTE = {
  terracota: { label: "Terracota", hex: "#C2410C" },
  oliva: { label: "Oliva", hex: "#4D7C0F" },
  noche: { label: "Azul noche", hex: "#1E3A8A" },
  cacao: { label: "Cacao", hex: "#78350F" },
};
const HEADERS = [
  ["foto", "Foto"],
  ["solido", "Color sólido"],
  ["minimal", "Minimal"],
];
const PATTERNS = [
  ["liso", "Liso"],
  ["puntos", "Puntos"],
  ["cuadros", "Cuadrícula"],
  ["rayas", "Rayas"],
];
const LAYOUTS = [
  ["grid", "Cuadrícula"],
  ["list", "Lista"],
];

const SALES_SEED = [
  { sede: "parque", waiter: "Lucía Paredes", label: "M2", items: { capuchino: 2, croissant: 2 }, tip: 10 },
  { sede: "parque", waiter: "Lucía Paredes", label: "M4", items: { sandwich: 3, latte: 3 }, tip: 10 },
  { sede: "parque", waiter: "Mateo Gil", label: "M1", items: { cold: 1, tostada: 1 }, tip: 0 },
  { sede: "parque", waiter: "Mateo Gil", label: "M5 + M6", items: { bowl: 4, capuchino: 4, croissant: 3 }, tip: 10 },
  { sede: "puerto", waiter: "Irene Salcedo", label: "M2", items: { cerveza: 4, spritz: 2 }, tip: 10 },
  { sede: "puerto", waiter: "Irene Salcedo", label: "M7", items: { sandwich: 2, cerveza: 3 }, tip: 5 },
  { sede: "puerto", waiter: "Bruno Cárdenas", label: "M5", items: { spritz: 3, tostada: 2 }, tip: 10 },
];

/* ───────────────────────────── Lógica pura ───────────────────────────── */

const mins = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const withinHours = (sede, time) => mins(time) >= mins(sede.open) && mins(time) + 60 <= mins(sede.close);
const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const labelOf = (ids) => ids.join(" + ");
const subtotalOf = (items) => Object.entries(items).reduce((a, [id, q]) => a + item(id).price * q, 0);

// Mesa más pequeña que alcance; si ninguna sola alcanza, une 2 o 3 mesas vecinas de la misma fila
function assign(tables, busy, party) {
  const free = tables.filter((t) => !busy.has(t.id));
  const single = free.filter((t) => t.cap >= party).sort((a, b) => a.cap - b.cap)[0];
  if (single) return [single.id];
  for (const size of [2, 3]) {
    let best = null;
    for (const t of free) {
      const run = [t];
      for (let k = 1; k < size; k++) {
        const next = free.find((u) => u.r === t.r && u.c === t.c + k);
        if (!next) break;
        run.push(next);
      }
      if (run.length < size) continue;
      const seats = run.reduce((a, u) => a + u.cap, 0);
      if (seats >= party && (!best || seats < best.seats)) best = { ids: run.map((u) => u.id), seats };
    }
    if (best) return best.ids;
  }
  return null;
}

function slotInfo(st, sedeId, day, time, party) {
  const sede = st.sedes[sedeId];
  if (!withinHours(sede, time)) return { state: "cerrado" };
  const busy = new Set(st.reservations.filter((r) => r.sede === sedeId && r.day === day && r.time === time).flatMap((r) => r.tables));
  const free = sede.tables.filter((t) => !busy.has(t.id));
  if (free.length === 0) return { state: "lleno", free: 0, seats: 0 };
  const pick = assign(sede.tables, busy, party);
  return { state: pick ? "ok" : "sinCupo", free: free.length, seats: free.reduce((a, t) => a + t.cap, 0), pick };
}

// Grupo más grande que cabe uniendo hasta 3 mesas vecinas
function maxGroup(tables) {
  let best = 0;
  for (const t of tables) {
    let seats = 0;
    for (let k = 0; k < 3; k++) {
      const u = tables.find((x) => x.r === t.r && x.c === t.c + k);
      if (!u) break;
      seats += u.cap;
      best = Math.max(best, seats);
    }
  }
  return best;
}

const initialState = () => {
  let n = 100;
  const R = (sede, day, time, name, party, tables) => ({ id: `R-${++n}`, sede, day, time, name, party, tables, source: "teléfono", status: "pendiente" });
  const reservations = [
    R("parque", "hoy", "13:30", "Familia Restrepo", 6, ["M8"]),
    R("parque", "hoy", "19:00", "Diana Loaiza", 2, ["M1"]),
    R("parque", "hoy", "20:00", "Empresa Lumen", 8, ["M5", "M6"]),
    R("parque", "hoy", "20:00", "Cumpleaños de Salomé", 10, ["M8", "M9", "M10"]),
    R("parque", "hoy", "20:00", "Jorge Patiño", 4, ["M3"]),
    R("parque", "hoy", "20:00", "Sara Quintero", 3, ["M4"]),
    R("parque", "hoy", "20:00", "Nicolás Duarte", 2, ["M1"]),
    R("parque", "hoy", "20:00", "Elena Burgos", 2, ["M2"]),
    R("parque", "hoy", "20:00", "Pablo Rincón", 2, ["M7"]),
    R("parque", "manana", "20:00", "Club de lectura", 6, ["M8"]),
    R("puerto", "hoy", "12:30", "Andrea Mejía", 4, ["M4"]),
    R("puerto", "hoy", "21:00", "Equipo Delta", 8, ["M4", "M5"]),
  ];
  const allOn = (off) => Object.fromEntries(MENU.map((m) => [m.id, !off.includes(m.id)]));
  return {
    step: "sedes",
    sede: "parque",
    sedes: SEDES(),
    me: { parque: "Lucía Paredes", puerto: "Irene Salcedo" },
    form: { name: "Tomás Echeverri", day: "hoy", party: 7, time: null },
    booking: null,
    flash: null,
    reservations,
    seq: { res: n, ses: 2, dish: 2, notice: 0 },
    sessions: [
      { id: "S-1", sede: "parque", tables: ["M7"], owner: "Mateo Gil", guest: "Sin reserva", party: 2, resId: null, draft: {}, note: "", closed: false },
      { id: "S-2", sede: "puerto", tables: ["M2"], owner: "Bruno Cárdenas", guest: "Sin reserva", party: 2, resId: null, draft: {}, note: "", closed: false },
    ],
    active: null,
    dishes: [
      { id: "D-1", ses: "S-1", sede: "parque", item: "cold", qty: 2, note: "", status: "preparando", elapsed: 120 },
      { id: "D-2", ses: "S-2", sede: "puerto", item: "cerveza", qty: 2, note: "", status: "pendiente", elapsed: 30 },
    ],
    notices: [],
    tip: 10,
    sales: SALES_SEED.map((s) => ({ ...s })),
    report: "todas",
    design: {
      parque: { header: "foto", color: "terracota", pattern: "puntos", layout: "grid" },
      puerto: { header: "solido", color: "noche", pattern: "rayas", layout: "list" },
    },
    visible: { parque: allOn(["spritz", "cerveza"]), puerto: allOn(["bowl"]) },
    done: {},
    log: [],
  };
};

const STEPS = [
  ["sedes", "Sedes", "pin"],
  ["reservas", "Reservas", "calendar"],
  ["mesa", "Llega la mesa", "users"],
  ["cocina", "Cocina", "bolt"],
  ["menu", "Menú público", "globe"],
  ["cierre", "Cierre del día", "download"],
];

/* ───────────────────────────── Componente principal ───────────────────────────── */

export default function RestaurantSimulator() {
  const { st, update, reset, sequence, busy } = useSim(initialState);
  const [tab, setTab] = useState("flujo");
  const stepRefs = useRef({});
  // Mantiene visible el paso activo en la barra de pasos (útil en el celular)
  useEffect(() => {
    stepRefs.current[st.step]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [st.step]);

  const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));
  const sede = st.sedes[st.sede];
  const me = st.me[st.sede];

  // Cronómetro de cocina: cada medio segundo pasan 15 s simulados para los platos en curso
  const cooking = st.dishes.some((d) => d.status === "pendiente" || d.status === "preparando");
  useEffect(() => {
    if (!cooking) return;
    const t = setInterval(
      () => update((x) => x.dishes.forEach((d) => (d.status === "pendiente" || d.status === "preparando") && d.elapsed < 5940 && (d.elapsed += 15))),
      500
    );
    return () => clearInterval(t);
  }, [cooking]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => {
    reset();
    setTab("flujo");
  };

  const goStep = (step) => update((x) => (x.step = step));

  const setSede = (id) => {
    if (id === st.sede) return;
    update((x) => {
      x.sede = id;
      x.form.time = null;
      x.booking = null;
      x.active = null;
    });
    log(`Cambias a ${st.sedes[id].name}: otro plano de mesas, otro menú y otra cocina`);
  };

  /* ── Sedes: configuración ── */
  const editSede = (field, value) => {
    update((x) => {
      x.sedes[x.sede][field] = value;
      x.done.sedes = true;
      if (field !== "name") x.form.time = null;
    });
    if (field === "open" || field === "close") log(`${sede.name}: horario ${field === "open" ? "de apertura" : "de cierre"} → ${value}. Las franjas fuera de horario se cierran`);
  };

  const tableInUse = (id) =>
    st.reservations.some((r) => r.sede === st.sede && r.tables.includes(id)) || st.sessions.some((s) => s.sede === st.sede && !s.closed && s.tables.includes(id));

  const cycleCap = (t) => {
    const next = t.cap === 2 ? 4 : t.cap === 4 ? 6 : 2;
    update((x) => {
      x.sedes[x.sede].tables.find((u) => u.id === t.id).cap = next;
      x.done.sedes = true;
      x.form.time = null;
    });
    log(`${t.id} ahora tiene ${next} puestos`);
  };

  const removeTable = (t) => {
    if (tableInUse(t.id)) return log(`${t.id} tiene reservas o una sesión abierta: no se puede quitar del plano`, "warn");
    update((x) => {
      const s = x.sedes[x.sede];
      s.tables = s.tables.filter((u) => u.id !== t.id);
      x.done.sedes = true;
      x.form.time = null;
    });
    log(`${t.id} sale del plano de ${sede.name}`, "warn");
  };

  const addTable = (r, c) => {
    const nextN = Math.max(0, ...sede.tables.map((t) => t.n)) + 1;
    update((x) => {
      x.sedes[x.sede].tables.push(T(nextN, r, c, 2));
      x.done.sedes = true;
      x.form.time = null;
    });
    log(`Nueva mesa M${nextN} de 2 puestos en el plano`, "ok");
  };

  /* ── Reservas ── */
  const setForm = (field, value) =>
    update((x) => {
      x.form[field] = value;
      if (field !== "time" && field !== "name") x.form.time = null;
      x.booking = null;
    });

  const confirmBooking = () =>
    sequence(async (wait) => {
      const { day, time, party, name } = st.form;
      const sedeId = st.sede;
      const info = slotInfo(st, sedeId, day, time, party);
      if (!info.pick) return;
      log(`Buscando disponibilidad: ${sede.name} · ${DAYS[day].short} ${time} · ${party} personas`);
      await wait(700);
      const tables = info.pick.map((id) => sede.tables.find((t) => t.id === id));
      const seats = tables.reduce((a, t) => a + t.cap, 0);
      if (tables.length === 1) {
        log(`${tables[0].id} (${tables[0].cap} puestos) es la mesa libre más pequeña que alcanza`);
      } else {
        log(`Ninguna mesa sola alcanza para ${party} personas`, "warn");
        await wait(650);
        log(`Se unen mesas vecinas ${labelOf(info.pick)}: ${seats} puestos`);
      }
      await wait(700);
      let resId;
      update((x) => {
        resId = `R-${++x.seq.res}`;
        x.reservations.push({ id: resId, sede: sedeId, day, time, name: name.trim() || "Cliente", party, tables: info.pick, source: "demo", status: "pendiente" });
        x.booking = { resId };
        x.done.reservas = true;
      });
      log(`Reserva ${resId} confirmada y la franja se actualiza para todos`, "ok");
      await wait(500);
      log("Mensaje de confirmación enviado al cliente");
      await wait(1800);

      // Otra reserva entra por el enlace público mientras tanto
      const other = TIMES.find((t) => t !== time && slotInfo(st, sedeId, day, t, 2).state === "ok");
      if (!other) return;
      const guest = WEB_GUESTS[st.reservations.filter((r) => r.source === "web").length % WEB_GUESTS.length];
      const pick = slotInfo(st, sedeId, day, other, 2).pick;
      update((x) => {
        x.reservations.push({ id: `R-${++x.seq.res}`, sede: sedeId, day, time: other, name: guest, party: 2, tables: pick, source: "web", status: "pendiente" });
        x.flash = `${sedeId}|${day}|${other}`;
      });
      log(`En vivo: ${guest} reservó para 2 a las ${other} desde la web. La disponibilidad cambia sin recargar`, "ok");
      await wait(2200);
      update((x) => (x.flash = null));
    });

  /* ── Mesa y mesero ── */
  const setMe = (name) => {
    update((x) => {
      x.me[x.sede] = name;
      const a = x.sessions.find((s) => s.id === x.active);
      if (a && a.owner !== name) x.active = null;
    });
    log(`Ahora usas la app como ${name}`);
  };

  const openSession = (res) =>
    sequence(async (wait) => {
      const clash = st.sessions.find((s) => s.sede === res.sede && !s.closed && s.tables.some((t) => res.tables.includes(t)));
      if (clash) {
        log(`${labelOf(clash.tables)} sigue ocupada por ${clash.owner}: hay que cerrar esa sesión primero`, "warn");
        return;
      }
      let id;
      update((x) => {
        id = `S-${++x.seq.ses}`;
        x.sessions.push({ id, sede: res.sede, tables: res.tables, owner: me, guest: res.name, party: res.party, resId: res.id, draft: {}, note: "", closed: false });
        x.reservations.find((r) => r.id === res.id).status = "en mesa";
        x.active = id;
      });
      log(`Llega ${res.name}: se abre la sesión ${id} en ${labelOf(res.tables)} desde la reserva ${res.id}`);
      await wait(600);
      log(`La mesa queda a nombre de ${me}: solo esa persona toma pedidos y la cierra`, "ok");
    });

  const pickSession = (s) => {
    if (s.owner !== me) return log(`${labelOf(s.tables)} es de ${s.owner}. Cambia de mesero o pide que te la pasen`, "warn");
    update((x) => (x.active = s.id));
    log(`${me} abre la vista de ${labelOf(s.tables)}`);
  };

  const active = st.sessions.find((s) => s.id === st.active);

  const setQty = (id, delta) =>
    update((x) => {
      const s = x.sessions.find((y) => y.id === x.active);
      const q = Math.max(0, Math.min(9, (s.draft[id] ?? 0) + delta));
      if (q) s.draft[id] = q;
      else delete s.draft[id];
    });

  const sendOrder = () =>
    sequence(async (wait) => {
      const s = active;
      const lines = Object.entries(s.draft);
      if (!lines.length) return;
      const note = s.note.trim();
      log(`${s.owner} envía ${lines.length} plato(s) de ${labelOf(s.tables)} a la cocina${note ? ` con la nota «${note}»` : ""}`);
      update((x) => {
        const y = x.sessions.find((z) => z.id === s.id);
        y.draft = {};
        y.note = "";
      });
      for (const [id, qty] of lines) {
        await wait(350);
        update((x) => {
          x.dishes.push({ id: `D-${++x.seq.dish}`, ses: s.id, sede: s.sede, item: id, qty, note, status: "pendiente", elapsed: 0 });
          x.done.mesa = true;
        });
        log(`${qty}× ${item(id).name} → Pendiente (preparación estimada: ${item(id).prep} min)`);
      }
      await wait(300);
      log("Cada plato arranca su propio cronómetro", "ok");
    });

  const deliver = (d) => {
    update((x) => {
      x.dishes.find((y) => y.id === d.id).status = "entregado";
      x.notices.forEach((n) => n.dish === d.id && (n.read = true));
    });
    log(`${d.qty}× ${item(d.item).name} entregado en la mesa`);
  };

  const closeSession = () =>
    sequence(async (wait) => {
      const s = active;
      const mine = st.dishes.filter((d) => d.ses === s.id);
      const items = {};
      mine.forEach((d) => (items[d.item] = (items[d.item] ?? 0) + d.qty));
      const subtotal = subtotalOf(items);
      const tip = Math.round((subtotal * st.tip) / 100);
      log(`Cierre de ${labelOf(s.tables)}: consumo de ${cop(subtotal)}`);
      await wait(700);
      log(tip ? `Propina del ${st.tip} % (${cop(tip)}) a nombre de ${s.owner}, dueño de la sesión` : "La mesa no dejó propina", tip ? "ok" : "warn");
      await wait(700);
      update((x) => {
        x.sales.push({ sede: s.sede, waiter: s.owner, label: labelOf(s.tables), items, tip: x.tip, fresh: true });
        const y = x.sessions.find((z) => z.id === s.id);
        y.closed = true;
        if (y.resId) x.reservations.find((r) => r.id === y.resId).status = "atendida";
        x.active = null;
      });
      log(`${labelOf(s.tables)} queda libre y la venta entra al reporte del día`, "ok");
    });

  /* ── Cocina ── */
  const startDish = (d) => {
    update((x) => (x.dishes.find((y) => y.id === d.id).status = "preparando"));
    log(`Cocina empieza ${d.qty}× ${item(d.item).name}`);
  };

  const readyDish = (d) => {
    const s = st.sessions.find((y) => y.id === d.ses);
    const limit = item(d.item).prep * 60;
    update((x) => {
      x.dishes.find((y) => y.id === d.id).status = "listo";
      x.notices.push({ id: ++x.seq.notice, dish: d.id, waiter: s.owner, sede: s.sede, text: `${d.qty}× ${item(d.item).name} · ${labelOf(s.tables)}`, read: false });
      x.done.cocina = true;
    });
    log(`Listo en ${fmt(d.elapsed)} (estimado ${item(d.item).prep}:00)`, d.elapsed > limit ? "warn" : "ok");
    log(`Aviso a ${s.owner}: ${d.qty}× ${item(d.item).name} listo para ${labelOf(s.tables)}`);
  };

  /* ── Menú público ── */
  const setDesign = (field, value, label) => {
    update((x) => {
      x.design[x.sede][field] = value;
      x.done.menu = true;
    });
    log(`Menú de ${sede.name}: ${label}`);
  };

  const toggleVisible = (m) => {
    const on = !st.visible[st.sede][m.id];
    update((x) => {
      x.visible[x.sede][m.id] = on;
      x.done.menu = true;
    });
    log(`${sede.name}: «${m.name}» ${on ? "aparece en" : "se oculta del"} menú público`, on ? "ok" : "warn");
  };

  /* ── Cierre ── */
  const exportReport = (kind, ext) => {
    update((x) => (x.done.cierre = true));
    log(`Exportar ${kind}: se generaría «cierre_jue15_${st.report}.${ext}». En la demo solo queda en este registro`);
  };

  /* ── Derivados ── */
  const readyForMe = st.dishes.filter((d) => {
    const s = st.sessions.find((y) => y.id === d.ses);
    return d.status === "listo" && s.owner === me && s.sede === st.sede;
  }).length;

  const hint = (() => {
    switch (st.step) {
      case "sedes":
        return "Elige la sede, ajusta su horario y toca las mesas del plano para cambiar sus puestos.";
      case "reservas":
        if (st.booking) return "Reserva confirmada. Mira cómo entra otra en vivo y luego pasa a «Llega la mesa».";
        if (st.form.time) return "El plano ya muestra la mesa sugerida. Confirma la reserva.";
        return st.sede === "parque" && st.form.day === "hoy" ? "Elige una franja libre. La de hoy a las 20:00 está llena: compruébalo." : "Elige día, tamaño del grupo y una franja con cupo.";
      case "mesa": {
        if (!active) return "Abre la sesión desde una reserva: la mesa queda a tu nombre.";
        const ds = st.dishes.filter((d) => d.ses === active.id);
        if (readyForMe) return "¡Hay platos listos! Entrégalos en la mesa.";
        if (!ds.length) return "Suma platos con + y −, agrega una nota si quieres y envía a cocina.";
        if (ds.every((d) => d.status === "entregado")) return "Todo entregado: elige la propina y cierra la mesa.";
        return "Pedido en cocina. Ve al paso «Cocina» y mueve los platos.";
      }
      case "cocina":
        return "Mueve cada plato: Pendiente → Preparando → Listo. El cronómetro se pone cálido y luego rojo si se pasa.";
      case "menu":
        return "Cambia encabezado, color, patrón y diseño; oculta platos por sede. El celular cambia al instante.";
      default:
        return "Ventas del día por sede, producto y mesero, con las propinas de cada persona.";
    }
  })();

  const ctx = { st, update, log, busy, sede, me, active, setSede };
  const showPlanMobile = ["sedes", "mesa"].includes(st.step);
  const plan = (
    <FloorCard
      st={st}
      sede={sede}
      me={me}
      onCycle={cycleCap}
      onRemove={removeTable}
      onAdd={addTable}
      onSession={pickSession}
    />
  );
  const pane = (name) => (tab === name ? "flex" : "hidden lg:flex");
  const lastLog = st.log[st.log.length - 1];

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado: negocio, sede y reinicio */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-warm/15 text-sm">☕</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">Nova Café</p>
          <p className="truncate text-[10px] text-muted">Grupo Nova · 2 sedes</p>
        </div>
        <div className="flex rounded-full border border-line p-0.5">
          {SEDE_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setSede(id)}
              disabled={busy}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${st.sede === id ? "bg-accent text-bg" : "text-muted hover:text-ink"}`}
            >
              {st.sedes[id].short}
            </button>
          ))}
        </div>
        <button onClick={restart} title="Reiniciar la demo" aria-label="Reiniciar la demo" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent">
          <Icon name="refresh" className="h-4 w-4" />
        </button>
      </div>

      {/* Pasos de la historia */}
      <nav data-guide="rest-pasos" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {STEPS.map(([k, label, icon], i) => {
          const on = st.step === k;
          const badge = k === "mesa" && readyForMe > 0;
          return (
            <button
              key={k}
              ref={(el) => (stepRefs.current[k] = el)}
              onClick={() => goStep(k)}
              className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                on ? "border-accent bg-accent/10 text-accent" : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${st.done[k] ? "bg-accent text-bg" : on ? "bg-accent/20" : "bg-line"}`}>
                {st.done[k] ? <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} /> : i + 1}
              </span>
              <Icon name={icon} className="hidden h-3.5 w-3.5 sm:block" />
              {label}
              {badge && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-warm px-1 text-[9px] text-bg">{readyForMe}</span>}
            </button>
          );
        })}
      </nav>

      <MobileTabs
        tabs={[
          ["flujo", "Operación"],
          ["sistema", "Sistema"],
        ]}
        tab={tab}
        setTab={setTab}
        pulse={busy ? "sistema" : null}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[272px_minmax(0,1fr)_268px]">
        {/* Plano del salón (escritorio) */}
        <aside data-guide="rest-plano" className="hidden min-h-0 flex-col overflow-y-auto border-r border-line p-3 lg:flex">
          {plan}
        </aside>

        {/* Paso actual */}
        <section data-guide="rest-etapa" className={`${pane("flujo")} min-h-0 flex-col`}>
          <div data-guide="rest-hint" className="shrink-0 border-b border-line bg-warm/10 px-4 py-2 text-xs font-medium text-warm">
            {hint}
          </div>
          {lastLog && (
            <p className={`shrink-0 truncate border-b border-line px-4 py-1 font-mono text-[10px] lg:hidden ${lastLog.tone === "warn" ? "text-warm" : lastLog.tone === "ok" ? "text-accent" : "text-muted"}`}>
              › {lastLog.msg}
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {showPlanMobile && <div data-guide="rest-plano" className="mb-4 rounded-2xl border border-line p-3 lg:hidden">{plan}</div>}
            {st.step === "sedes" && <SedeStage ctx={ctx} onEdit={editSede} onNext={() => goStep("reservas")} />}
            {st.step === "reservas" && <ReservasStage ctx={ctx} plan={plan} setForm={setForm} onConfirm={confirmBooking} onNext={() => goStep("mesa")} />}
            {st.step === "mesa" && (
              <MesaStage
                ctx={ctx}
                setMe={setMe}
                onOpen={openSession}
                onPick={pickSession}
                onBack={() => update((x) => (x.active = null))}
                setQty={setQty}
                setNote={(v) => update((x) => (x.sessions.find((s) => s.id === x.active).note = v))}
                onSend={sendOrder}
                onDeliver={deliver}
                setTip={(v) => update((x) => (x.tip = v))}
                onClose={closeSession}
                onKitchen={() => goStep("cocina")}
              />
            )}
            {st.step === "cocina" && <CocinaStage ctx={ctx} onStart={startDish} onReady={readyDish} onWaiter={() => goStep("mesa")} />}
            {st.step === "menu" && <MenuStage ctx={ctx} setDesign={setDesign} toggleVisible={toggleVisible} />}
            {st.step === "cierre" && <CierreStage ctx={ctx} setReport={(v) => update((x) => (x.report = v))} onExport={exportReport} />}
          </div>
        </section>

        {/* Lo que pasa en el sistema */}
        <section data-guide="rest-sistema" className={`${pane("sistema")} min-h-0 flex-col border-line lg:border-l`}>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Lo que pasa en el sistema</p>
            <SystemPanels st={st} sede={sede} me={me} />
          </div>
          <ExecLog log={st.log} empty="Elige una sede o un paso para empezar…" className="h-44" />
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────────── Piezas pequeñas ───────────────────────────── */

function Label({ children, className = "" }) {
  return <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted ${className}`}>{children}</p>;
}

function Chip({ on, onClick, children, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${on ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:border-accent/50 hover:text-ink"} ${className}`}
    >
      {children}
    </button>
  );
}

function Stepper({ value, onMinus, onPlus, disabled }) {
  return (
    <div className="flex items-center rounded-full border border-line">
      <button onClick={onMinus} disabled={disabled} className="px-2.5 py-1 text-muted transition hover:text-accent disabled:opacity-40" aria-label="Menos">
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold">{value}</span>
      <button onClick={onPlus} disabled={disabled} className="px-2.5 py-1 text-muted transition hover:text-accent disabled:opacity-40" aria-label="Más">
        +
      </button>
    </div>
  );
}

const PrimaryBtn = ({ onClick, disabled, children, tone = "accent" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50 ${tone === "warm" ? "bg-warm" : "bg-accent"}`}
  >
    {children}
  </button>
);

/* ───────────────────────────── Plano del salón ───────────────────────────── */

const KIND = {
  libre: { cls: "border-line bg-surface", label: "Libre" },
  reservada: { cls: "border-[#8B5CF6]/50 bg-[#8B5CF6]/10", label: "Reservada" },
  propuesta: { cls: "border-dashed border-accent bg-accent/10", label: "Sugerida" },
  nueva: { cls: "border-accent bg-accent/25 animate-pop", label: "Tu reserva" },
  sesion: { cls: "border-warm/50 bg-warm/15", label: "De otro mesero" },
  mia: { cls: "border-accent/60 bg-accent/10", label: "Tuya" },
  activa: { cls: "border-accent bg-accent/25 ring-2 ring-accent/40", label: "Atendiendo" },
};

function floorView(st, me) {
  const map = {};
  const groups = [];
  const mark = (ids, kind, tag) => {
    ids.forEach((id) => (map[id] = { kind, tag }));
    if (ids.length > 1) groups.push({ ids, kind });
  };
  if (st.step === "reservas") {
    const { day, time, party } = st.form;
    if (!time) return { map, groups, title: "Elige una franja", legend: ["libre", "reservada", "propuesta"] };
    st.reservations
      .filter((r) => r.sede === st.sede && r.day === day && r.time === time)
      .forEach((r) => (r.id === st.booking?.resId ? mark(r.tables, "nueva", "tú") : mark(r.tables, "reservada", r.name.split(" ")[0].slice(0, 7))));
    if (!st.booking) {
      const info = slotInfo(st, st.sede, day, time, party);
      if (info.pick) mark(info.pick, "propuesta", `${party}p`);
    }
    return { map, groups, title: `${DAYS[day].short} · ${time}`, legend: st.booking ? ["libre", "reservada", "nueva"] : ["libre", "reservada", "propuesta"] };
  }
  st.sessions
    .filter((s) => s.sede === st.sede && !s.closed)
    .forEach((s) => mark(s.tables, s.id === st.active ? "activa" : s.owner === me ? "mia" : "sesion", initials(s.owner)));
  return { map, groups, title: "Ahora mismo", legend: ["libre", "mia", "sesion"] };
}

function FloorCard({ st, sede, me, onCycle, onRemove, onAdd, onSession }) {
  const edit = st.step === "sedes";
  const { map, groups, title, legend } = floorView(st, me);
  const pos = Object.fromEntries(sede.tables.map((t) => [t.id, t]));
  const cells = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (!sede.tables.some((t) => t.r === r && t.c === c)) cells.push([r, c]);
  const seats = sede.tables.reduce((a, t) => a + t.cap, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <Label className="mb-0">Plano del salón</Label>
          <p className="truncate font-display text-sm font-bold">{sede.name}</p>
        </div>
        <span className="shrink-0 rounded-full bg-bg/70 px-2 py-0.5 text-[10px] font-semibold text-muted">{title}</span>
      </div>

      <div
        className="relative grid gap-2 rounded-2xl border border-line bg-bg/50 p-2.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, 3.6rem)` }}
      >
        {/* Mesas unidas: un marco que abarca las mesas vecinas */}
        {groups.map((g) => {
          const ts = g.ids.map((id) => pos[id]).filter(Boolean);
          if (!ts.length) return null;
          const cs = ts.map((t) => t.c);
          return (
            <div
              key={g.ids.join()}
              className={`pointer-events-none -m-1 rounded-xl border-2 ${g.kind === "reservada" ? "border-[#8B5CF6]/50" : g.kind === "sesion" ? "border-warm/60" : "border-dashed border-accent"}`}
              style={{ gridRow: ts[0].r + 1, gridColumn: `${Math.min(...cs) + 1} / ${Math.max(...cs) + 2}` }}
            />
          );
        })}

        {cells.map(([r, c]) =>
          edit ? (
            <button
              key={`e${r}${c}`}
              onClick={() => onAdd(r, c)}
              style={{ gridRow: r + 1, gridColumn: c + 1 }}
              className="grid place-items-center rounded-xl border border-dashed border-line text-lg text-muted transition hover:border-accent hover:text-accent"
              aria-label="Agregar mesa"
            >
              +
            </button>
          ) : (
            <div key={`e${r}${c}`} style={{ gridRow: r + 1, gridColumn: c + 1 }} />
          )
        )}

        {sede.tables.map((t) => {
          const v = map[t.id] ?? { kind: "libre" };
          const session = st.sessions.find((s) => s.sede === st.sede && !s.closed && s.tables.includes(t.id));
          const clickable = edit || (st.step === "mesa" && session);
          const body = (
            <>
              <span className="text-[11px] font-bold">{t.id}</span>
              <span className="flex gap-0.5">
                {Array.from({ length: t.cap / 2 }).map((_, i) => (
                  <span key={i} className="h-1 w-2 rounded-full bg-muted/50" />
                ))}
              </span>
              <span className="truncate text-[9px] text-muted">{v.tag ?? `${t.cap} puestos`}</span>
            </>
          );
          const cls = `relative z-10 flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border px-1 transition ${KIND[v.kind].cls}`;
          return (
            <div key={t.id} className="relative" style={{ gridRow: t.r + 1, gridColumn: t.c + 1 }}>
              {clickable ? (
                <button onClick={() => (edit ? onCycle(t) : onSession(session))} className={`${cls} hover:-translate-y-0.5 hover:border-accent`} title={edit ? "Cambiar puestos" : "Abrir la mesa"}>
                  {body}
                </button>
              ) : (
                <div className={cls}>{body}</div>
              )}
              {edit && (
                <button
                  onClick={() => onRemove(t)}
                  aria-label={`Quitar ${t.id}`}
                  className="absolute -right-1 -top-1 z-20 grid h-4 w-4 place-items-center rounded-full border border-line bg-surface text-[9px] text-muted transition hover:border-[#EF4444] hover:text-[#EF4444]"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
        {legend.map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded border ${KIND[k].cls.replace("animate-pop", "")}`} />
            {KIND[k].label}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-muted">
        {sede.tables.length} mesas · {seats} puestos · abre {sede.open}–{sede.close}
      </p>
      {edit && <p className="rounded-xl bg-accent/5 p-2 text-[11px] text-muted">Toca una mesa para pasar de 2 a 4 a 6 puestos, usa + para agregar una y × para quitarla.</p>}
      {st.step === "mesa" && <p className="rounded-xl bg-accent/5 p-2 text-[11px] text-muted">Las iniciales dicen de quién es cada mesa. Toca una con sesión para atenderla.</p>}
    </div>
  );
}

/* ───────────────────────────── 1. Sedes ───────────────────────────── */

function SedeStage({ ctx, onEdit, onNext }) {
  const { st, sede, setSede, busy } = ctx;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {SEDE_IDS.map((id) => {
          const s = st.sedes[id];
          const on = st.sede === id;
          return (
            <button
              key={id}
              onClick={() => setSede(id)}
              disabled={busy}
              className={`rounded-2xl border p-3 text-left transition ${on ? "border-accent bg-accent/10" : "border-line hover:border-accent/60"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-display font-bold">{s.name}</p>
                {on && <Badge color="#10B981">Activa</Badge>}
              </div>
              <p className="text-xs text-muted">{s.address}</p>
              <p className="mt-1.5 text-[11px] text-muted">
                {s.open}–{s.close} · {s.tables.length} mesas · {s.tables.reduce((a, t) => a + t.cap, 0)} puestos
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line p-4">
        <Label>Configurar {sede.short}</Label>
        <label className="block text-xs text-muted">
          Nombre visible
          <input
            value={sede.name}
            onChange={(e) => onEdit("name", e.target.value)}
            maxLength={28}
            className="mt-1 w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            ["open", "Abre", OPEN_OPTS],
            ["close", "Cierra", CLOSE_OPTS],
          ].map(([field, label, opts]) => (
            <label key={field} className="block text-xs text-muted">
              {label}
              <select
                value={sede[field]}
                onChange={(e) => onEdit(field, e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {opts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            [sede.tables.length, "mesas"],
            [Math.max(0, ...sede.tables.map((t) => t.cap)), "grupo en 1 mesa"],
            [maxGroup(sede.tables), "grupo uniendo"],
          ].map(([v, k]) => (
            <div key={k} className="rounded-xl bg-bg/60 p-2">
              <p className="font-display text-lg font-bold">{v}</p>
              <p className="text-[10px] text-muted">{k}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">El plano y la carta cambian con la sede: cada una tiene sus mesas, su menú y su cocina.</p>
      </div>

      <PrimaryBtn onClick={onNext}>
        Seguir con las reservas <Icon name="arrow" className="h-4 w-4" />
      </PrimaryBtn>
    </div>
  );
}

/* ───────────────────────────── 2. Reservas ───────────────────────────── */

function ReservasStage({ ctx, plan, setForm, onConfirm, onNext }) {
  const { st, sede, setSede, busy } = ctx;
  const { day, time, party, name } = st.form;
  const info = time ? slotInfo(st, st.sede, day, time, party) : null;
  const booked = st.booking && st.reservations.find((r) => r.id === st.booking.resId);
  const list = st.reservations.filter((r) => r.sede === st.sede && r.day === day).sort((a, b) => mins(a.time) - mins(b.time));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          Nombre de quien reserva
          <input
            value={name}
            onChange={(e) => setForm("name", e.target.value)}
            disabled={busy}
            maxLength={30}
            className="mt-1 w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <div>
          <p className="text-xs text-muted">Personas</p>
          <div className="mt-1 flex items-center gap-2">
            <Stepper value={party} disabled={busy} onMinus={() => setForm("party", Math.max(1, party - 1))} onPlus={() => setForm("party", Math.min(12, party + 1))} />
            <span className="text-[11px] text-muted">{party > 6 ? "habrá que unir mesas" : "cabe en una mesa"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Sede</span>
        {SEDE_IDS.map((id) => (
          <Chip key={id} on={st.sede === id} disabled={busy} onClick={() => setSede(id)}>
            {st.sedes[id].short}
          </Chip>
        ))}
        <span className="ml-2 text-xs text-muted">Día</span>
        {Object.entries(DAYS).map(([k, d]) => (
          <Chip key={k} on={day === k} disabled={busy} onClick={() => setForm("day", k)}>
            {d.label}
          </Chip>
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <Label className="mb-0">Disponibilidad</Label>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            en vivo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TIMES.map((t) => {
            const s = slotInfo(st, st.sede, day, t, party);
            const ok = s.state === "ok";
            const flash = st.flash === `${st.sede}|${day}|${t}`;
            const sub = {
              ok: `${s.free} mesas · ${s.seats} p.`,
              lleno: "Lleno",
              sinCupo: `Sin cupo para ${party}`,
              cerrado: "Fuera de horario",
            }[s.state];
            return (
              <button
                key={t}
                disabled={!ok || busy || !!st.booking}
                onClick={() => setForm("time", t)}
                className={`rounded-xl border p-2 text-left transition ${
                  time === t ? "border-accent bg-accent/15" : ok ? "border-line hover:border-accent/60" : "cursor-not-allowed border-line opacity-70"
                } ${flash ? "animate-pop ring-2 ring-warm" : ""}`}
              >
                <p className="text-sm font-bold">{t}</p>
                <p className={`text-[10px] ${s.state === "lleno" ? "font-semibold text-[#EF4444]" : ok ? "text-muted" : "text-warm"}`}>{sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div data-guide="rest-plano" className="rounded-2xl border border-line p-3 lg:hidden">{plan}</div>

      {!booked && info?.pick && (
        <div className="animate-pop rounded-2xl border border-dashed border-accent/60 bg-accent/5 p-3">
          <p className="text-sm font-semibold">
            Asignación automática: {labelOf(info.pick)}
            {info.pick.length > 1 && <span className="ml-1 text-xs font-normal text-accent">(mesas unidas)</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {info.pick.reduce((a, id) => a + sede.tables.find((t) => t.id === id).cap, 0)} puestos para {party} personas. Puedes verla marcada en el plano.
          </p>
          <div className="mt-3">
            <PrimaryBtn onClick={onConfirm} disabled={busy}>
              {busy ? "Reservando…" : "Confirmar reserva"}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {booked && (
        <div className="animate-pop space-y-3">
          <div className="rounded-2xl border border-line bg-bg/50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
              <Icon name="send" className="h-3.5 w-3.5" /> Mensaje al cliente
            </p>
            <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-accent/15 px-3 py-2 text-xs leading-relaxed">
              Hola {booked.name.split(" ")[0]}, tu reserva en {sede.name} quedó confirmada: {DAYS[booked.day].short.toLowerCase()} a las {booked.time}, {booked.party} personas.{" "}
              {booked.tables.length > 1 ? `Dejamos unidas las mesas ${labelOf(booked.tables)} para tu grupo.` : `Tu mesa es la ${booked.tables[0]}.`} Código {booked.id}.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm("time", null)}
              disabled={busy}
              className="rounded-full border border-line px-3 py-2 text-xs font-semibold transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              Nueva reserva
            </button>
            <button onClick={onNext} className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-bg transition hover:brightness-110">
              Llega la mesa →
            </button>
          </div>
        </div>
      )}

      <div>
        <Label>
          Reservas · {sede.short} · {DAYS[day].short}
        </Label>
        <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line">
          {list.map((r) => (
            <li key={r.id} className={`flex items-center gap-2 px-3 py-1.5 text-xs ${r.id === st.booking?.resId || r.source === "web" ? "animate-pop bg-accent/5" : ""}`}>
              <span className="w-10 font-semibold">{r.time}</span>
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="text-muted">{r.party} p.</span>
              <span className="w-16 truncate text-right text-[10px] text-muted">{labelOf(r.tables)}</span>
              {r.source === "web" && <Badge color={VIOLET}>web</Badge>}
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-3 text-center text-xs text-muted">Sin reservas este día.</li>}
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────────────── 3. Llega la mesa ───────────────────────────── */

const DISH_STATUS = {
  pendiente: { label: "Pendiente", color: "#94A3B8" },
  preparando: { label: "Preparando", color: "#F59E0B" },
  listo: { label: "Listo", color: "#10B981" },
  entregado: { label: "Entregado", color: "#2DD4BF" },
};

function MesaStage({ ctx, setMe, onOpen, onPick, onBack, setQty, setNote, onSend, onDeliver, setTip, onClose, onKitchen }) {
  const { st, sede, me, active, busy } = ctx;
  const lastRes = st.booking?.resId;
  // Primero la reserva que acabas de hacer; luego por día y hora
  const rank = (r) => (r.id === lastRes ? -1e5 : 0) + (r.day === "hoy" ? 0 : 1e4) + mins(r.time);
  const waiting = st.reservations.filter((r) => r.sede === st.sede && r.status === "pendiente").sort((a, b) => rank(a) - rank(b));
  const open = st.sessions.filter((s) => s.sede === st.sede && !s.closed);
  const myNotices = st.notices.filter((n) => !n.read && n.waiter === me && n.sede === st.sede);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Tú eres</span>
        {sede.waiters.map((w) => (
          <Chip key={w} on={me === w} disabled={busy} onClick={() => setMe(w)}>
            <span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-full bg-line text-[8px] font-bold">{initials(w)}</span>
            {w}
          </Chip>
        ))}
      </div>

      {/* Avisos de cocina para este mesero */}
      {myNotices.map((n) => {
        const d = st.dishes.find((y) => y.id === n.dish);
        return (
          <div key={n.id} className="flex animate-pop items-center gap-2 rounded-2xl border border-[#10B981]/50 bg-[#10B981]/10 p-2.5">
            <Icon name="bell" className="h-4 w-4 shrink-0 text-[#10B981]" />
            <p className="min-w-0 flex-1 text-xs">
              <span className="font-semibold">Listo para entregar:</span> {n.text}
            </p>
            <button onClick={() => onDeliver(d)} className="shrink-0 rounded-full bg-[#10B981] px-3 py-1 text-[11px] font-semibold text-bg transition hover:brightness-110">
              Entregar
            </button>
          </div>
        );
      })}

      {!active && (
        <>
          <div>
            <Label>Por llegar</Label>
            <div className="space-y-2">
              {waiting.slice(0, 6).map((r) => (
                <div key={r.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${r.id === lastRes ? "border-accent bg-accent/5" : "border-line"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {r.name} {r.id === lastRes && <span className="text-[10px] font-normal text-accent">· tu reserva</span>}
                    </p>
                    <p className="text-[11px] text-muted">
                      {DAYS[r.day].short} {r.time} · {r.party} personas · {labelOf(r.tables)}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpen(r)}
                    disabled={busy}
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
                  >
                    Llegó · abrir
                  </button>
                </div>
              ))}
              {waiting.length === 0 && <p className="rounded-xl bg-bg/40 py-4 text-center text-xs text-muted">No hay reservas pendientes en esta sede.</p>}
            </div>
          </div>
          <div>
            <Label>Mesas abiertas</Label>
            <div className="space-y-2">
              {open.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warm/15 text-[10px] font-bold text-warm">{initials(s.owner)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{labelOf(s.tables)}</p>
                    <p className="text-[11px] text-muted">
                      {s.guest} · de {s.owner}
                    </p>
                  </div>
                  {s.owner === me ? (
                    <button onClick={() => onPick(s)} className="shrink-0 rounded-full border border-accent px-3 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/10">
                      Atender
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] text-muted">Solo {s.owner.split(" ")[0]}</span>
                  )}
                </div>
              ))}
              {open.length === 0 && <p className="rounded-xl bg-bg/40 py-4 text-center text-xs text-muted">Ninguna mesa abierta.</p>}
            </div>
          </div>
        </>
      )}

      {active && <ActiveTable ctx={ctx} {...{ onBack, setQty, setNote, onSend, onDeliver, setTip, onClose, onKitchen }} />}
    </div>
  );
}

function ActiveTable({ ctx, onBack, setQty, setNote, onSend, onDeliver, setTip, onClose, onKitchen }) {
  const { st, active: s, busy } = ctx;
  const visible = MENU.filter((m) => st.visible[s.sede][m.id]);
  const draftCount = Object.values(s.draft).reduce((a, q) => a + q, 0);
  const draftTotal = subtotalOf(s.draft);
  const sent = st.dishes.filter((d) => d.ses === s.id);
  const consumed = sent.reduce((a, d) => a + item(d.item).price * d.qty, 0);
  const allDelivered = sent.length > 0 && sent.every((d) => d.status === "entregado");
  const inKitchen = sent.some((d) => d.status === "pendiente" || d.status === "preparando");

  return (
    <div className="animate-pop space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-accent/50 bg-accent/5 p-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold">{labelOf(s.tables)}</p>
          <p className="text-xs text-muted">
            {s.guest} · {s.party} personas
          </p>
        </div>
        <div className="text-right">
          <Badge color="#10B981">Mesa de {s.owner.split(" ")[0]}</Badge>
          <button onClick={onBack} className="mt-1 block w-full text-right text-[11px] text-muted transition hover:text-accent">
            ← Otras mesas
          </button>
        </div>
      </div>

      <div>
        <Label>Carta de {st.sedes[s.sede].short}</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {visible.map((m) => (
            <div key={m.id} className={`flex items-center gap-2 rounded-xl border p-2 transition ${s.draft[m.id] ? "border-accent/60 bg-accent/5" : "border-line"}`}>
              <span className="text-lg">{m.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{m.name}</p>
                <p className="text-[10px] text-muted">
                  {cop(m.price)} · {m.prep} min
                </p>
              </div>
              <Stepper value={s.draft[m.id] ?? 0} disabled={busy} onMinus={() => setQty(m.id, -1)} onPlus={() => setQty(m.id, 1)} />
            </div>
          ))}
        </div>
      </div>

      <label className="block text-xs text-muted">
        Nota para cocina (opcional)
        <input
          value={s.note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
          placeholder="p. ej. leche de almendras, sin azúcar"
          maxLength={50}
          className="mt-1 w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-accent"
        />
      </label>

      <PrimaryBtn onClick={onSend} disabled={busy || draftCount === 0}>
        <Icon name="send" className="h-4 w-4" />
        {draftCount ? `Enviar ${draftCount} a cocina · ${cop(draftTotal)}` : "Suma platos para enviar"}
      </PrimaryBtn>

      {sent.length > 0 && (
        <div>
          <Label>Enviado a cocina</Label>
          <ul className="space-y-1.5">
            {sent.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-xl border border-line px-2.5 py-1.5 text-xs">
                <span>{item(d.item).emoji}</span>
                <span className="min-w-0 flex-1 truncate">
                  {d.qty}× {item(d.item).name}
                  {d.note && <span className="block truncate text-[10px] italic text-warm">«{d.note}»</span>}
                </span>
                {d.status === "listo" ? (
                  <button onClick={() => onDeliver(d)} className="rounded-full bg-[#10B981] px-2.5 py-0.5 text-[10px] font-semibold text-bg transition hover:brightness-110">
                    Entregar
                  </button>
                ) : (
                  <Badge color={DISH_STATUS[d.status].color}>{DISH_STATUS[d.status].label}</Badge>
                )}
              </li>
            ))}
          </ul>
          {inKitchen && (
            <button onClick={onKitchen} className="mt-2 w-full rounded-full border border-line px-3 py-2 text-xs font-semibold transition hover:border-accent hover:text-accent">
              Ver la cocina →
            </button>
          )}
        </div>
      )}

      {allDelivered && (
        <div className="animate-pop space-y-3 rounded-2xl border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Consumo</span>
            <span className="font-semibold">{cop(consumed)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Propina</span>
            {[0, 5, 10].map((p) => (
              <Chip key={p} on={st.tip === p} disabled={busy} onClick={() => setTip(p)}>
                {p ? `${p} % · ${cop((consumed * p) / 100)}` : "Sin propina"}
              </Chip>
            ))}
          </div>
          <PrimaryBtn tone="warm" onClick={onClose} disabled={busy}>
            {busy ? "Cerrando…" : "Cerrar la mesa"}
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── 4. Cocina ───────────────────────────── */

function CocinaStage({ ctx, onStart, onReady, onWaiter }) {
  const { st, sede } = ctx;
  const dishes = st.dishes.filter((d) => d.sede === st.sede);
  const cols = [
    ["pendiente", "Pendiente", "#94A3B8"],
    ["preparando", "Preparando", "#F59E0B"],
    ["listo", "Listo", "#10B981"],
  ];
  const late = dishes.filter((d) => (d.status === "pendiente" || d.status === "preparando") && d.elapsed > item(d.item).prep * 60).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display font-bold">Cocina · {sede.short}</p>
        {late > 0 && <Badge color={RED}>{late} atrasado(s)</Badge>}
        <div className="ml-auto flex gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> a tiempo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warm" /> por vencer
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> pasado
          </span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cols.map(([status, title, color]) => {
          const cards = dishes.filter((d) => d.status === status);
          return (
            <div key={status} className="flex min-w-0 flex-col rounded-2xl bg-bg/50 p-2">
              <div className="mb-2 flex items-center gap-1.5 px-1">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold">{title}</span>
                <span className="ml-auto rounded-full bg-line px-1.5 text-[10px] text-muted">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.map((d) => (
                  <DishCard key={d.id} d={d} s={st.sessions.find((y) => y.id === d.ses)} onStart={() => onStart(d)} onReady={() => onReady(d)} />
                ))}
                {cards.length === 0 && <p className="rounded-xl border border-dashed border-line py-5 text-center text-[11px] text-muted">Vacío</p>}
              </div>
            </div>
          );
        })}
      </div>
      {dishes.some((d) => d.status === "listo") && (
        <button onClick={onWaiter} className="w-full rounded-full border border-line px-3 py-2 text-xs font-semibold transition hover:border-accent hover:text-accent">
          Ir a la vista del mesero para entregar →
        </button>
      )}
    </div>
  );
}

function DishCard({ d, s, onStart, onReady }) {
  const m = item(d.item);
  const limit = m.prep * 60;
  const pct = d.elapsed / limit;
  const tone = pct > 1 ? "red" : pct >= 0.75 ? "warm" : "ok";
  const bar = tone === "red" ? "bg-[#EF4444]" : tone === "warm" ? "bg-warm" : "bg-accent";
  const text = tone === "red" ? "text-[#EF4444]" : tone === "warm" ? "text-warm" : "text-accent";
  const running = d.status !== "listo";
  return (
    <div className={`animate-pop rounded-xl border bg-surface p-2.5 shadow-sm ${running && tone === "red" ? "border-[#EF4444]/60" : running && tone === "warm" ? "border-warm/60" : "border-line"}`}>
      <div className="flex items-start gap-2">
        <span className="text-base">{m.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight">
            {d.qty}× {m.name}
          </p>
          <p className="text-[10px] text-muted">
            {labelOf(s.tables)} · {initials(s.owner)}
          </p>
        </div>
      </div>
      {d.note && <p className="mt-1 text-[10px] italic text-warm">«{d.note}»</p>}
      {running ? (
        <>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div className={`h-full ${bar} transition-all`} style={{ width: `${Math.min(100, pct * 100)}%` }} />
          </div>
          <p className={`mt-1 font-mono text-[10px] font-semibold ${text}`}>
            {fmt(d.elapsed)} / {m.prep}:00
          </p>
          <button
            onClick={d.status === "pendiente" ? onStart : onReady}
            className={`mt-1.5 w-full rounded-lg py-1 text-[11px] font-semibold text-bg transition hover:brightness-110 ${d.status === "pendiente" ? "bg-[#F59E0B]" : "bg-[#10B981]"}`}
          >
            {d.status === "pendiente" ? "Empezar" : "Marcar listo"}
          </button>
        </>
      ) : (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
          <Icon name="bell" className="h-3 w-3" /> Avisado a {s.owner.split(" ")[0]} · {fmt(d.elapsed)}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────────── 5. Menú público ───────────────────────────── */

const MENU_URL = "https://contagracia.com/menu/2bf7cc00-acfc-444c-98df-1790907c4c4a/a1939a84-f77c-4bdb-b7dd-d249580ee52f";

function MenuStage({ ctx, setDesign, toggleVisible }) {
  const { st, sede } = ctx;
  const dz = st.design[st.sede];
  const name = (list, k) => list.find(([v]) => v === k)[1];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_250px]">
      <div className="space-y-4">
        <div>
          <Label>Encabezado</Label>
          <div className="flex flex-wrap gap-1.5">
            {HEADERS.map(([k, l]) => (
              <Chip key={k} on={dz.header === k} onClick={() => setDesign("header", k, `encabezado → ${l}`)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PALETTE).map(([k, p]) => (
              <button
                key={k}
                onClick={() => setDesign("color", k, `color → ${p.label}`)}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition ${dz.color === k ? "border-accent text-ink" : "border-line text-muted hover:border-accent/50"}`}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: p.hex }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Patrón de fondo</Label>
          <div className="flex flex-wrap gap-1.5">
            {PATTERNS.map(([k, l]) => (
              <Chip key={k} on={dz.pattern === k} onClick={() => setDesign("pattern", k, `patrón → ${l}`)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Diseño de la carta</Label>
          <div className="flex flex-wrap gap-1.5">
            {LAYOUTS.map(([k, l]) => (
              <Chip key={k} on={dz.layout === k} onClick={() => setDesign("layout", k, `diseño → ${l}`)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Visibles en {sede.short}</Label>
          <div className="overflow-hidden rounded-xl border border-line">
            {MENU.map((m) => {
              const on = st.visible[st.sede][m.id];
              return (
                <div key={m.id} className="flex items-center gap-2 border-b border-line/60 px-3 py-1.5 text-xs last:border-0">
                  <span>{m.emoji}</span>
                  <span className={`min-w-0 flex-1 truncate ${on ? "" : "text-muted line-through"}`}>{m.name}</span>
                  <span className="text-[10px] text-muted">{m.cat}</span>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={`Mostrar ${m.name} en ${sede.name}`}
                    onClick={() => toggleVisible(m)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-accent" : "bg-line"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-muted">
            Lo que ocultas aquí desaparece del menú público y de la carta del mesero en {sede.short}. Diseño actual: {name(HEADERS, dz.header)}, {PALETTE[dz.color].label}, {name(PATTERNS, dz.pattern)}, {name(LAYOUTS, dz.layout)}.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <PhonePreview st={st} sede={sede} />
        <ProdLink href={MENU_URL} title="Ver un menú público real" description="Ejemplo de menú por QR de una sede de prueba, en el producto donde trabajé." />
      </div>
    </div>
  );
}

function patternStyle(pattern, hex) {
  const tint = `${hex}22`;
  switch (pattern) {
    case "puntos":
      return { backgroundImage: `radial-gradient(${tint} 1.2px, transparent 1.3px)`, backgroundSize: "12px 12px" };
    case "cuadros":
      return { backgroundImage: `linear-gradient(${tint} 1px, transparent 1px), linear-gradient(90deg, ${tint} 1px, transparent 1px)`, backgroundSize: "16px 16px" };
    case "rayas":
      return { backgroundImage: `repeating-linear-gradient(135deg, ${tint} 0 6px, transparent 6px 14px)` };
    default:
      return {};
  }
}

function PhonePreview({ st, sede }) {
  const [cat, setCat] = useState("Todo");
  const dz = st.design[st.sede];
  const hex = PALETTE[dz.color].hex;
  const items = MENU.filter((m) => st.visible[st.sede][m.id] && (cat === "Todo" || m.cat === cat));

  return (
    <div className="mx-auto w-full max-w-[250px] rounded-[2rem] border-[6px] border-[#1f2328] bg-[#1f2328] shadow-2xl">
      <div className="overflow-hidden rounded-[1.55rem] bg-[#faf8f5] text-[#1c1917]">
        {dz.header === "foto" && (
          <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${hex}, #1c1917)` }}>
            <span className="absolute -right-2 -top-3 text-6xl opacity-40">☕</span>
            <span className="absolute bottom-6 left-16 text-3xl opacity-30">🥐</span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
              <p className="truncate text-sm font-bold text-white">{sede.name}</p>
              <p className="text-[9px] text-white/80">Abierto · {sede.open}–{sede.close}</p>
            </div>
          </div>
        )}
        {dz.header === "solido" && (
          <div className="px-3 py-3 text-white" style={{ background: hex }}>
            <p className="text-[9px] uppercase tracking-widest opacity-80">Grupo Nova</p>
            <p className="truncate text-sm font-bold">{sede.name}</p>
            <p className="text-[9px] opacity-80">
              {sede.address} · {sede.open}–{sede.close}
            </p>
          </div>
        )}
        {dz.header === "minimal" && (
          <div className="border-b-2 bg-white px-3 py-3 text-center" style={{ borderColor: hex }}>
            <p className="truncate text-sm font-bold" style={{ color: hex }}>
              {sede.name}
            </p>
            <p className="text-[9px] text-stone-500">{sede.open}–{sede.close}</p>
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto bg-white px-2 py-1.5">
          {["Todo", ...CATS].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold transition"
              style={cat === c ? { background: hex, color: "#fff" } : { background: "#f1efeb", color: "#57534e" }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="h-[300px] overflow-y-auto p-2" style={patternStyle(dz.pattern, hex)}>
          {items.length === 0 && <p className="pt-10 text-center text-[10px] text-stone-400">Nada visible en esta categoría.</p>}
          {dz.layout === "grid" ? (
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((m) => (
                <div key={m.id} className="animate-pop overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
                  <div className="grid h-12 place-items-center text-2xl" style={{ background: `${hex}14` }}>
                    {m.emoji}
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-[10px] font-semibold">{m.name}</p>
                    <p className="line-clamp-2 text-[8px] leading-tight text-stone-500">{m.desc}</p>
                    <p className="mt-0.5 text-[10px] font-bold" style={{ color: hex }}>
                      {cop(m.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((m) => (
                <div key={m.id} className="flex animate-pop items-center gap-2 rounded-xl border border-black/5 bg-white p-1.5 shadow-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg" style={{ background: `${hex}14` }}>
                    {m.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold">{m.name}</p>
                    <p className="truncate text-[8px] text-stone-500">{m.desc}</p>
                  </div>
                  <p className="shrink-0 text-[10px] font-bold" style={{ color: hex }}>
                    {cop(m.price)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── 6. Cierre del día ───────────────────────────── */

function CierreStage({ ctx, setReport, onExport }) {
  const { st } = ctx;
  const sales = st.sales.filter((s) => st.report === "todas" || s.sede === st.report);
  const rows = sales.map((s) => {
    const sub = subtotalOf(s.items);
    return { ...s, sub, tipAmt: Math.round((sub * s.tip) / 100) };
  });
  const total = rows.reduce((a, r) => a + r.sub, 0);
  const tips = rows.reduce((a, r) => a + r.tipAmt, 0);

  const bySede = SEDE_IDS.map((id) => ({ id, total: st.sales.filter((s) => s.sede === id).reduce((a, s) => a + subtotalOf(s.items), 0) }));
  const maxSede = Math.max(1, ...bySede.map((b) => b.total));

  const products = {};
  rows.forEach((r) =>
    Object.entries(r.items).forEach(([id, q]) => {
      products[id] ??= { q: 0, v: 0 };
      products[id].q += q;
      products[id].v += q * item(id).price;
    })
  );
  const topProducts = Object.entries(products).sort((a, b) => b[1].v - a[1].v);
  const maxProduct = Math.max(1, ...topProducts.map(([, p]) => p.v));

  const waiters = {};
  rows.forEach((r) => {
    waiters[r.waiter] ??= { sede: r.sede, sessions: [], sales: 0, tips: 0 };
    const w = waiters[r.waiter];
    w.sessions.push(r);
    w.sales += r.sub;
    w.tips += r.tipAmt;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Ver</span>
        {[["todas", "Ambas sedes"], ...SEDE_IDS.map((id) => [id, st.sedes[id].short])].map(([k, l]) => (
          <Chip key={k} on={st.report === k} onClick={() => setReport(k)}>
            {l}
          </Chip>
        ))}
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => onExport("a Excel", "xlsx")} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-accent hover:text-accent">
            <Icon name="download" className="h-3.5 w-3.5" /> Excel
          </button>
          <button onClick={() => onExport("a PDF", "pdf")} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-accent hover:text-accent">
            <Icon name="download" className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Ventas", cop(total)],
          ["Mesas", rows.length],
          ["Ticket medio", cop(rows.length ? total / rows.length : 0)],
          ["Propinas", cop(tips)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line p-2.5">
            <p className="text-[10px] uppercase tracking-widest text-muted">{k}</p>
            <p className="font-display text-base font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel title="Por sede" icon="pin">
          {bySede.map((b) => (
            <div key={b.id} className={`text-xs ${st.report !== "todas" && st.report !== b.id ? "opacity-40" : ""}`}>
              <div className="flex justify-between">
                <span>{st.sedes[b.id].short}</span>
                <span className="font-semibold">{cop(b.total)}</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-line">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(b.total / maxSede) * 100}%` }} />
              </div>
            </div>
          ))}
        </Panel>
        <Panel title="Por producto" icon="filter">
          {topProducts.slice(0, 6).map(([id, p]) => (
            <div key={id} className="text-xs">
              <div className="flex justify-between gap-2">
                <span className="truncate">
                  {item(id).emoji} {item(id).name} <span className="text-muted">×{p.q}</span>
                </span>
                <span className="shrink-0 font-semibold">{cop(p.v)}</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-line">
                <div className="h-full rounded-full bg-warm" style={{ width: `${(p.v / maxProduct) * 100}%` }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <div>
        <Label>Por mesero y propinas por persona</Label>
        <div className="space-y-2">
          {Object.entries(waiters)
            .sort((a, b) => b[1].sales - a[1].sales)
            .map(([name, w]) => (
              <div key={name} className="rounded-2xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">{initials(name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="text-[10px] text-muted">
                      {st.sedes[w.sede].short} · {w.sessions.length} mesa(s) · {cop(w.sales)} en ventas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted">Propinas</p>
                    <p className="font-display text-sm font-bold text-accent">{cop(w.tips)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.sessions.map((r, i) => (
                    <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] ${r.fresh ? "animate-pop bg-accent/15 text-accent" : "bg-bg/70 text-muted"}`}>
                      {r.label} · {r.tip ? cop(r.tipAmt) : "sin propina"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
        <p className="mt-2 text-[10px] text-muted">Cada propina se suma a quien era dueño de la sesión de la mesa. Las mesas que cierres en la demo aparecen resaltadas.</p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Panel del sistema ───────────────────────────── */

function SystemPanels({ st, sede, me }) {
  const res = st.reservations.filter((r) => r.sede === st.sede);
  const last = st.booking && st.reservations.find((r) => r.id === st.booking.resId);
  const open = st.sessions.filter((s) => s.sede === st.sede && !s.closed);
  const notices = st.notices.filter((n) => n.sede === st.sede).slice(-4).reverse();
  const cooking = st.dishes.filter((d) => d.sede === st.sede && (d.status === "pendiente" || d.status === "preparando")).length;

  return (
    <>
      <Panel title="Sede activa" icon="pin">
        <Row k="Nombre" v={sede.name} />
        <Row k="Horario" v={`${sede.open}–${sede.close}`} />
        <Row k="Mesas / puestos" v={`${sede.tables.length} / ${sede.tables.reduce((a, t) => a + t.cap, 0)}`} />
        <Row k="Platos visibles" v={MENU.filter((m) => st.visible[st.sede][m.id]).length} />
      </Panel>

      <Panel title="Reservas" icon="calendar">
        <Row k="Hoy / mañana" v={`${res.filter((r) => r.day === "hoy").length} / ${res.filter((r) => r.day === "manana").length}`} />
        <Row k="Por llegar" v={res.filter((r) => r.status === "pendiente").length} />
        {last ? (
          <div className="mt-1 animate-pop rounded-lg bg-accent/10 p-2 text-[11px]">
            <p className="font-semibold text-accent">{last.id} · confirmada</p>
            <p className="text-muted">
              {last.name} · {last.party} p. · {labelOf(last.tables)}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted">La asignación de mesa se calcula al reservar.</p>
        )}
      </Panel>

      <Panel title="Sesiones abiertas" icon="users">
        {open.length === 0 && <p className="text-[11px] text-muted">Ninguna.</p>}
        {open.map((s) => (
          <Row
            key={s.id}
            k={labelOf(s.tables)}
            v={
              <span className={s.owner === me ? "text-accent" : ""}>
                {s.owner}
                {s.owner === me ? " (tú)" : ""}
              </span>
            }
          />
        ))}
        <Row k="Platos en cocina" v={cooking} />
      </Panel>

      <Panel title="Avisos al mesero" icon="bell">
        {notices.length === 0 && <p className="text-[11px] text-muted">Cuando la cocina marca un plato listo, le llega aviso al dueño de la mesa.</p>}
        {notices.map((n) => (
          <div key={n.id} className={`animate-pop rounded-lg p-1.5 text-[11px] ${n.read ? "text-muted" : "bg-[#10B981]/10"}`}>
            <span className="font-semibold">{n.waiter.split(" ")[0]}:</span> {n.text}
            {n.read && " · entregado"}
          </div>
        ))}
      </Panel>
    </>
  );
}

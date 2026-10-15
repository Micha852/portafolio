"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icons";
import { useSim, MobileTabs, ExecLog, Panel, Row, Badge, ProdLink } from "./ui";

// Demo propia de restaurante + POS con datos ficticios: mesas, platos con variantes y adiciones,
// pedidos por estación, pantalla de cocina, cobro con propina, factura y consumo de recetas.
// Estados, etiquetas y el momento del descuento de inventario siguen el código real; el menú es de ejemplo.

const cop = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;

const AREAS = { cocina: "Cocina", bar: "Bar" };

// Menú de ejemplo. Las adiciones son productos con su propio precio; las variantes tienen precio completo.
const MENU = [
  {
    id: "bandeja",
    name: "Bandeja paisa",
    price: 32000,
    area: "cocina",
    prep: 20,
    additions: [
      { id: "huevo", name: "Huevo", price: 3000 },
      { id: "aguacate", name: "Aguacate", price: 4000 },
      { id: "chicharron", name: "Chicharrón extra", price: 6000 },
    ],
    recipe: [
      ["Frijol", 250, "g"],
      ["Arroz", 150, "g"],
      ["Carne molida", 120, "g"],
      ["Chicharrón", 100, "g"],
      ["Plátano maduro", 1, "und"],
      ["Arepa", 1, "und"],
    ],
  },
  {
    id: "hamburguesa",
    name: "Hamburguesa BBQ",
    price: 28000,
    area: "cocina",
    prep: 15,
    additions: [
      { id: "tocineta", name: "Tocineta", price: 4000 },
      { id: "queso", name: "Queso extra", price: 3000 },
    ],
    recipe: [
      ["Pan brioche", 1, "und"],
      ["Carne de res", 150, "g"],
      ["Queso", 1, "tajada"],
      ["Salsa BBQ", 30, "g"],
    ],
  },
  {
    id: "papas",
    name: "Papas gajo",
    price: 9000,
    area: "cocina",
    prep: 10,
    additions: [],
    recipe: [
      ["Papa", 250, "g"],
      ["Aceite", 40, "ml"],
    ],
  },
  {
    id: "limonada",
    name: "Limonada",
    area: "bar",
    prep: 5,
    additions: [],
    // Combinación: cada opción es un producto hijo con su propio precio
    variants: [
      {
        id: "natural",
        name: "Natural",
        price: 8000,
        recipe: [
          ["Limón", 2, "und"],
          ["Azúcar", 20, "g"],
        ],
      },
      {
        id: "coco",
        name: "de coco",
        price: 18000,
        recipe: [
          ["Limón", 2, "und"],
          ["Crema de coco", 60, "ml"],
          ["Azúcar", 20, "g"],
        ],
      },
    ],
  },
];
const NOTES = ["sin cebolla", "término medio", "extra picante", "sin hielo"];

const TABLES = [
  { id: "Mesa 2", status: "Ocupada" },
  { id: "Mesa 4", status: "Disponible" },
  { id: "Mesa 6", status: "Reservada" },
  { id: "Terraza 1", status: "Disponible" },
];
const TABLE_COLORS = { Disponible: "#10B981", Ocupada: "#F59E0B", Reservada: "#8B5CF6" };

// Estados de ítem (TableItemStatus)
const ITEM = {
  PENDING: { label: "Pendiente", color: "#94A3B8" },
  SENT: { label: "Enviado", color: "#3B82F6" },
  PREPARING: { label: "Preparando", color: "#F59E0B" },
  READY: { label: "Listo", color: "#10B981" },
  DELIVERED: { label: "Entregado", color: "#2DD4BF" },
  BILLED: { label: "Facturado", color: "#8B5CF6" },
};
// Estados de la orden de cocina (KitchenOrder)
const OCO = { IN_PROGRESS: "En cocina", READY: "Lista", DELIVERED: "Servida", COMPLETED: "Cerrada" };

const TIP_PERCENT = 10;
const OPENING_CASH = 200000;

const initialState = () => ({
  phase: "mesa", // mesa → pedido → cobro → cerrada → cierre
  table: null,
  tables: TABLES.map((t) => ({ ...t })),
  sessionOpen: false,
  items: [],
  comandas: [],
  ocos: [],
  printed: null,
  preBill: false,
  tip: true,
  method: "Efectivo",
  invoice: null,
  inventory: [],
  entries: [],
  cashSales: 0,
  closing: null,
  log: [],
  seq: { item: 0, comanda: 40, oco: 0 },
});

function TableService() {
  const { st, update, reset, sequence, busy } = useSim(initialState);
  const [tab, setTab] = useState("mesero");
  const [kdsFilter, setKdsFilter] = useState("todas");
  const [draft, setDraft] = useState(null); // plato que se está armando

  const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));

  // Cronómetro de cocina: 1 minuto simulado cada 0,4 s mientras algo se prepara
  const preparing = st.comandas.some((c) => c.status === "preparando");
  useEffect(() => {
    if (!preparing) return;
    const t = setInterval(() => update((x) => x.comandas.forEach((c) => c.status === "preparando" && (c.elapsed += 1))), 400);
    return () => clearInterval(t);
  }, [preparing]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => {
    reset();
    setDraft(null);
    setTab("mesero");
  };

  const pickTable = (id) => {
    update((x) => {
      x.table = id;
      x.phase = "pedido";
    });
    log(`El mesero abre la ${id}`);
  };

  const openDraft = (product) =>
    setDraft({ product, variant: product.variants?.[0]?.id ?? null, additions: [], notes: [], qty: 1 });

  const addToAccount = () => {
    const { product, variant, additions, notes, qty } = draft;
    const v = product.variants?.find((x) => x.id === variant);
    update((x) => {
      if (!x.sessionOpen) {
        x.sessionOpen = true;
        x.tables.find((t) => t.id === x.table).status = "Ocupada";
      }
      const uid = ++x.seq.item;
      x.items.push({
        uid,
        productId: product.id,
        name: v ? `${product.name} ${v.name}` : product.name,
        price: v ? v.price : product.price,
        recipe: v ? v.recipe : product.recipe,
        qty,
        notes: notes.join(", "),
        area: product.area,
        prep: product.prep,
        status: "PENDING",
      });
      additions.forEach((aid) => {
        const a = product.additions.find((y) => y.id === aid);
        x.items.push({ uid: ++x.seq.item, parent: uid, name: a.name, price: a.price, qty, area: product.area, status: "PENDING" });
      });
    });
    if (!st.sessionOpen) log(`Se abre la cuenta y la ${st.table} pasa a Ocupada`);
    log(`Agregar ítem: ${qty} × ${v ? `${product.name} ${v.name}` : product.name}${additions.length ? ` + ${additions.length} adición(es)` : ""}${notes.length ? ` (${notes.join(", ")})` : ""}`);
    setDraft(null);
  };

  // Enviar a cocina: un pedido por estación, según la estación de cada producto
  const sendToKitchen = () =>
    sequence(async (wait) => {
      const pending = st.items.filter((i) => i.status === "PENDING");
      const byArea = {};
      pending.forEach((i) => (byArea[i.area] ??= []).push(i.uid));
      update((x) => x.items.forEach((i) => i.status === "PENDING" && (i.status = "SENT")));
      log("Enviar a preparación: los ítems pasan a Enviado");
      await wait(500);
      for (const [area, uids] of Object.entries(byArea)) {
        const mains = st.items.filter((i) => uids.includes(i.uid) && !i.parent);
        mains.forEach((m) => log(`${m.name} → estación ${AREAS[area]}`));
        let number;
        update((x) => {
          number = ++x.seq.comanda;
          x.comandas.push({
            id: number,
            area,
            table: x.table,
            uids,
            status: "nuevas",
            elapsed: 0,
            est: Math.max(...mains.map((m) => m.prep)),
            oco: null,
          });
          x.printed = { number, area, table: x.table, lines: x.items.filter((i) => uids.includes(i.uid)) };
        });
        log(`Pedido #${number} (${AREAS[area]}) impreso y en «Por preparar»`, "ok");
        await wait(700);
      }
    });

  // La cocina empieza a preparar: se registra el consumo previsto de la receta
  const startPreparing = (comandaId) => {
    update((x) => {
      const c = x.comandas.find((y) => y.id === comandaId);
      c.status = "preparando";
      const ocoId = `REC-${String(++x.seq.oco).padStart(3, "0")}`;
      c.oco = ocoId;
      x.items.forEach((i) => c.uids.includes(i.uid) && (i.status = "PREPARING"));
      x.ocos.push({ id: ocoId, comanda: comandaId, status: "IN_PROGRESS", uids: c.uids });
    });
    const c = st.comandas.find((y) => y.id === comandaId);
    log(`Pedido #${comandaId} en cocina: se registra el consumo de receta ${c.oco}`);
    log("El inventario se descuenta al cobrar la cuenta", "warn");
  };

  const markReady = (comandaId) => {
    update((x) => {
      const c = x.comandas.find((y) => y.id === comandaId);
      c.status = "listo";
      x.items.forEach((i) => c.uids.includes(i.uid) && (i.status = "READY"));
      x.ocos.find((o) => o.comanda === comandaId).status = "READY";
    });
    const c = st.comandas.find((y) => y.id === comandaId);
    log(`¡Listo! Pedido #${comandaId} en ${c.elapsed} min (estimado ${c.est} min)`, "ok");
  };

  const deliver = () => {
    update((x) => {
      x.items.forEach((i) => i.status === "READY" && (i.status = "DELIVERED"));
      x.comandas.forEach((c) => {
        if (c.status === "listo") {
          c.status = "entregada";
          x.ocos.find((o) => o.comanda === c.id).status = "DELIVERED";
        }
      });
    });
    log("El mesero entrega en la mesa: ítems Entregados");
  };

  const goToPos = () => {
    update((x) => (x.phase = "cobro"));
    log(`POS · pestaña Mesas: se cargan los ítems entregados de la ${st.table}`);
  };

  const totals = (() => {
    const subtotal = st.items.reduce((a, i) => a + i.price * i.qty, 0);
    const tip = st.tip ? Math.round((subtotal * TIP_PERCENT) / 100) : 0;
    return { subtotal, tip, total: subtotal + tip };
  })();

  // Cobrar: factura, consumo de recetas, asientos y mesa libre
  const processSale = () =>
    sequence(async (wait) => {
      const number = `FV-${120 + (st.invoice ? 1 : 0)}`;
      update((x) => (x.invoice = { number, ...totals, method: x.method, dian: "Emitiendo…" }));
      log(`Procesar venta: factura electrónica ${number} por ${cop(totals.total)} (${st.method})`);
      await wait(1100);
      update((x) => (x.invoice.dian = "Emitida"));
      log(`Factura ${number} emitida`, "ok");
      await wait(900);

      update((x) => {
        x.items.forEach((i) => (i.status = "BILLED"));
        x.ocos.forEach((o) => (o.status = "COMPLETED"));
      });
      log("Ítems Facturados · órdenes de cocina Facturadas");
      await wait(900);

      // Consumo de insumos según receta × cantidad
      const consumed = {};
      st.items
        .filter((i) => i.recipe)
        .forEach((i) =>
          i.recipe.forEach(([name, q, unit]) => {
            consumed[name] ??= { q: 0, unit };
            consumed[name].q += q * i.qty;
          })
        );
      // Las adiciones son productos propios: sale el producto vendido, sin receta
      st.items
        .filter((i) => i.parent)
        .forEach((i) => {
          const key = `${i.name} (adición)`;
          consumed[key] ??= { q: 0, unit: "und" };
          consumed[key].q += i.qty;
        });
      const lines = Object.entries(consumed).map(([name, { q, unit }]) => ({ name, q, unit }));
      for (const line of lines) {
        update((x) => x.inventory.push(line));
        await wait(180);
      }
      log(`Salida de inventario: ${lines.length} insumos y productos descontados`);
      await wait(700);

      update((x) =>
        x.entries.push(
          ...x.ocos.map((o) => ({ title: `Consumo de receta ${o.id}`, debit: "Costo de ventas", credit: "Inventario de insumos" }))
        )
      );
      log("Asiento contable de cada orden de producción", "ok");
      await wait(800);

      if (totals.tip) {
        update((x) => x.entries.push({ title: `Propina ${number}`, debit: "Caja", credit: "Propinas por pagar", amount: totals.tip }));
        log(`Propina de ${cop(totals.tip)} registrada para el equipo`);
        await wait(700);
      }

      update((x) => {
        x.tables.find((t) => t.id === x.table).status = "Disponible";
        x.sessionOpen = false;
        x.phase = "cerrada";
        if (x.method === "Efectivo") x.cashSales += totals.total;
      });
      log(`Cerrar mesa: la ${st.table} vuelve a Disponible`, "ok");
    });

  const closeRegister = () =>
    sequence(async (wait) => {
      update((x) => (x.phase = "cierre"));
      const expected = OPENING_CASH + st.cashSales;
      update((x) => (x.closing = { opening: OPENING_CASH, sales: x.cashSales, expected, counted: null }));
      log("Cerrar sesión de caja: se calcula el valor esperado");
      await wait(1200);
      update((x) => (x.closing.counted = expected));
      log(`Conteo físico ${cop(expected)} · diferencia $0 · arqueo listo en PDF`, "ok");
    });

  const pendingCount = st.items.filter((i) => i.status === "PENDING").length;
  const readyCount = st.items.filter((i) => i.status === "READY").length;
  const allDelivered = st.items.length > 0 && st.items.every((i) => i.status === "DELIVERED");
  const pane = (name) => (tab === name ? "flex" : "hidden lg:flex");

  const hint = {
    mesa: "Elige una mesa disponible para empezar.",
    pedido:
      pendingCount > 0
        ? "Agrega más platos o envía la comanda a preparación."
        : readyCount > 0
        ? "Hay platos listos: entrégalos en la mesa."
        : allDelivered
        ? "Todo entregado. Ya puedes cobrar en el POS."
        : st.items.length
        ? "Ahora eres la cocina: marca «Preparando» y luego «¡Listo!»."
        : "Toca un plato del menú para armarlo.",
    cobro: "Revisa la cuenta, decide la propina y procesa la venta.",
    cerrada: "Venta facturada. Puedes atender otra mesa o cerrar la caja.",
    cierre: "Caja cerrada. ¡Fin del turno!",
  }[st.phase];

  return (
    <div className="flex h-full flex-col">
      <MobileTabs
        tabs={[
          ["mesero", "Mesero"],
          ["cocina", "Cocina"],
          ["sistema", "Sistema"],
        ]}
        tab={tab}
        setTab={setTab}
        pulse={st.comandas.some((c) => c.status === "nuevas" || c.status === "preparando") ? "cocina" : busy ? "sistema" : null}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[380px_1fr_300px]">
        {/* Mesero y POS */}
        <section data-guide="rest-mesero" className={`${pane("mesero")} min-h-0 flex-col border-line lg:border-r`}>
          <div data-guide="rest-hint" className="shrink-0 border-b border-line bg-warm/10 px-4 py-2.5 text-xs font-medium text-warm">{hint}</div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {st.phase === "mesa" && (
              <>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Salón</p>
                <div className="grid grid-cols-2 gap-3">
                  {st.tables.map((t) => {
                    const free = t.status === "Disponible";
                    return (
                      <button
                        key={t.id}
                        disabled={!free}
                        onClick={() => pickTable(t.id)}
                        className={`rounded-2xl border p-4 text-left transition ${free ? "border-line hover:-translate-y-0.5 hover:border-accent" : "cursor-not-allowed border-line opacity-50"}`}
                      >
                        <p className="font-display text-lg font-bold">{t.id}</p>
                        <Badge color={TABLE_COLORS[t.status]}>{t.status}</Badge>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {st.phase === "pedido" && !draft && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display font-bold">{st.table}</p>
                  <Badge color={TABLE_COLORS[st.tables.find((t) => t.id === st.table).status]}>{st.tables.find((t) => t.id === st.table).status}</Badge>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Menú</p>
                <div className="grid grid-cols-2 gap-2">
                  {MENU.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openDraft(p)}
                      className="rounded-xl border border-line p-3 text-left transition hover:border-accent hover:bg-accent/5"
                    >
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted">{p.variants ? `desde ${cop(p.variants[0].price)}` : cop(p.price)}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        {AREAS[p.area]} · {p.prep} min
                      </p>
                    </button>
                  ))}
                </div>
                <Account st={st} onSend={sendToKitchen} onDeliver={deliver} onPay={goToPos} busy={busy} />
              </>
            )}

            {st.phase === "pedido" && draft && <DishBuilder draft={draft} setDraft={setDraft} onAdd={addToAccount} />}

            {st.phase === "cobro" && (
              <Checkout
                st={st}
                totals={totals}
                busy={busy}
                setTip={(v) => update((x) => (x.tip = v))}
                setMethod={(m) => update((x) => (x.method = m))}
                onPreBill={() => {
                  update((x) => (x.preBill = true));
                  log("Cuenta previa impresa para la mesa");
                }}
                onProcess={processSale}
              />
            )}

            {(st.phase === "cerrada" || st.phase === "cierre") && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4 text-center">
                  <Icon name="check" className="mx-auto h-8 w-8 text-accent" />
                  <p className="mt-2 font-display font-bold">Venta {st.invoice?.number} facturada</p>
                  <p className="text-sm text-muted">{cop(st.invoice?.total ?? 0)} · {st.invoice?.method}</p>
                </div>
                {st.phase === "cerrada" && (
                  <button onClick={closeRegister} disabled={busy} className="w-full rounded-full bg-warm px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50">
                    Cerrar la caja del turno
                  </button>
                )}
                {st.closing && (
                  <Panel title="Cierre de caja">
                    <Row k="Apertura" v={cop(st.closing.opening)} />
                    <Row k="Ventas en efectivo" v={cop(st.closing.sales)} />
                    <Row k="Esperado" v={cop(st.closing.expected)} />
                    <Row k="Conteo físico" v={st.closing.counted == null ? "contando…" : cop(st.closing.counted)} />
                    <Row k="Diferencia" v={st.closing.counted == null ? "—" : <span className="text-accent">$0</span>} />
                  </Panel>
                )}
                <button onClick={restart} className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent">
                  <Icon name="refresh" className="h-4 w-4" />
                  Reiniciar la demo
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Pantalla de cocina (KDS) */}
        <section data-guide="rest-cocina" className={`${pane("cocina")} min-h-0 flex-col`}>
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line px-4 py-2">
            <p className="mr-2 text-xs font-semibold uppercase tracking-widest text-muted">Cocina</p>
            {[
              ["todas", "Todas las áreas"],
              ["cocina", "Cocina"],
              ["bar", "Bar"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setKdsFilter(k)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${kdsFilter === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
            {[
              ["nuevas", "Por preparar", "#3B82F6"],
              ["preparando", "En cocina", "#F59E0B"],
              ["listo", "Para entregar", "#10B981"],
            ].map(([status, title, color]) => {
              const cards = st.comandas.filter((c) => c.status === status && (kdsFilter === "todas" || c.area === kdsFilter));
              return (
                <div key={status} className="flex min-w-0 flex-col">
                  <div className="mb-2 flex items-center gap-1.5 border-b-2 pb-1.5" style={{ borderColor: color }}>
                    <span className="text-xs font-semibold">{title}</span>
                    <span className="ml-auto text-[11px] text-muted">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map((c) => (
                      <KitchenCard key={c.id} c={c} items={st.items} onStart={() => startPreparing(c.id)} onReady={() => markReady(c.id)} />
                    ))}
                    {cards.length === 0 && <p className="rounded-xl bg-bg/40 py-6 text-center text-[11px] text-muted">Sin comandas</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <ExecLog log={st.log} empty="Esperando la primera mesa…" />
        </section>

        {/* Lo que pasa por dentro */}
        <section data-guide="rest-sistema" className={`${pane("sistema")} min-h-0 flex-col gap-3 overflow-y-auto border-line p-4 lg:border-l`}>
          <Panel title="Mesa y cuenta">
            <Row k="Mesa" v={st.table ?? <span className="text-muted">—</span>} />
            <Row k="Cuenta" v={st.sessionOpen ? <span className="text-warm">Abierta</span> : st.invoice ? "Cerrada" : <span className="text-muted">—</span>} />
            <Row k="Ítems" v={st.items.length} />
          </Panel>

          {st.printed && <ComandaTicket p={st.printed} />}

          <Panel title="Consumo de recetas">
            {st.ocos.length === 0 ? (
              <p className="text-xs text-muted">Se registra cuando la cocina empieza a preparar.</p>
            ) : (
              st.ocos.map((o) => <Row key={o.id} k={o.id} v={<Badge color={o.status === "COMPLETED" ? "#8B5CF6" : o.status === "IN_PROGRESS" ? "#F59E0B" : "#10B981"}>{OCO[o.status]}</Badge>} />)
            )}
          </Panel>

          <Panel title="Factura">
            {st.invoice ? (
              <>
                <Row k="Número" v={st.invoice.number} />
                <Row k="Total" v={cop(st.invoice.total)} />
                <Row k="Estado" v={<span className={st.invoice.dian === "Emitida" ? "text-accent" : "text-warm"}>{st.invoice.dian}</span>} />
              </>
            ) : (
              <p className="text-xs text-muted">Se emite al cobrar la cuenta.</p>
            )}
          </Panel>

          <Panel title="Inventario">
            {st.inventory.length === 0 ? (
              <p className="text-xs text-muted">Sin movimientos. Los insumos de la receta se descuentan al facturar, no al marcar «Listo».</p>
            ) : (
              st.inventory.map((l) => (
                <div key={l.name} className="flex animate-pop justify-between text-xs">
                  <span className="text-muted">{l.name}</span>
                  <span className="font-medium text-warm">
                    −{l.q} {l.unit}
                  </span>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Contabilidad">
            {st.entries.length === 0 ? (
              <p className="text-xs text-muted">Sin asientos todavía.</p>
            ) : (
              st.entries.map((e) => (
                <div key={e.title} className="animate-pop rounded-lg bg-bg/70 p-2 text-[11px]">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-muted">Db {e.debit}</p>
                  <p className="text-muted">Cr {e.credit}</p>
                  {e.amount && <p className="text-accent">{cop(e.amount)}</p>}
                </div>
              ))
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}

function DishBuilder({ draft, setDraft, onAdd }) {
  const { product, variant, additions, notes, qty } = draft;
  const base = product.variants ? product.variants.find((v) => v.id === variant).price : product.price;
  const extra = additions.reduce((a, id) => a + product.additions.find((x) => x.id === id).price, 0);
  const toggle = (key, value) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value] }));

  return (
    <div className="animate-pop space-y-4">
      <button onClick={() => setDraft(null)} className="text-xs text-muted transition hover:text-accent">
        ← Volver al menú
      </button>
      <div>
        <p className="font-display text-xl font-bold">{product.name}</p>
        <p className="text-xs text-muted">
          Plato · {AREAS[product.area]} · {product.prep} minutos de preparación
        </p>
      </div>

      {product.variants && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">Combinación · Sabor</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setDraft((d) => ({ ...d, variant: v.id }))}
                className={`rounded-full border px-3 py-1 text-xs transition ${variant === v.id ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
              >
                {v.name} · {cop(v.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.additions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">Adiciones del plato</p>
          <div className="space-y-1.5">
            {product.additions.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-line px-3 py-2 text-sm transition hover:border-accent/60">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={additions.includes(a.id)} onChange={() => toggle("additions", a.id)} className="accent-[rgb(var(--accent))]" />
                  {a.name}
                </span>
                <span className="text-xs text-muted">+{cop(a.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">Notas para la cocina</p>
        <div className="flex flex-wrap gap-1.5">
          {NOTES.map((n) => (
            <button
              key={n}
              onClick={() => toggle("notes", n)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${notes.includes(n) ? "border-warm bg-warm/15 text-warm" : "border-line text-muted"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-line">
          <button onClick={() => setDraft((d) => ({ ...d, qty: Math.max(1, d.qty - 1) }))} className="px-3 py-1.5 text-muted hover:text-accent" aria-label="Menos">
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button onClick={() => setDraft((d) => ({ ...d, qty: Math.min(5, d.qty + 1) }))} className="px-3 py-1.5 text-muted hover:text-accent" aria-label="Más">
            +
          </button>
        </div>
        <button onClick={onAdd} className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-110">
          Agregar · {cop((base + extra) * qty)}
        </button>
      </div>
    </div>
  );
}

function Account({ st, onSend, onDeliver, onPay, busy }) {
  const mains = st.items.filter((i) => !i.parent);
  const pending = st.items.some((i) => i.status === "PENDING");
  const ready = st.items.some((i) => i.status === "READY");
  const allDelivered = st.items.length > 0 && st.items.every((i) => i.status === "DELIVERED");

  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Cuenta de la mesa</p>
      {mains.length === 0 ? (
        <p className="rounded-xl bg-bg/40 py-4 text-center text-xs text-muted">Aún no hay ítems.</p>
      ) : (
        <ul className="space-y-1.5">
          {mains.map((m) => (
            <li key={m.uid} className="animate-pop rounded-xl border border-line p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">
                  {m.qty} × {m.name}
                </p>
                <Badge color={ITEM[m.status].color}>{ITEM[m.status].label}</Badge>
              </div>
              {st.items
                .filter((a) => a.parent === m.uid)
                .map((a) => (
                  <p key={a.uid} className="text-xs text-muted">
                    + {a.name} ({cop(a.price)})
                  </p>
                ))}
              {m.notes && <p className="text-xs italic text-warm">({m.notes})</p>}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 space-y-2">
        {pending && (
          <button onClick={onSend} disabled={busy} className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50">
            Enviar a preparación
          </button>
        )}
        {ready && (
          <button onClick={onDeliver} className="w-full rounded-full bg-[#10B981] px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-110">
            Entregar lo que está listo
          </button>
        )}
        {allDelivered && (
          <button onClick={onPay} className="w-full rounded-full bg-warm px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-110">
            Cobrar en el POS
          </button>
        )}
      </div>
    </div>
  );
}

function Checkout({ st, totals, busy, setTip, setMethod, onPreBill, onProcess }) {
  return (
    <div className="animate-pop space-y-4">
      <div>
        <p className="font-display text-xl font-bold">POS · {st.table}</p>
        <p className="text-xs text-muted">Ítems entregados en la mesa</p>
      </div>
      <ul className="space-y-1 text-sm">
        {st.items.map((i) => (
          <li key={i.uid} className="flex justify-between gap-2">
            <span className={i.parent ? "pl-3 text-muted" : ""}>
              {i.parent ? "+ " : `${i.qty} × `}
              {i.name}
            </span>
            <span className="text-muted">{cop(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{cop(totals.subtotal)}</span>
        </div>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={st.tip} onChange={(e) => setTip(e.target.checked)} disabled={busy} className="accent-[rgb(var(--accent))]" />
            Propina sugerida ({TIP_PERCENT} %)
          </span>
          <span>{cop(totals.tip)}</span>
        </label>
        <div className="flex justify-between font-display text-lg font-bold">
          <span>Total</span>
          <span>{cop(totals.total)}</span>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">Medio de pago</p>
        <div className="flex gap-2">
          {["Efectivo", "Tarjeta", "Transferencia"].map((m) => (
            <button
              key={m}
              disabled={busy}
              onClick={() => setMethod(m)}
              className={`flex-1 rounded-full border px-2 py-1.5 text-xs transition ${st.method === m ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {st.preBill ? (
        <p className="rounded-lg border border-dashed border-line p-2 text-center font-mono text-[11px] text-muted">Cuenta previa · {cop(totals.total)}</p>
      ) : (
        <button onClick={onPreBill} disabled={busy} className="w-full rounded-full border border-line px-4 py-2 text-sm transition hover:border-accent hover:text-accent">
          Imprimir cuenta previa
        </button>
      )}
      <button onClick={onProcess} disabled={busy} className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50">
        {busy ? "Cobrando…" : "Cobrar"}
      </button>
    </div>
  );
}

function KitchenCard({ c, items, onStart, onReady }) {
  const lines = items.filter((i) => c.uids.includes(i.uid));
  const pct = c.elapsed / c.est;
  const timer = pct < 0.7 ? "#10B981" : pct <= 1 ? "#F59E0B" : "#EF4444";
  return (
    <div className="animate-pop rounded-xl border border-line bg-surface p-3 shadow-md">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-bold">
          #{c.id} · {c.table}
        </p>
        <span className="text-[10px] font-semibold uppercase text-muted">{AREAS[c.area]}</span>
      </div>
      <ul className="space-y-0.5 text-xs">
        {lines.map((i) => (
          <li key={i.uid} className={i.parent ? "pl-3 text-muted" : "font-medium"}>
            {i.parent ? `+ ${i.name}` : `${i.qty} × ${i.name}`}
            {i.notes && <span className="block text-[11px] italic text-warm">({i.notes})</span>}
          </li>
        ))}
      </ul>
      {c.status !== "nuevas" && (
        <p className="mt-2 text-[11px] font-semibold" style={{ color: timer }}>
          {pct > 1 && "⚠️ "}
          {c.elapsed} / {c.est} min
        </p>
      )}
      {c.status === "nuevas" && (
        <button onClick={onStart} className="mt-2 w-full rounded-lg bg-[#F59E0B] py-1.5 text-xs font-semibold text-bg transition hover:brightness-110">
          Preparando
        </button>
      )}
      {c.status === "preparando" && (
        <button onClick={onReady} className="mt-2 w-full rounded-lg bg-[#10B981] py-1.5 text-xs font-semibold text-bg transition hover:brightness-110">
          ¡Listo!
        </button>
      )}
      {c.status === "listo" && <p className="mt-2 text-center text-[11px] text-muted">Esperando al mesero</p>}
    </div>
  );
}

function ComandaTicket({ p }) {
  return (
    <div className="animate-pop rounded-2xl border border-dashed border-line bg-[#fbfaf7] p-3 font-mono text-[11px] leading-relaxed text-[#1f2328]">
      <p className="text-center font-bold">
        PEDIDO #{p.number} · {AREAS[p.area]}
      </p>
      <p>{p.table} · Mesero: Julián</p>
      <p className="border-b border-dashed border-[#1f2328]/30 pb-1">-----------------------</p>
      {p.lines.map((i) => (
        <div key={i.uid}>
          <p>
            {i.qty} X {i.name.toUpperCase()}
          </p>
          {i.notes && <p className="pl-2">({i.notes})</p>}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────── Vistas del simulador ───────────────────────────── */

export default function RestaurantSimulator() {
  const [view, setView] = useState("mesa");
  return (
    <div className="flex h-full flex-col">
      <div data-guide="rest-views" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2">
        {[
          ["mesa", "Atender una mesa", "user"],
          ["sedes", "Sedes y menú público", "grid"],
        ].map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              view === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name={icon} className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      {/* Las dos vistas quedan montadas para conservar su avance */}
      <div className={view === "mesa" ? "min-h-0 flex-1" : "hidden"}>
        <TableService />
      </div>
      <div className={view === "sedes" ? "min-h-0 flex-1" : "hidden"}>
        <SedesMenu />
      </div>
    </div>
  );
}

/* ───────────────────────────── Sedes y menú público ───────────────────────────── */

const MENU_URL = "https://contagracia.com/menu/2bf7cc00-acfc-444c-98df-1790907c4c4a/a1939a84-f77c-4bdb-b7dd-d249580ee52f";

// Catálogo del menú público: secciones Platos, Adiciones y Productos
const CATALOG = [
  { id: "bandeja", section: "Platos", name: "Bandeja paisa", desc: "Frijol, arroz, carne molida, chicharrón, plátano y arepa", price: 32000 },
  { id: "hamburguesa", section: "Platos", name: "Hamburguesa BBQ", desc: "Pan brioche, carne de res, queso y salsa BBQ", price: 28000 },
  { id: "papas", section: "Platos", name: "Papas gajo", desc: "Papa en gajos con especias", price: 9000 },
  { id: "limonada-coco", section: "Platos", name: "Limonada de coco", desc: "Limón, crema de coco y hielo", price: 18000 },
  { id: "huevo", section: "Adiciones", name: "Huevo", desc: "Frito o revuelto", price: 3000 },
  { id: "aguacate", section: "Adiciones", name: "Aguacate", desc: "Media unidad", price: 4000 },
  { id: "tocineta", section: "Adiciones", name: "Tocineta", desc: "Dos tiras crocantes", price: 4000 },
  { id: "gaseosa", section: "Productos", name: "Gaseosa 400 ml", desc: "Sabores surtidos", price: 5000 },
  { id: "agua", section: "Productos", name: "Agua sin gas", desc: "Botella 600 ml", price: 4000 },
];
const SECTIONS = ["Platos", "Adiciones", "Productos"];

const SEDES = [
  { id: "centro", name: "Sede Plaza", address: "Calle 10 # 5-20", slug: "sede-plaza" },
  { id: "norte", name: "Sede Río", address: "Av. Circunvalar # 8-14", slug: "sede-rio" },
];
const copMenu = (n) => `$ ${n.toLocaleString("es-CO")},00`;

function SedesMenu() {
  const { st, update } = useSim(() => ({
    sede: "centro",
    // Visibilidad y disponibilidad por sede
    visible: {
      centro: Object.fromEntries(CATALOG.map((p) => [p.id, true])),
      norte: Object.fromEntries(CATALOG.map((p) => [p.id, p.id !== "bandeja" && p.id !== "aguacate"])),
    },
    soldOut: { centro: {}, norte: { "limonada-coco": true } },
    log: [],
  }));
  const [section, setSection] = useState("Platos");
  const [search, setSearch] = useState("");
  const log = (msg, tone = "info") => update((x) => x.log.push({ msg, tone, id: x.log.length }));
  const sede = SEDES.find((s) => s.id === st.sede);

  const toggle = (kind, p) => {
    update((x) => (x[kind][x.sede][p.id] = !x[kind][x.sede][p.id]));
    const on = st[kind][st.sede][p.id];
    if (kind === "visible") log(`${sede.name}: «${p.name}» ${on ? "se muestra" : "se oculta"} en el menú público`, on ? "ok" : "warn");
    else log(`${sede.name}: «${p.name}» ${on ? "marcado como Agotado" : "disponible de nuevo"}`, on ? "warn" : "ok");
  };

  const shown = CATALOG.filter(
    (p) => p.section === section && st.visible[st.sede][p.id] && p.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const count = (sec) => CATALOG.filter((p) => p.section === sec && st.visible[st.sede][p.id]).length;

  return (
    <div className="h-full overflow-y-auto lg:grid lg:min-h-0 lg:grid-cols-[1fr_400px] lg:overflow-hidden">
      {/* Administración: qué muestra cada sede */}
      <section className="flex flex-col lg:min-h-0">
        <div className="shrink-0 border-b border-line bg-warm/10 px-5 py-2.5 text-xs font-medium text-warm">
          Elige la sede y decide qué productos aparecen en su menú público. La vista previa del celular se actualiza al instante.
        </div>
        <div className="space-y-5 p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {SEDES.map((s) => (
              <button
                key={s.id}
                onClick={() => update((x) => (x.sede = s.id))}
                className={`rounded-2xl border p-3 text-left transition ${st.sede === s.id ? "border-accent bg-accent/10" : "border-line hover:border-accent/60"}`}
              >
                <p className="font-display font-bold">{s.name}</p>
                <p className="text-xs text-muted">{s.address}</p>
                <p className="mt-1 text-[11px] text-accent">{CATALOG.filter((p) => st.visible[s.id][p.id]).length} productos en el menú</p>
              </button>
            ))}
          </div>

          {SECTIONS.map((sec) => (
            <div key={sec}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">{sec}</p>
              <div className="overflow-hidden rounded-xl border border-line">
                {CATALOG.filter((p) => p.section === sec).map((p) => {
                  const on = st.visible[st.sede][p.id];
                  const out = st.soldOut[st.sede][p.id];
                  return (
                    <div key={p.id} className="flex items-center gap-3 border-b border-line/60 px-3 py-2 text-sm last:border-0">
                      <span className={`min-w-0 flex-1 truncate ${on ? "" : "text-muted line-through"}`}>{p.name}</span>
                      <span className="hidden text-xs text-muted sm:inline">{copMenu(p.price)}</span>
                      <button
                        onClick={() => toggle("soldOut", p)}
                        disabled={!on}
                        className={`rounded-full border px-2 py-0.5 text-[10px] transition disabled:opacity-30 ${out ? "border-[#EF4444] text-[#EF4444]" : "border-line text-muted hover:border-[#EF4444]/60"}`}
                      >
                        Agotado
                      </button>
                      <button
                        role="switch"
                        aria-checked={on}
                        aria-label={`Mostrar ${p.name} en ${sede.name}`}
                        onClick={() => toggle("visible", p)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-accent" : "bg-line"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <ExecLog log={st.log} empty="Cambia algo del menú de una sede…" className="h-28" />
      </section>

      {/* Lo que ve el cliente al escanear el QR */}
      <aside className="flex flex-col gap-3 border-t border-line p-4 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
          <FakeQr seed={sede.slug} />
          <div className="min-w-0 text-xs">
            <p className="font-semibold">QR y enlace de {sede.name}</p>
            <p className="truncate font-mono text-[10px] text-muted">contagracia.com/menu/…/{sede.slug}</p>
            <p className="mt-1 text-[10px] text-muted">Cada sede tiene su propio enlace. QR ilustrativo.</p>
          </div>
        </div>

        {/* Celular con el menú público (mismo diseño que en producción) */}
        <div className="mx-auto w-full max-w-[330px] rounded-[2rem] border-[6px] border-[#1f2328] bg-[#f6f7f9] shadow-2xl">
          <div className="overflow-hidden rounded-[1.6rem] text-[#111827]">
            <div className="flex items-start justify-between gap-2 border-b border-black/10 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{sede.name}</p>
                <p className="truncate text-[10px] text-gray-500">📍 {sede.address}</p>
              </div>
            </div>
            <div className="flex gap-1.5 bg-white px-3 pb-2.5">
              {SECTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSection(sec)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${section === sec ? "bg-[#F97316] text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {sec}
                </button>
              ))}
            </div>
            <div className="h-[340px] overflow-y-auto px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold">{section}</p>
                <span className="rounded-full bg-gray-200 px-1.5 text-[10px] text-gray-500">{count(section)}</span>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar…"
                className="mb-3 w-full rounded-full border border-[#F97316] bg-white px-3 py-1.5 text-[11px] text-gray-800 outline-none"
              />
              {shown.length === 0 ? (
                <p className="pt-8 text-center text-[11px] text-gray-400">No hay productos en esta sección.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {shown.map((p) => {
                    const out = st.soldOut[st.sede][p.id];
                    return (
                      <div key={p.id} className={`animate-pop overflow-hidden rounded-xl border border-black/10 bg-white ${out ? "opacity-60" : ""}`}>
                        <div className="relative grid h-14 place-items-center bg-gray-100 text-lg">
                          🍽️
                          {out && <span className="absolute right-1 top-1 rounded-full bg-[#EF4444] px-1.5 text-[8px] font-bold text-white">Agotado</span>}
                        </div>
                        <div className="p-2">
                          <p className="truncate text-[11px] font-semibold">{p.name}</p>
                          <p className="line-clamp-2 text-[9px] text-gray-500">{p.desc}</p>
                          <p className="mt-1 text-[11px] font-bold text-[#F97316]">{copMenu(p.price)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <ProdLink
          href={MENU_URL}
          title="Menú público de una sede"
          description="Menú de una sede de prueba en el producto real, en el que trabajé: así se ve el enlace público por QR."
        />
      </aside>
    </div>
  );
}

// QR decorativo (no escaneable): patrones de esquina + módulos pseudoaleatorios según la sede
function FakeQr({ seed }) {
  const n = 21;
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => (h = (h * 1103515245 + 12345) >>> 0) / 2 ** 32;
  const finder = (r, c) => {
    for (const [r0, c0] of [
      [0, 0],
      [0, n - 7],
      [n - 7, 0],
    ]) {
      if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
        const rr = r - r0;
        const cc = c - c0;
        return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cells = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const f = finder(r, c);
      if (f === 1 || (f === -1 && rand() > 0.55)) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
    }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-16 w-16 shrink-0 rounded-md bg-white p-0.5" fill="#111827" aria-hidden="true">
      {cells}
    </svg>
  );
}

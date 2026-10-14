import { promises as fs } from "fs";
import path from "path";

// Registro de visitas en un archivo JSONL (una línea por evento), sin base de datos.
// STATS_DIR debe quedar fuera de la carpeta del build para que no se borre al desplegar.
const DIR = process.env.STATS_DIR || path.join(process.cwd(), ".stats");
const FILE = path.join(DIR, "events.jsonl");

export const EVENT_TYPES = ["visit", "simulator", "tour", "cv", "contact"];

export async function appendEvent(event) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.appendFile(FILE, JSON.stringify(event) + "\n", "utf8");
}

export async function readEvents() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

// Fecha local de Colombia (YYYY-MM-DD) para agrupar por día
export const dayOf = (ts) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

/**
 * Ingesta de la base de numeración geográfica publicada por Enacom.
 *
 * Uso:
 *   npm run ingest                 # toma el .xls más reciente de data/raw/
 *   npm run ingest -- archivo.xls  # procesa un archivo puntual
 *
 * Lee el Excel, normaliza los textos, valida cada fila contra el Plan
 * Fundamental de Numeración y sobrescribe src/data/generated/dataset.json.
 * Ver docs/03-actualizar-la-base.md.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import * as XLSX from "xlsx";

import {
  NATIONAL_NUMBER_LENGTH,
  RESERVED_SUBSCRIBER_PREFIXES,
} from "../src/lib/numbering/constants";
import { isReservedBlock, isValidAreaCode } from "../src/lib/numbering/capacity";
import type {
  AllocationRow,
  Dataset,
  IngestWarning,
} from "../src/lib/dataset/types";

const ROOT = resolve(import.meta.dirname, "..");
const RAW_DIR = join(ROOT, "data", "raw");
const OUT_DIR = join(ROOT, "src", "data", "generated");
const OUT_FILE = join(OUT_DIR, "dataset.json");
const SOURCES_FILE = join(RAW_DIR, "sources.json");

/** Columnas esperadas en la hoja de Enacom. */
type SheetRow = {
  OPERADOR?: unknown;
  SERVICIO?: unknown;
  MODALIDAD?: unknown;
  LOCALIDAD?: unknown;
  INDICATIVO?: unknown;
  BLOQUE?: unknown;
  RESOLUCION?: unknown;
  FECHA?: unknown;
};

/** Colapsa espacios repetidos y recorta: los textos de Enacom vienen sucios. */
function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Normaliza la columna SERVICIO: mayúsculas y sin espacios alrededor de las barras. */
function cleanService(value: unknown): string {
  return clean(value).toUpperCase().replace(/\s*\/\s*/g, "/");
}

/** Unifica las variantes de MODALIDAD que aparecen en la base ("BASICO" por "BASICA"). */
function cleanModality(value: unknown): string {
  const text = clean(value).toUpperCase();
  if (text === "BASICO") return "BASICA";
  return text || "SIN DATO";
}

/** Convierte el serial de fecha de Excel a días desde 1970-01-01 (UTC). */
function excelSerialToDay(serial: number): number | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  // El día 25569 del calendario de Excel (base 1900) equivale al 1970-01-01.
  return Math.round(serial) - 25569;
}

function dayToIso(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** Interna un texto en su diccionario y devuelve el índice correspondiente. */
function intern(dictionary: string[], index: Map<string, number>, value: string): number {
  const existing = index.get(value);
  if (existing !== undefined) return existing;
  const next = dictionary.length;
  dictionary.push(value);
  index.set(value, next);
  return next;
}

/** Elige el archivo a procesar: el pasado por argumento o el último de data/raw/. */
function resolveSourceFile(): string {
  const arg = process.argv[2];
  if (arg) {
    const path = resolve(arg);
    if (!existsSync(path)) throw new Error(`No existe el archivo: ${path}`);
    return path;
  }
  if (!existsSync(RAW_DIR)) {
    throw new Error(`No existe data/raw/. Copiá ahí el Excel de Enacom.`);
  }
  const candidates = readdirSync(RAW_DIR)
    .filter((name) => /\.xlsx?$/i.test(name))
    .sort();
  if (candidates.length === 0) {
    throw new Error("No hay ningún .xls o .xlsx en data/raw/.");
  }
  return join(RAW_DIR, candidates[candidates.length - 1]);
}

/** Lee data/raw/sources.json para recuperar la URL de origen del archivo. */
function lookupSourceUrl(fileName: string): string | null {
  if (!existsSync(SOURCES_FILE)) return null;
  const sources = JSON.parse(readFileSync(SOURCES_FILE, "utf8")) as Record<string, string>;
  return sources[fileName] ?? null;
}

function main(): void {
  const sourcePath = resolveSourceFile();
  const fileName = basename(sourcePath);
  const buffer = readFileSync(sourcePath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  console.log(`Procesando ${fileName} (${(buffer.length / 1e6).toFixed(1)} MB)`);

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<SheetRow>(workbook.Sheets[sheetName], {
    raw: true,
    defval: null,
  });

  const operators: string[] = [];
  const localities: string[] = [];
  const services: string[] = [];
  const modalities: string[] = [];
  const resolutions: string[] = [];
  const operatorIndex = new Map<string, number>();
  const localityIndex = new Map<string, number>();
  const serviceIndex = new Map<string, number>();
  const modalityIndex = new Map<string, number>();
  const resolutionIndex = new Map<string, number>();

  const allocations: AllocationRow[] = [];
  const warnings: IngestWarning[] = [];
  /** Bloques ya vistos por indicativo, para detectar duplicados y solapamientos. */
  const seenBlocks = new Map<string, Set<string>>();

  rows.forEach((row, i) => {
    // +2 porque el encabezado es la fila 1 y el índice arranca en 0.
    const rowNumber = i + 2;

    const areaCode = clean(row.INDICATIVO);
    const block = clean(row.BLOQUE);

    if (!isValidAreaCode(areaCode)) {
      warnings.push({
        row: rowNumber,
        kind: "indicativo-invalido",
        detail: `Indicativo «${areaCode}» fuera de las longitudes 2, 3 o 4.`,
      });
      return;
    }
    if (!/^[2-9]\d*$/.test(block)) {
      warnings.push({
        row: rowNumber,
        kind: "bloque-invalido",
        detail: `Bloque «${block}»: debe ser numérico y no puede empezar con 0 ni 1.`,
      });
      return;
    }
    if (isReservedBlock(block)) {
      warnings.push({
        row: rowNumber,
        kind: "bloque-reservado",
        detail: `El bloque ${block} invade el prefijo reservado ${RESERVED_SUBSCRIBER_PREFIXES.join(", ")}: ningún número local puede empezar así.`,
      });
      return;
    }
    if (areaCode.length + block.length > NATIONAL_NUMBER_LENGTH) {
      warnings.push({
        row: rowNumber,
        kind: "longitud-excedida",
        detail: `Indicativo ${areaCode} + bloque ${block} superan los ${NATIONAL_NUMBER_LENGTH} dígitos.`,
      });
      return;
    }

    const blocksForArea = seenBlocks.get(areaCode) ?? new Set<string>();
    if (blocksForArea.has(block)) {
      warnings.push({
        row: rowNumber,
        kind: "bloque-duplicado",
        detail: `El bloque ${block} del indicativo ${areaCode} aparece más de una vez.`,
      });
      return;
    }
    // Un bloque no puede ser prefijo de otro ya asignado dentro del mismo indicativo.
    for (let length = 1; length < block.length; length++) {
      if (blocksForArea.has(block.slice(0, length))) {
        warnings.push({
          row: rowNumber,
          kind: "bloque-solapado",
          detail: `El bloque ${block} se solapa con ${block.slice(0, length)} en el indicativo ${areaCode}.`,
        });
      }
    }
    blocksForArea.add(block);
    seenBlocks.set(areaCode, blocksForArea);

    const day = typeof row.FECHA === "number" ? excelSerialToDay(row.FECHA) : null;
    if (day === null) {
      warnings.push({
        row: rowNumber,
        kind: "fecha-invalida",
        detail: `Fecha «${String(row.FECHA)}» no interpretable; la fila se carga sin fecha.`,
      });
    }
    if (!clean(row.MODALIDAD)) {
      warnings.push({
        row: rowNumber,
        kind: "modalidad-vacia",
        detail: `Fila sin modalidad; se carga como «SIN DATO».`,
      });
    }

    allocations.push([
      areaCode,
      block,
      intern(operators, operatorIndex, clean(row.OPERADOR) || "SIN DATO"),
      intern(localities, localityIndex, clean(row.LOCALIDAD) || "SIN DATO"),
      intern(services, serviceIndex, cleanService(row.SERVICIO) || "SIN DATO"),
      intern(modalities, modalityIndex, cleanModality(row.MODALIDAD)),
      intern(resolutions, resolutionIndex, clean(row.RESOLUCION) || "SIN DATO"),
      day ?? 0,
    ]);
  });

  const days = allocations.map((a) => a[7]).filter((d) => d > 0);
  const dataset: Dataset = {
    meta: {
      generatedAt: new Date().toISOString(),
      sourceFile: fileName,
      sourceSha256: sha256,
      sourceSheet: sheetName,
      sourceUrl: lookupSourceUrl(fileName),
      rowCount: allocations.length,
      latestResolutionDate: days.length ? dayToIso(Math.max(...days)) : "",
      warnings,
    },
    operators,
    localities,
    services,
    modalities,
    resolutions,
    allocations,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(dataset), "utf8");

  const areaCount = seenBlocks.size;
  console.log(`  Asignaciones: ${allocations.length.toLocaleString("es-AR")}`);
  console.log(`  Indicativos:  ${areaCount}`);
  console.log(`  Operadores:   ${operators.length}`);
  console.log(`  Localidades:  ${localities.length}`);
  console.log(`  Última resolución: ${dataset.meta.latestResolutionDate}`);
  console.log(`  Avisos: ${warnings.length}`);
  for (const warning of warnings.slice(0, 10)) {
    console.log(`    fila ${warning.row} [${warning.kind}] ${warning.detail}`);
  }
  if (warnings.length > 10) console.log(`    ... y ${warnings.length - 10} más`);
  console.log(`Escrito ${OUT_FILE}`);
}

main();

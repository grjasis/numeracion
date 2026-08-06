import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import type { Dataset } from "./types";

/**
 * Carga del dataset generado por `npm run ingest`.
 *
 * Se lee del disco una sola vez por proceso. Como todas las páginas se
 * renderizan del lado del servidor, el JSON nunca viaja al navegador: al
 * cliente solo llegan los datos ya agregados de cada vista.
 */

const DATASET_PATH = join(process.cwd(), "src", "data", "generated", "dataset.json");

export const loadDataset = cache((): Dataset => {
  try {
    return JSON.parse(readFileSync(DATASET_PATH, "utf8")) as Dataset;
  } catch {
    throw new Error(
      "No se encontró src/data/generated/dataset.json. Corré `npm run ingest` antes de compilar.",
    );
  }
});

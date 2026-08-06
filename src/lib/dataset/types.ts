/**
 * Estructura del dataset generado por `npm run ingest`.
 *
 * Se guarda en formato columnar con diccionarios: los textos repetidos
 * (operador, localidad, servicio, modalidad, resolución) se almacenan una
 * sola vez y las filas guardan índices. Con esto las ~49.000 asignaciones
 * entran en pocos megabytes y se leen de una sola vez en el servidor.
 */

/** Índice de cada campo dentro de una fila de `allocations`. */
export const FIELD = {
  areaCode: 0,
  block: 1,
  operator: 2,
  locality: 3,
  service: 4,
  modality: 5,
  resolution: 6,
  /** Días transcurridos desde 1970-01-01 (UTC). */
  day: 7,
} as const;

/** Fila cruda del dataset: [indicativo, bloque, ...índices de diccionario, día]. */
export type AllocationRow = [
  areaCode: string,
  block: string,
  operator: number,
  locality: number,
  service: number,
  modality: number,
  resolution: number,
  day: number,
];

/** Asignación ya resuelta contra los diccionarios, lista para mostrar. */
export type Allocation = {
  /** Indicativo interurbano (código de área). */
  areaCode: string;
  /** Bloque asignado: prefijo del número de abonado. */
  block: string;
  operator: string;
  locality: string;
  service: string;
  modality: string;
  resolution: string;
  /** Fecha de la resolución en formato ISO (YYYY-MM-DD). */
  date: string;
  /** Cantidad de números que contiene el bloque. */
  capacity: number;
};

/** Aviso emitido durante la ingesta sobre una fila que no cumple el PFNN. */
export type IngestWarning = {
  /** Fila del Excel, contando el encabezado como fila 1. */
  row: number;
  kind:
    | "indicativo-invalido"
    | "bloque-invalido"
    | "bloque-reservado"
    | "longitud-excedida"
    | "bloque-duplicado"
    | "bloque-solapado"
    | "modalidad-vacia"
    | "fecha-invalida";
  detail: string;
};

/** Metadatos de la publicación de Enacom que originó el dataset. */
export type DatasetMeta = {
  /** Momento en que se corrió la ingesta (ISO). */
  generatedAt: string;
  /** Nombre del archivo original dentro de data/raw/. */
  sourceFile: string;
  /** SHA-256 del archivo original, para detectar si cambió la publicación. */
  sourceSha256: string;
  /** Nombre de la hoja procesada dentro del Excel. */
  sourceSheet: string;
  /** URL de descarga de la publicación, si se conoce. */
  sourceUrl: string | null;
  /** Cantidad de asignaciones válidas cargadas. */
  rowCount: number;
  /** Fecha de la resolución más reciente del dataset (ISO). */
  latestResolutionDate: string;
  warnings: IngestWarning[];
};

export type Dataset = {
  meta: DatasetMeta;
  operators: string[];
  localities: string[];
  services: string[];
  modalities: string[];
  resolutions: string[];
  allocations: AllocationRow[];
};

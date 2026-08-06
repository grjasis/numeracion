import "server-only";

import { cache } from "react";

import {
  areaCodeRegion,
  blockCapacity,
  blockRange,
  isReservedBlock,
  subscriberLength,
} from "@/lib/numbering/capacity";
import { parsePhoneNumber, type ParsedNumber, type ParseFailure } from "@/lib/numbering/parse";
import {
  childAreaCodes,
  parentAreaCode,
  summarizeAreaSpace,
} from "@/lib/numbering/area-space";
import { computeAreaSpace, type AreaSpace } from "@/lib/numbering/free-space";
import { MOBILE_SERVICES } from "@/lib/numbering/constants";
import { loadDataset } from "./load";
import { FIELD, type Allocation, type AllocationRow, type Dataset } from "./types";

/**
 * Consultas sobre el dataset. Todo se calcula en memoria sobre las ~49.000
 * asignaciones: alcanza de sobra y evita depender de una base de datos.
 * Los resultados se memorizan por request con `cache` de React.
 */

/** Convierte un nombre en un slug apto para URL. */
export function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dayToIso(day: number): string {
  return day > 0 ? new Date(day * 86_400_000).toISOString().slice(0, 10) : "";
}

/** Resuelve una fila cruda contra los diccionarios del dataset. */
function hydrate(dataset: Dataset, row: AllocationRow): Allocation {
  return {
    areaCode: row[FIELD.areaCode],
    block: row[FIELD.block],
    operator: dataset.operators[row[FIELD.operator]],
    locality: dataset.localities[row[FIELD.locality]],
    service: dataset.services[row[FIELD.service]],
    modality: dataset.modalities[row[FIELD.modality]],
    resolution: dataset.resolutions[row[FIELD.resolution]],
    date: dayToIso(row[FIELD.day]),
    capacity: blockCapacity(row[FIELD.areaCode], row[FIELD.block]),
  };
}

/** Determina si un servicio corresponde a numeración móvil. */
function isMobileService(service: string): boolean {
  return service
    .split("/")
    .some((part) => (MOBILE_SERVICES as readonly string[]).includes(part.trim()));
}

export type NationalSummary = {
  meta: Dataset["meta"];
  allocationCount: number;
  assignedNumbers: number;
  totalCapacity: number;
  /** Proporción del espacio de los indicativos en uso que ya está asignada. */
  occupancy: number;
  areaCodeCount: number;
  operatorCount: number;
  localityCount: number;
  mobileNumbers: number;
  fixedNumbers: number;
  areaSpace: ReturnType<typeof summarizeAreaSpace>;
};

/** Panorama nacional: totales de asignaciones, capacidad y ocupación. */
export const getNationalSummary = cache((): NationalSummary => {
  const dataset = loadDataset();
  const areaCodes = new Set<string>();
  let assignedNumbers = 0;
  let mobileNumbers = 0;

  for (const row of dataset.allocations) {
    const areaCode = row[FIELD.areaCode];
    areaCodes.add(areaCode);
    const capacity = blockCapacity(areaCode, row[FIELD.block]);
    assignedNumbers += capacity;
    if (isMobileService(dataset.services[row[FIELD.service]])) mobileNumbers += capacity;
  }

  // La capacidad nacional suma la capacidad ya ajustada de cada indicativo, para
  // no contar dos veces el espacio que comparten los indicativos anidados.
  const totalCapacity = getAreaCodes().reduce((sum, area) => sum + area.capacity, 0);

  return {
    meta: dataset.meta,
    allocationCount: dataset.allocations.length,
    assignedNumbers,
    totalCapacity,
    occupancy: totalCapacity ? assignedNumbers / totalCapacity : 0,
    areaCodeCount: areaCodes.size,
    operatorCount: dataset.operators.length,
    localityCount: dataset.localities.length,
    mobileNumbers,
    fixedNumbers: assignedNumbers - mobileNumbers,
    areaSpace: summarizeAreaSpace(areaCodes),
  };
});

export type AreaCodeStats = {
  areaCode: string;
  locality: string;
  region: string;
  /** Cantidad de dígitos del número de abonado en este indicativo. */
  subscriberDigits: number;
  allocationCount: number;
  assignedNumbers: number;
  /** Números que este indicativo puede llegar a asignar, ya descontado lo cedido. */
  capacity: number;
  occupancy: number;
  /** Números que se lleva otro indicativo que abre dentro de este. */
  cededNumbers: number;
  /** Indicativos más largos que abren dentro de este. */
  childAreaCodes: string[];
  /** Indicativo más corto dentro del cual abre este, si existe. */
  parentAreaCode: string | null;
  operatorCount: number;
  /** Fecha de la asignación más reciente (ISO). */
  lastAssignedAt: string;
};

/** Métricas por indicativo interurbano, ordenadas por cantidad de números asignados. */
export const getAreaCodes = cache((): AreaCodeStats[] => {
  const dataset = loadDataset();
  const byCode = new Map<
    string,
    {
      locality: string;
      allocationCount: number;
      assignedNumbers: number;
      blocks: string[];
      operators: Set<number>;
      lastDay: number;
    }
  >();

  for (const row of dataset.allocations) {
    const areaCode = row[FIELD.areaCode];
    const entry = byCode.get(areaCode) ?? {
      locality: dataset.localities[row[FIELD.locality]],
      allocationCount: 0,
      assignedNumbers: 0,
      blocks: [] as string[],
      operators: new Set<number>(),
      lastDay: 0,
    };
    entry.allocationCount += 1;
    entry.assignedNumbers += blockCapacity(areaCode, row[FIELD.block]);
    entry.blocks.push(row[FIELD.block]);
    entry.operators.add(row[FIELD.operator]);
    entry.lastDay = Math.max(entry.lastDay, row[FIELD.day]);
    byCode.set(areaCode, entry);
  }

  const allCodes = [...byCode.keys()];

  return [...byCode.entries()]
    .map(([areaCode, entry]) => {
      const space = computeAreaSpace(
        areaCode,
        entry.blocks,
        childAreaCodes(areaCode, allCodes),
      );
      return {
        areaCode,
        locality: entry.locality,
        region: areaCodeRegion(areaCode),
        subscriberDigits: subscriberLength(areaCode),
        allocationCount: entry.allocationCount,
        assignedNumbers: space.assigned,
        capacity: space.usableCapacity,
        occupancy: space.occupancy,
        cededNumbers: space.cededRanges.reduce((sum, range) => sum + range.size, 0),
        childAreaCodes: childAreaCodes(areaCode, allCodes),
        parentAreaCode: parentAreaCode(areaCode, new Set(allCodes)),
        operatorCount: entry.operators.size,
        lastAssignedAt: dayToIso(entry.lastDay),
      };
    })
    .sort((a, b) => b.assignedNumbers - a.assignedNumbers);
});

export type AreaCodeDetail = AreaCodeStats & {
  allocations: Allocation[];
  operators: OperatorStats[];
  space: AreaSpace;
  /** Localidad de cada indicativo emparentado, para nombrarlos en los avisos. */
  relatedLocalities: Record<string, string>;
  timeline: TimelinePoint[];
};

/** Detalle completo de un indicativo: asignaciones, operadores, espacio libre y evolución. */
export const getAreaCodeDetail = cache((areaCode: string): AreaCodeDetail | null => {
  const dataset = loadDataset();
  const rows = dataset.allocations.filter((row) => row[FIELD.areaCode] === areaCode);
  if (rows.length === 0) return null;

  const stats = getAreaCodes().find((a) => a.areaCode === areaCode);
  if (!stats) return null;

  const allocations = rows
    .map((row) => hydrate(dataset, row))
    .sort((a, b) => b.date.localeCompare(a.date) || a.block.localeCompare(b.block));

  const related = [...stats.childAreaCodes];
  if (stats.parentAreaCode) related.push(stats.parentAreaCode);
  const relatedLocalities = Object.fromEntries(
    related.map((code) => [
      code,
      getAreaCodes().find((a) => a.areaCode === code)?.locality ?? "",
    ]),
  );

  return {
    ...stats,
    allocations,
    operators: aggregateOperators(dataset, rows),
    space: computeAreaSpace(
      areaCode,
      rows.map((row) => row[FIELD.block]),
      stats.childAreaCodes,
    ),
    relatedLocalities,
    timeline: buildTimeline(rows),
  };
});

export type OperatorStats = {
  name: string;
  slug: string;
  allocationCount: number;
  assignedNumbers: number;
  areaCodeCount: number;
  localityCount: number;
  /** Proporción de los números asignados del país que concentra este operador. */
  share: number;
  lastAssignedAt: string;
};

/** Agrega métricas por operador sobre un subconjunto de filas. */
function aggregateOperators(dataset: Dataset, rows: AllocationRow[]): OperatorStats[] {
  const byOperator = new Map<
    number,
    {
      allocationCount: number;
      assignedNumbers: number;
      areaCodes: Set<string>;
      localities: Set<number>;
      lastDay: number;
    }
  >();
  let total = 0;

  for (const row of rows) {
    const capacity = blockCapacity(row[FIELD.areaCode], row[FIELD.block]);
    total += capacity;
    const key = row[FIELD.operator];
    const entry = byOperator.get(key) ?? {
      allocationCount: 0,
      assignedNumbers: 0,
      areaCodes: new Set<string>(),
      localities: new Set<number>(),
      lastDay: 0,
    };
    entry.allocationCount += 1;
    entry.assignedNumbers += capacity;
    entry.areaCodes.add(row[FIELD.areaCode]);
    entry.localities.add(row[FIELD.locality]);
    entry.lastDay = Math.max(entry.lastDay, row[FIELD.day]);
    byOperator.set(key, entry);
  }

  return [...byOperator.entries()]
    .map(([index, entry]) => ({
      name: dataset.operators[index],
      slug: toSlug(dataset.operators[index]),
      allocationCount: entry.allocationCount,
      assignedNumbers: entry.assignedNumbers,
      areaCodeCount: entry.areaCodes.size,
      localityCount: entry.localities.size,
      share: total ? entry.assignedNumbers / total : 0,
      lastAssignedAt: dayToIso(entry.lastDay),
    }))
    .sort((a, b) => b.assignedNumbers - a.assignedNumbers);
}

/** Ranking nacional de operadores por cantidad de números asignados. */
export const getOperators = cache((): OperatorStats[] => {
  const dataset = loadDataset();
  return aggregateOperators(dataset, dataset.allocations);
});

export type OperatorDetail = OperatorStats & {
  allocations: Allocation[];
  byAreaCode: Array<{
    areaCode: string;
    locality: string;
    allocationCount: number;
    assignedNumbers: number;
  }>;
  timeline: TimelinePoint[];
};

/** Detalle de un operador identificado por su slug. */
export const getOperatorDetail = cache((slug: string): OperatorDetail | null => {
  const dataset = loadDataset();
  const index = dataset.operators.findIndex((name) => toSlug(name) === slug);
  if (index === -1) return null;

  const rows = dataset.allocations.filter((row) => row[FIELD.operator] === index);
  const stats = getOperators().find((o) => o.slug === slug);
  if (!stats || rows.length === 0) return null;

  const byAreaCode = new Map<
    string,
    { areaCode: string; locality: string; allocationCount: number; assignedNumbers: number }
  >();
  for (const row of rows) {
    const areaCode = row[FIELD.areaCode];
    const entry = byAreaCode.get(areaCode) ?? {
      areaCode,
      locality: dataset.localities[row[FIELD.locality]],
      allocationCount: 0,
      assignedNumbers: 0,
    };
    entry.allocationCount += 1;
    entry.assignedNumbers += blockCapacity(areaCode, row[FIELD.block]);
    byAreaCode.set(areaCode, entry);
  }

  return {
    ...stats,
    allocations: rows
      .map((row) => hydrate(dataset, row))
      .sort((a, b) => b.date.localeCompare(a.date)),
    byAreaCode: [...byAreaCode.values()].sort(
      (a, b) => b.assignedNumbers - a.assignedNumbers,
    ),
    timeline: buildTimeline(rows),
  };
});

export type TimelinePoint = {
  /** Año calendario de la resolución. */
  year: number;
  allocationCount: number;
  assignedNumbers: number;
  /** Números asignados acumulados hasta ese año inclusive. */
  cumulativeNumbers: number;
  cumulativeAllocations: number;
};

/**
 * Serie anual de asignaciones a partir de la fecha de cada resolución.
 *
 * La serie es continua: incluye todos los años desde el primero con datos hasta
 * el año en curso, aunque en el medio haya años sin ninguna asignación. Saltear
 * esos años deformaría la lectura, porque un tramo sin actividad es información
 * y el acumulado tiene que sostenerse en meseta en vez de desaparecer del eje.
 *
 * El año de cierre se toma al generar la página; en las rutas estáticas queda
 * fijado en el momento del build y se actualiza en el despliegue siguiente.
 */
function buildTimeline(rows: AllocationRow[]): TimelinePoint[] {
  const byYear = new Map<number, { allocationCount: number; assignedNumbers: number }>();

  for (const row of rows) {
    const day = row[FIELD.day];
    if (day <= 0) continue;
    const year = new Date(day * 86_400_000).getUTCFullYear();
    const entry = byYear.get(year) ?? { allocationCount: 0, assignedNumbers: 0 };
    entry.allocationCount += 1;
    entry.assignedNumbers += blockCapacity(row[FIELD.areaCode], row[FIELD.block]);
    byYear.set(year, entry);
  }

  if (byYear.size === 0) return [];

  const years = [...byYear.keys()];
  const firstYear = Math.min(...years);
  // Si el dataset tuviera una resolución futura, se respeta como cierre de la serie.
  const lastYear = Math.max(new Date().getUTCFullYear(), ...years);

  let cumulativeNumbers = 0;
  let cumulativeAllocations = 0;
  const points: TimelinePoint[] = [];

  for (let year = firstYear; year <= lastYear; year++) {
    const entry = byYear.get(year) ?? { allocationCount: 0, assignedNumbers: 0 };
    cumulativeNumbers += entry.assignedNumbers;
    cumulativeAllocations += entry.allocationCount;
    points.push({ year, ...entry, cumulativeNumbers, cumulativeAllocations });
  }

  return points;
}

/** Serie anual de asignaciones para todo el país. */
export const getNationalTimeline = cache((): TimelinePoint[] =>
  buildTimeline(loadDataset().allocations),
);

export type AllocationFilters = {
  areaCode?: string;
  operator?: string;
  locality?: string;
  service?: string;
  modality?: string;
  /** Búsqueda libre sobre operador, localidad, bloque y resolución. */
  query?: string;
};

export type AllocationPage = {
  items: Allocation[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Busca asignaciones con filtros y paginación. */
export const searchAllocations = cache(
  (filters: AllocationFilters, page = 1, pageSize = 50): AllocationPage => {
    const dataset = loadDataset();
    const query = filters.query?.trim().toLowerCase();

    const matches = dataset.allocations.filter((row) => {
      if (filters.areaCode && row[FIELD.areaCode] !== filters.areaCode) return false;
      if (filters.operator && dataset.operators[row[FIELD.operator]] !== filters.operator)
        return false;
      if (filters.locality && dataset.localities[row[FIELD.locality]] !== filters.locality)
        return false;
      if (filters.service && dataset.services[row[FIELD.service]] !== filters.service)
        return false;
      if (filters.modality && dataset.modalities[row[FIELD.modality]] !== filters.modality)
        return false;
      if (query) {
        const haystack = [
          row[FIELD.areaCode],
          row[FIELD.block],
          dataset.operators[row[FIELD.operator]],
          dataset.localities[row[FIELD.locality]],
          dataset.resolutions[row[FIELD.resolution]],
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    matches.sort((a, b) => b[FIELD.day] - a[FIELD.day]);

    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    const current = Math.min(Math.max(1, page), pageCount);
    const start = (current - 1) * pageSize;

    return {
      items: matches.slice(start, start + pageSize).map((row) => hydrate(dataset, row)),
      total: matches.length,
      page: current,
      pageSize,
      pageCount,
    };
  },
);

/** Valores disponibles para poblar los filtros de la tabla de asignaciones. */
export const getFilterOptions = cache(() => {
  const dataset = loadDataset();
  return {
    services: [...dataset.services].sort(),
    modalities: [...dataset.modalities].sort(),
    areaCodes: getAreaCodes()
      .map((a) => ({ areaCode: a.areaCode, locality: a.locality }))
      .sort((a, b) => a.areaCode.localeCompare(b.areaCode)),
  };
});

/** Índice indicativo → bloque → fila, para resolver a qué bloque pertenece un número. */
const getBlockIndex = cache((): Map<string, Map<string, AllocationRow>> => {
  const dataset = loadDataset();
  const index = new Map<string, Map<string, AllocationRow>>();

  for (const row of dataset.allocations) {
    const areaCode = row[FIELD.areaCode];
    const blocks = index.get(areaCode) ?? new Map<string, AllocationRow>();
    blocks.set(row[FIELD.block], row);
    index.set(areaCode, blocks);
  }

  return index;
});

/** Indicativos presentes en la base, para reconocerlos al interpretar un número. */
export const getKnownAreaCodes = cache(
  (): Set<string> => new Set(getBlockIndex().keys()),
);

export type NumberMatch = ParsedNumber & {
  /** Localidad cabecera del indicativo. */
  locality: string;
  /** Asignación que cubre el número, si el bloque está asignado. */
  allocation: Allocation | null;
  /** Rango completo del bloque, para mostrar qué otros números abarca. */
  blockRange: { first: string; last: string } | null;
  /** Motivo por el que no hay asignación, cuando corresponde. */
  unassignedReason: "reservado" | "sin-asignar" | null;
};

export type NumberLookup =
  | { ok: true; digits: string; matches: NumberMatch[] }
  | { ok: false; digits: string; reason: ParseFailure };

/**
 * Resuelve a qué bloque asignado pertenece un número telefónico.
 *
 * Como los bloques de un indicativo nunca se solapan, alcanza con probar los
 * prefijos del número de abonado de mayor a menor: el primero que exista en el
 * índice es el bloque que lo contiene, y es el único posible.
 */
export const lookupNumber = cache((input: string): NumberLookup => {
  const parsed = parsePhoneNumber(input, getKnownAreaCodes());
  if (!parsed.ok) return { ok: false, digits: parsed.digits, reason: parsed.reason };

  const dataset = loadDataset();
  const index = getBlockIndex();

  const matches = parsed.candidates.map((candidate): NumberMatch => {
    const blocks = index.get(candidate.areaCode);
    let row: AllocationRow | undefined;

    // El bloque más largo que coincida es el que contiene al número.
    for (let length = candidate.subscriberNumber.length; length >= 1; length--) {
      const found = blocks?.get(candidate.subscriberNumber.slice(0, length));
      if (found) {
        row = found;
        break;
      }
    }

    const areaStats = getAreaCodes().find((a) => a.areaCode === candidate.areaCode);

    if (!row) {
      return {
        ...candidate,
        locality: areaStats?.locality ?? "",
        allocation: null,
        blockRange: null,
        unassignedReason: isReservedBlock(candidate.subscriberNumber.slice(0, 3))
          ? "reservado"
          : "sin-asignar",
      };
    }

    return {
      ...candidate,
      locality: dataset.localities[row[FIELD.locality]],
      allocation: hydrate(dataset, row),
      blockRange: blockRange(candidate.areaCode, row[FIELD.block]),
      unassignedReason: null,
    };
  });

  return { ok: true, digits: parsed.digits, matches };
});

export type NestedAreaCode = {
  /** Indicativo corto que es prefijo de otros. */
  parent: string;
  parentLocality: string;
  /** Indicativos más largos que empiezan con el corto. */
  children: Array<{ areaCode: string; locality: string }>;
};

export type Curiosities = {
  /** Indicativos que son prefijo de otro indicativo en uso. */
  nestedAreaCodes: NestedAreaCode[];
  /** Cantidad de indicativos afectados por el anidamiento, cortos y largos. */
  nestedAreaCodeCount: number;
  /** Distribución de los bloques según cuántos números contienen. */
  blockSizes: Array<{ size: number; blocks: number; numbers: number }>;
  /** Cantidad de indicativos por longitud del código. */
  areaCodeLengths: Array<{ length: number; count: number; example: string }>;
  /** Bloques que arrancan con 91, para mostrar que el 911 es el único ausente. */
  blocksNear911: Array<{ block: string; areaCodes: number }>;
  /** Servicios que aparecen en muy pocas asignaciones. */
  rareServices: Array<{ service: string; allocations: number }>;
  /** Operadores con una sola asignación en todo el país. */
  singleAllocationOperators: number;
  /** Indicativos con menos prestadores compitiendo. */
  leastCompetitiveAreas: Array<{
    areaCode: string;
    locality: string;
    operatorCount: number;
  }>;
  /** Indicativo con más operadores distintos. */
  mostCompetitiveArea: { areaCode: string; locality: string; operatorCount: number } | null;
  /** Asignación más antigua y más reciente de la base. */
  oldest: Allocation | null;
  newest: Allocation | null;
  /** Años con más y con menos actividad. */
  busiestYear: TimelinePoint | null;
  quietestYear: TimelinePoint | null;
};

/**
 * Rarezas del dataset que no encajan en ninguna otra vista pero explican cómo
 * funciona la numeración en la práctica. Todo se calcula sobre la base, no hay
 * nada escrito a mano.
 */
export const getCuriosities = cache((): Curiosities => {
  const dataset = loadDataset();
  const areas = getAreaCodes();
  const areaByCode = new Map(areas.map((area) => [area.areaCode, area]));
  const codes = [...areaByCode.keys()];
  const codeSet = new Set(codes);

  // Indicativos anidados: un indicativo corto que es prefijo de otros más largos.
  const nested = new Map<string, NestedAreaCode>();
  for (const code of codes) {
    for (let length = 2; length < code.length; length++) {
      const parent = code.slice(0, length);
      if (!codeSet.has(parent)) continue;
      const entry = nested.get(parent) ?? {
        parent,
        parentLocality: areaByCode.get(parent)?.locality ?? "",
        children: [],
      };
      entry.children.push({
        areaCode: code,
        locality: areaByCode.get(code)?.locality ?? "",
      });
      nested.set(parent, entry);
    }
  }
  const nestedAreaCodes = [...nested.values()]
    .map((entry) => ({
      ...entry,
      children: [...entry.children].sort((a, b) => a.areaCode.localeCompare(b.areaCode)),
    }))
    .sort((a, b) => a.parent.localeCompare(b.parent));

  // Distribución por tamaño de bloque y servicios poco frecuentes.
  const sizes = new Map<number, { blocks: number; numbers: number }>();
  const serviceCounts = new Map<number, number>();
  const operatorCounts = new Map<number, number>();
  const near911 = new Map<string, Set<string>>();

  for (const row of dataset.allocations) {
    const size = blockCapacity(row[FIELD.areaCode], row[FIELD.block]);
    const entry = sizes.get(size) ?? { blocks: 0, numbers: 0 };
    entry.blocks += 1;
    entry.numbers += size;
    sizes.set(size, entry);

    serviceCounts.set(row[FIELD.service], (serviceCounts.get(row[FIELD.service]) ?? 0) + 1);
    operatorCounts.set(row[FIELD.operator], (operatorCounts.get(row[FIELD.operator]) ?? 0) + 1);

    const block = row[FIELD.block];
    if (block.startsWith("91")) {
      const prefix = block.slice(0, 3);
      const areasWithPrefix = near911.get(prefix) ?? new Set<string>();
      areasWithPrefix.add(row[FIELD.areaCode]);
      near911.set(prefix, areasWithPrefix);
    }
  }

  // Extremos de competencia: dónde hay muchos prestadores y dónde apenas un puñado.
  const byCompetition = [...areas].sort((a, b) => b.operatorCount - a.operatorCount);
  const mostCompetitive = byCompetition[0];
  const leastCompetitiveAreas = [...byCompetition]
    .reverse()
    .slice(0, 10)
    .map((area) => ({
      areaCode: area.areaCode,
      locality: area.locality,
      operatorCount: area.operatorCount,
    }));

  const timeline = getNationalTimeline().filter((point) => point.allocationCount > 0);
  const sortedByActivity = [...timeline].sort(
    (a, b) => a.allocationCount - b.allocationCount,
  );

  const byDate = [...dataset.allocations]
    .filter((row) => row[FIELD.day] > 0)
    .sort((a, b) => a[FIELD.day] - b[FIELD.day]);

  return {
    nestedAreaCodes,
    nestedAreaCodeCount:
      nestedAreaCodes.length +
      nestedAreaCodes.reduce((total, entry) => total + entry.children.length, 0),
    blockSizes: [...sizes.entries()]
      .map(([size, entry]) => ({ size, ...entry }))
      .sort((a, b) => b.size - a.size),
    areaCodeLengths: [2, 3, 4].map((length) => {
      const matching = codes.filter((code) => code.length === length).sort();
      return { length, count: matching.length, example: matching[0] ?? "" };
    }),
    blocksNear911: [...near911.entries()]
      .map(([block, areaCodes]) => ({ block, areaCodes: areaCodes.size }))
      .sort((a, b) => a.block.localeCompare(b.block)),
    rareServices: [...serviceCounts.entries()]
      .map(([index, allocations]) => ({
        service: dataset.services[index],
        allocations,
      }))
      .filter((entry) => entry.allocations <= 30)
      .sort((a, b) => a.allocations - b.allocations),
    singleAllocationOperators: [...operatorCounts.values()].filter((count) => count === 1)
      .length,
    leastCompetitiveAreas,
    mostCompetitiveArea: mostCompetitive
      ? {
          areaCode: mostCompetitive.areaCode,
          locality: mostCompetitive.locality,
          operatorCount: mostCompetitive.operatorCount,
        }
      : null,
    oldest: byDate.length ? hydrate(dataset, byDate[0]) : null,
    newest: byDate.length ? hydrate(dataset, byDate[byDate.length - 1]) : null,
    busiestYear: sortedByActivity[sortedByActivity.length - 1] ?? null,
    quietestYear: sortedByActivity[0] ?? null,
  };
});

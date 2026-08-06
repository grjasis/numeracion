import "server-only";

import { cache } from "react";

import {
  areaCodeCapacity,
  areaCodeRegion,
  blockCapacity,
  subscriberLength,
} from "@/lib/numbering/capacity";
import { summarizeAreaSpace } from "@/lib/numbering/area-space";
import {
  freeRanges,
  occupancyByFirstDigit,
  reservedRanges,
} from "@/lib/numbering/free-space";
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

  let totalCapacity = 0;
  for (const code of areaCodes) totalCapacity += areaCodeCapacity(code);

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
  capacity: number;
  occupancy: number;
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
      operators: new Set<number>(),
      lastDay: 0,
    };
    entry.allocationCount += 1;
    entry.assignedNumbers += blockCapacity(areaCode, row[FIELD.block]);
    entry.operators.add(row[FIELD.operator]);
    entry.lastDay = Math.max(entry.lastDay, row[FIELD.day]);
    byCode.set(areaCode, entry);
  }

  return [...byCode.entries()]
    .map(([areaCode, entry]) => {
      const capacity = areaCodeCapacity(areaCode);
      return {
        areaCode,
        locality: entry.locality,
        region: areaCodeRegion(areaCode),
        subscriberDigits: subscriberLength(areaCode),
        allocationCount: entry.allocationCount,
        assignedNumbers: entry.assignedNumbers,
        capacity,
        occupancy: capacity ? entry.assignedNumbers / capacity : 0,
        operatorCount: entry.operators.size,
        lastAssignedAt: dayToIso(entry.lastDay),
      };
    })
    .sort((a, b) => b.assignedNumbers - a.assignedNumbers);
});

export type AreaCodeDetail = AreaCodeStats & {
  allocations: Allocation[];
  operators: OperatorStats[];
  freeRanges: ReturnType<typeof freeRanges>;
  reservedRanges: ReturnType<typeof reservedRanges>;
  occupancyByDigit: ReturnType<typeof occupancyByFirstDigit>;
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

  return {
    ...stats,
    allocations,
    operators: aggregateOperators(dataset, rows),
    freeRanges: freeRanges(
      areaCode,
      rows.map((row) => row[FIELD.block]),
    ),
    reservedRanges: reservedRanges(areaCode),
    occupancyByDigit: occupancyByFirstDigit(
      areaCode,
      rows.map((row) => row[FIELD.block]),
    ),
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

/** Serie anual de asignaciones a partir de la fecha de cada resolución. */
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

  let cumulativeNumbers = 0;
  let cumulativeAllocations = 0;
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, entry]) => {
      cumulativeNumbers += entry.assignedNumbers;
      cumulativeAllocations += entry.allocationCount;
      return { year, ...entry, cumulativeNumbers, cumulativeAllocations };
    });
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

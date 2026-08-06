import { MIGRATION_REGIONS } from "./constants";

/**
 * Espacio de indicativos interurbanos: qué códigos de área existen y cuáles
 * quedan libres para abrir.
 *
 * El PFNN (VII.3) abrió los indicativos anteponiendo un dígito según la región:
 * 1 para el AMBA, 2 para el Interior Sur y 3 para el Interior Norte. Los
 * primeros dígitos 4, 5, 7 y 9 quedaron en reserva (tabla 5.2) y el 6 y el 8
 * están tomados por los servicios no geográficos (tabla 3.4). Por eso el
 * espacio disponible para nuevos indicativos geográficos se explora dentro
 * de los prefijos 2 y 3.
 */

/** Primeros dígitos por los que puede empezar un indicativo del interior. */
export const OPEN_AREA_ROOTS = ["2", "3"] as const;

/** Longitud máxima que se explora al enumerar el espacio de indicativos. */
export const AREA_SPACE_DEPTH = 4;

export type AreaCodeSlot = {
  /** Indicativo candidato de 4 dígitos. */
  code: string;
  /** Indicativo asignado que lo cubre (él mismo o un prefijo suyo), si existe. */
  coveredBy: string | null;
  /** Macrorregión a la que pertenecería según el primer dígito. */
  region: string;
};

/**
 * Enumera el espacio de indicativos de 4 dígitos bajo los prefijos 2 y 3 y
 * marca cuáles están cubiertos por un indicativo ya en uso. Un indicativo
 * corto ocupa todo su subárbol: el 221 (La Plata) cubre 2210 a 2219.
 */
export function enumerateAreaSpace(assignedCodes: Iterable<string>): AreaCodeSlot[] {
  const assigned = new Set(assignedCodes);
  const slots: AreaCodeSlot[] = [];

  for (const root of OPEN_AREA_ROOTS) {
    const region =
      MIGRATION_REGIONS.find((r) => r.digit === root)?.name ?? "Sin clasificar";
    const start = Number(root) * 10 ** (AREA_SPACE_DEPTH - 1);
    for (let value = start; value < start + 10 ** (AREA_SPACE_DEPTH - 1); value++) {
      const code = String(value);
      let coveredBy: string | null = null;
      // El indicativo puede estar tomado por sí mismo o por un prefijo más corto.
      for (let length = 2; length <= AREA_SPACE_DEPTH; length++) {
        const candidate = code.slice(0, length);
        if (assigned.has(candidate)) {
          coveredBy = candidate;
          break;
        }
      }
      slots.push({ code, coveredBy, region });
    }
  }

  return slots;
}

export type AreaSpaceSummary = {
  /** Cantidad de indicativos de 4 dígitos equivalentes que están tomados. */
  used: number;
  /** Cantidad que queda libre para abrir nuevos indicativos. */
  free: number;
  /** Total explorado. */
  total: number;
  /** Tramos libres agrupados por prefijo de 3 dígitos, para mostrarlos compactos. */
  freeByPrefix: Array<{ prefix: string; region: string; codes: string[] }>;
};

/** Resume el espacio de indicativos: cuánto está tomado y qué tramos quedan libres. */
export function summarizeAreaSpace(assignedCodes: Iterable<string>): AreaSpaceSummary {
  const slots = enumerateAreaSpace(assignedCodes);
  const grouped = new Map<string, { prefix: string; region: string; codes: string[] }>();

  for (const slot of slots) {
    if (slot.coveredBy) continue;
    const prefix = slot.code.slice(0, 3);
    const entry = grouped.get(prefix) ?? { prefix, region: slot.region, codes: [] };
    entry.codes.push(slot.code);
    grouped.set(prefix, entry);
  }

  const free = slots.filter((s) => !s.coveredBy).length;
  return {
    used: slots.length - free,
    free,
    total: slots.length,
    freeByPrefix: [...grouped.values()].sort((a, b) => a.prefix.localeCompare(b.prefix)),
  };
}

/**
 * Indicativos más largos que abren dentro de otro.
 *
 * El 2982 y el 2983 abren dentro del 298: sus números son exactamente los del
 * 298 que empiezan con 2 y con 3. Saberlo es indispensable para no contar dos
 * veces el mismo espacio de numeración.
 */
export function childAreaCodes(
  areaCode: string,
  allAreaCodes: Iterable<string>,
): string[] {
  const children: string[] = [];
  for (const candidate of allAreaCodes) {
    if (candidate.length > areaCode.length && candidate.startsWith(areaCode)) {
      children.push(candidate);
    }
  }
  return children.sort();
}

/** Indicativo más corto dentro del cual abre este, si existe. */
export function parentAreaCode(
  areaCode: string,
  allAreaCodes: ReadonlySet<string>,
): string | null {
  for (let length = 2; length < areaCode.length; length++) {
    const candidate = areaCode.slice(0, length);
    if (allAreaCodes.has(candidate)) return candidate;
  }
  return null;
}

import {
  NATIONAL_NUMBER_LENGTH,
  RESERVED_SUBSCRIBER_PREFIXES,
  SUBSCRIBER_FIRST_DIGITS,
} from "./constants";
import { reservedPrefixSize, subscriberLength } from "./capacity";

/**
 * Reparto del espacio de numeración dentro de un indicativo.
 *
 * Cada número de abonado del indicativo cae en una de cuatro categorías:
 *
 * - **asignado**: está dentro de un bloque que Enacom le dio a un prestador;
 * - **reservado**: el Plan no permite asignarlo, como el tramo del 911;
 * - **cedido**: pertenece a otro indicativo más largo que abre dentro de este.
 *   El 2982 ocupa exactamente los números del 298 que empiezan con 2, porque
 *   298 + 2XXXXXX y 2982 + XXXXXX son el mismo número nacional;
 * - **libre**: lo que queda, y es lo único realmente disponible.
 *
 * Los cuatro conjuntos son disjuntos y suman el espacio útil del indicativo,
 * así que las cifras de la interfaz cierran entre sí por construcción.
 */

export type NumberRange = {
  /** Primer número de abonado del tramo, con ceros a la izquierda. */
  first: string;
  /** Último número de abonado del tramo. */
  last: string;
  /** Cantidad de números que contiene el tramo. */
  size: number;
};

/** Tramo cedido a otro indicativo que abre dentro de este. */
export type CededRange = NumberRange & {
  /** Indicativo que se quedó con estos números. */
  areaCode: string;
  /** Prefijo del número de abonado que ocupa. */
  prefix: string;
};

/** Tramo que el Plan no permite asignar. */
export type ReservedRange = NumberRange & { prefix: string };

/** Tramo que este indicativo no puede asignar, con el motivo. */
export type UnavailableRange = NumberRange & {
  reason: "reservado" | "cedido";
  /** Prefijo reservado, o indicativo que se quedó con el tramo. */
  detail: string;
};

type Interval = { start: number; end: number };

/** Convierte un bloque en el intervalo numérico [inicio, fin] que ocupa. */
export function blockToInterval(areaCode: string, block: string): Interval {
  const free = NATIONAL_NUMBER_LENGTH - areaCode.length - block.length;
  const base = Number(block) * 10 ** free;
  return { start: base, end: base + 10 ** free - 1 };
}

/** Rellena un número de abonado con ceros hasta la longitud del indicativo. */
function padder(areaCode: string): (value: number) => string {
  const length = subscriberLength(areaCode);
  return (value: number) => String(value).padStart(length, "0");
}

/** Une intervalos solapados o contiguos en una lista ordenada y mínima. */
function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end + 1) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

/** Resta de un intervalo los tramos que ocupan otros, devolviendo lo que sobra. */
function subtractIntervals(base: Interval, holes: Interval[]): Interval[] {
  const result: Interval[] = [];
  let cursor = base.start;
  for (const hole of mergeIntervals(holes)) {
    if (hole.end < cursor) continue;
    if (hole.start > base.end) break;
    if (hole.start > cursor) result.push({ start: cursor, end: hole.start - 1 });
    cursor = Math.max(cursor, hole.end + 1);
  }
  if (cursor <= base.end) result.push({ start: cursor, end: base.end });
  return result;
}

const size = (interval: Interval) => interval.end - interval.start + 1;
const total = (intervals: Interval[]) => intervals.reduce((sum, i) => sum + size(i), 0);

export type AreaSpace = {
  /** Cantidad de números que este indicativo puede llegar a asignar. */
  usableCapacity: number;
  /** Números contenidos en los bloques ya asignados. */
  assigned: number;
  /** Números todavía disponibles. */
  free: number;
  /** Proporción de la capacidad utilizable que está asignada. */
  occupancy: number;
  freeRanges: NumberRange[];
  reservedRanges: ReservedRange[];
  cededRanges: CededRange[];
  /** Reservados y cedidos en una sola lista ordenada, con el motivo de cada uno. */
  unavailableRanges: UnavailableRange[];
  /**
   * Reparto del espacio abierto por el primer dígito del número de abonado.
   * Las tres porciones se miden sobre el tamaño nominal del dígito y suman ese
   * total, así que la barra representa siempre el dígito entero.
   */
  byFirstDigit: Array<{
    digit: string;
    /** Cantidad de números que caben en el dígito, sin descontar nada. */
    nominal: number;
    assigned: number;
    /** Números del dígito que este indicativo no puede asignar. */
    unavailable: number;
    /** Números del dígito todavía disponibles. */
    available: number;
    /** Capacidad propia del dígito: nominal menos lo no asignable. */
    capacity: number;
    /** Ocupación sobre la capacidad propia. */
    ratio: number;
    /** Indicativos que se quedaron con parte de este dígito. */
    cededTo: string[];
    /** True si el dígito no tiene nada disponible ni asignado acá. */
    unusable: boolean;
  }>;
};

/**
 * Calcula el reparto completo del espacio de un indicativo.
 *
 * `children` son los indicativos más largos que empiezan con este. Lo que ellos
 * ocupan se descuenta de la capacidad, salvo la parte que el propio indicativo
 * ya tiene asignada: cuando el 264 tiene bloques dentro del tramo del 2646, esos
 * números están efectivamente en uso del 264 y se siguen contando como suyos.
 */
export function computeAreaSpace(
  areaCode: string,
  blocks: string[],
  children: string[] = [],
): AreaSpace {
  const length = subscriberLength(areaCode);
  const pad = padder(areaCode);
  const spaceStart = Number(SUBSCRIBER_FIRST_DIGITS[0]) * 10 ** (length - 1);
  const spaceEnd = 10 ** length - 1;

  const assignedIntervals = mergeIntervals(
    blocks.map((block) => blockToInterval(areaCode, block)),
  );

  // Tramos que el Plan no permite asignar, como el 911.
  const reserved: ReservedRange[] = RESERVED_SUBSCRIBER_PREFIXES.filter(
    (prefix) => reservedPrefixSize(areaCode, prefix) > 0,
  ).map((prefix) => {
    const interval = blockToInterval(areaCode, prefix);
    return {
      prefix,
      first: pad(interval.start),
      last: pad(interval.end),
      size: size(interval),
    };
  });
  const reservedIntervals = reserved.map((range) =>
    blockToInterval(areaCode, range.prefix),
  );

  // Tramos que se lleva cada indicativo hijo, sin contar lo que este ya usa.
  //
  // El tramo se recorta al espacio útil: el 2940 abre sobre los números del 294
  // que empiezan con 0, que el 294 no podía asignar de todos modos, así que
  // listarlo como numeración cedida sería contar una pérdida que nunca existió.
  const ceded: CededRange[] = [];
  for (const child of children) {
    const prefix = child.slice(areaCode.length);
    const raw = blockToInterval(areaCode, prefix);
    const childInterval = {
      start: Math.max(raw.start, spaceStart),
      end: Math.min(raw.end, spaceEnd),
    };
    if (childInterval.start > childInterval.end) continue;
    for (const piece of subtractIntervals(childInterval, [
      ...assignedIntervals,
      ...reservedIntervals,
    ])) {
      ceded.push({
        areaCode: child,
        prefix,
        first: pad(piece.start),
        last: pad(piece.end),
        size: size(piece),
      });
    }
  }
  const cededIntervals = ceded.map((range) => ({
    start: Number(range.first),
    end: Number(range.last),
  }));

  const occupied = [...assignedIntervals, ...reservedIntervals, ...cededIntervals];
  const freeIntervals = subtractIntervals({ start: spaceStart, end: spaceEnd }, occupied);

  const assigned = total(assignedIntervals);
  const free = total(freeIntervals);
  const usableCapacity = assigned + free;

  // Reparto por primer dígito, para el gráfico de ocupación.
  const digitSize = 10 ** (length - 1);
  const byFirstDigit = SUBSCRIBER_FIRST_DIGITS.map((digit) => {
    const digitInterval = blockToInterval(areaCode, digit);
    const clip = (intervals: Interval[]) =>
      intervals
        .map((i) => ({
          start: Math.max(i.start, digitInterval.start),
          end: Math.min(i.end, digitInterval.end),
        }))
        .filter((i) => i.start <= i.end);

    const digitAssigned = total(clip(assignedIntervals));
    const unavailable = total(clip([...reservedIntervals, ...cededIntervals]));
    const capacity = digitSize - unavailable;
    const cededTo = ceded
      .filter((range) => range.first[0] === digit)
      .map((range) => range.areaCode);

    return {
      digit,
      nominal: digitSize,
      assigned: digitAssigned,
      unavailable,
      available: digitSize - digitAssigned - unavailable,
      capacity,
      ratio: capacity > 0 ? digitAssigned / capacity : 0,
      cededTo: [...new Set(cededTo)],
      unusable: capacity === 0,
    };
  });

  return {
    usableCapacity,
    assigned,
    free,
    occupancy: usableCapacity > 0 ? assigned / usableCapacity : 0,
    freeRanges: freeIntervals.map((interval) => ({
      first: pad(interval.start),
      last: pad(interval.end),
      size: size(interval),
    })),
    reservedRanges: reserved,
    cededRanges: ceded.sort((a, b) => a.first.localeCompare(b.first)),
    unavailableRanges: [
      ...reserved.map(
        (range): UnavailableRange => ({ ...range, reason: "reservado", detail: range.prefix }),
      ),
      ...ceded.map(
        (range): UnavailableRange => ({ ...range, reason: "cedido", detail: range.areaCode }),
      ),
    ].sort((a, b) => a.first.localeCompare(b.first)),
    byFirstDigit,
  };
}

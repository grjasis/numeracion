import {
  NATIONAL_NUMBER_LENGTH,
  RESERVED_SUBSCRIBER_PREFIXES,
  SUBSCRIBER_FIRST_DIGITS,
} from "./constants";
import { reservedPrefixSize, subscriberLength } from "./capacity";

/**
 * Cálculo del espacio de numeración libre dentro de un indicativo.
 *
 * Cada bloque asignado se traduce a un intervalo cerrado de números de abonado.
 * Como el PFNN no admite solapamientos entre bloques (un bloque nunca puede ser
 * prefijo de otro), alcanza con ordenar los intervalos y buscar los huecos.
 * Los prefijos reservados, como el 911, se tratan como intervalos ocupados:
 * no están asignados a nadie, pero tampoco son asignables.
 */

export type NumberRange = {
  /** Primer número de abonado del tramo, con ceros a la izquierda. */
  first: string;
  /** Último número de abonado del tramo. */
  last: string;
  /** Cantidad de números que contiene el tramo. */
  size: number;
};

/** Convierte un bloque en el intervalo numérico [inicio, fin] que ocupa. */
export function blockToInterval(
  areaCode: string,
  block: string,
): { start: number; end: number } {
  const free = NATIONAL_NUMBER_LENGTH - areaCode.length - block.length;
  const base = Number(block) * 10 ** free;
  return { start: base, end: base + 10 ** free - 1 };
}

/** Rellena un número de abonado con ceros hasta la longitud del indicativo. */
function padder(areaCode: string): (value: number) => string {
  const length = subscriberLength(areaCode);
  return (value: number) => String(value).padStart(length, "0");
}

/** Tramos que el Plan reserva dentro de un indicativo y por lo tanto no son asignables. */
export function reservedRanges(
  areaCode: string,
): Array<NumberRange & { prefix: string }> {
  const pad = padder(areaCode);
  return RESERVED_SUBSCRIBER_PREFIXES.filter(
    (prefix) => reservedPrefixSize(areaCode, prefix) > 0,
  ).map((prefix) => {
    const { start, end } = blockToInterval(areaCode, prefix);
    return { prefix, first: pad(start), last: pad(end), size: end - start + 1 };
  });
}

/**
 * Devuelve los tramos de numeración sin asignar de un indicativo.
 * El espacio útil arranca en el primer dígito válido (2) y termina en el máximo
 * número de abonado, porque el 0 y el 1 iniciales están restringidos.
 */
export function freeRanges(areaCode: string, blocks: string[]): NumberRange[] {
  const length = subscriberLength(areaCode);
  if (length <= 0) return [];

  const pad = padder(areaCode);
  const spaceStart = Number(SUBSCRIBER_FIRST_DIGITS[0]) * 10 ** (length - 1);
  const spaceEnd = 10 ** length - 1;

  // Lo asignado y lo reservado se tratan igual: nada de eso queda disponible.
  const occupied = [
    ...blocks.map((block) => blockToInterval(areaCode, block)),
    ...RESERVED_SUBSCRIBER_PREFIXES.filter(
      (prefix) => reservedPrefixSize(areaCode, prefix) > 0,
    ).map((prefix) => blockToInterval(areaCode, prefix)),
  ].sort((a, b) => a.start - b.start);

  const ranges: NumberRange[] = [];
  let cursor = spaceStart;
  for (const { start, end } of occupied) {
    // Ignora lo que caiga por debajo del espacio útil (no debería ocurrir).
    if (end < cursor) continue;
    if (start > cursor) {
      ranges.push({ first: pad(cursor), last: pad(start - 1), size: start - cursor });
    }
    cursor = Math.max(cursor, end + 1);
  }
  if (cursor <= spaceEnd) {
    ranges.push({ first: pad(cursor), last: pad(spaceEnd), size: spaceEnd - cursor + 1 });
  }
  return ranges;
}

/**
 * Ocupación de un indicativo agrupada por característica de central de un
 * dígito (2 a 9). Sirve para el mapa de calor de uso del espacio.
 * La capacidad de cada dígito descuenta los prefijos reservados que caen dentro.
 */
export function occupancyByFirstDigit(
  areaCode: string,
  blocks: string[],
): Array<{ digit: string; assigned: number; capacity: number; ratio: number }> {
  const length = subscriberLength(areaCode);
  const nominal = 10 ** (length - 1);
  const assigned = new Map<string, number>();

  for (const block of blocks) {
    const { start, end } = blockToInterval(areaCode, block);
    assigned.set(block[0], (assigned.get(block[0]) ?? 0) + (end - start + 1));
  }

  return SUBSCRIBER_FIRST_DIGITS.map((digit) => {
    const used = assigned.get(digit) ?? 0;
    const reserved = RESERVED_SUBSCRIBER_PREFIXES.filter((prefix) =>
      prefix.startsWith(digit),
    ).reduce((total, prefix) => total + reservedPrefixSize(areaCode, prefix), 0);
    const capacity = nominal - reserved;
    return { digit, assigned: used, capacity, ratio: capacity ? used / capacity : 0 };
  });
}

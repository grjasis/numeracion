import {
  AREA_CODE_LENGTHS,
  COUNTRY_CODE,
  MIGRATION_REGIONS,
  MOBILE_INTERNATIONAL_DIGIT,
  NATIONAL_NUMBER_LENGTH,
  RESERVED_SUBSCRIBER_PREFIXES,
  SUBSCRIBER_FIRST_DIGITS,
} from "./constants";

/**
 * Cálculos derivados del Plan Fundamental de Numeración.
 *
 * Regla base (PFNN III.1.1 y tabla 3.1): indicativo interurbano + número de
 * abonado suman siempre 10 dígitos. Un "bloque" es el prefijo del número de
 * abonado que Enacom asigna a un operador; la cantidad de números que contiene
 * es 10 elevado a la cantidad de dígitos que quedan libres.
 */

/** Devuelve true si el indicativo tiene una longitud admitida por el plan. */
export function isValidAreaCode(areaCode: string): boolean {
  return (
    /^\d+$/.test(areaCode) &&
    (AREA_CODE_LENGTHS as readonly number[]).includes(areaCode.length)
  );
}

/** Cantidad de dígitos del número de abonado para un indicativo dado (11 -> 8; 2657 -> 6). */
export function subscriberLength(areaCode: string): number {
  return NATIONAL_NUMBER_LENGTH - areaCode.length;
}

/**
 * Cantidad de números telefónicos que contiene un bloque.
 * Ejemplo: indicativo 11 (2 dígitos) + bloque 4321 (4) deja 4 libres = 10.000 números.
 */
export function blockCapacity(areaCode: string, block: string): number {
  const free = NATIONAL_NUMBER_LENGTH - areaCode.length - block.length;
  if (free < 0) return 0;
  return 10 ** free;
}

/**
 * Cantidad de números que ocupa un prefijo reservado dentro de un indicativo.
 * Devuelve 0 si el prefijo no entra en el número de abonado de ese indicativo.
 */
export function reservedPrefixSize(areaCode: string, prefix: string): number {
  const free = subscriberLength(areaCode) - prefix.length;
  return free >= 0 ? 10 ** free : 0;
}

/**
 * Capacidad total teórica de un indicativo: todos los números de abonado cuya
 * característica de central arranca con un dígito válido (2 a 9), porque el
 * PFNN restringe el 0 y el 1 como primer dígito, menos los prefijos reservados
 * como el 911.
 */
export function areaCodeCapacity(areaCode: string): number {
  const length = subscriberLength(areaCode);
  if (length <= 0) return 0;
  const nominal = SUBSCRIBER_FIRST_DIGITS.length * 10 ** (length - 1);
  const reserved = RESERVED_SUBSCRIBER_PREFIXES.reduce(
    (total, prefix) => total + reservedPrefixSize(areaCode, prefix),
    0,
  );
  return nominal - reserved;
}

/** Devuelve true si el bloque invade un prefijo reservado como el 911. */
export function isReservedBlock(block: string): boolean {
  return RESERVED_SUBSCRIBER_PREFIXES.some(
    (prefix) => block.startsWith(prefix) || prefix.startsWith(block),
  );
}

/**
 * Macrorregión del indicativo según el dígito que se le antepuso en la
 * migración a 10 dígitos (PFNN VII.3): 1 = AMBA, 2 = Interior Sur, 3 = Interior Norte.
 */
export function areaCodeRegion(areaCode: string): string {
  const region = MIGRATION_REGIONS.find((r) => r.digit === areaCode[0]);
  return region ? region.name : "Sin clasificar";
}

/** Primeros dos dígitos del indicativo: agrupa indicativos vecinos de una misma zona. */
export function areaCodeZone(areaCode: string): string {
  return areaCode.slice(0, 2);
}

/** Formatea un número completo en notación E.164 (+54 9 11 XXXXXXXX para móviles). */
export function toE164(
  areaCode: string,
  subscriberNumber: string,
  mobile = false,
): string {
  return `+${COUNTRY_CODE}${mobile ? MOBILE_INTERNATIONAL_DIGIT : ""}${areaCode}${subscriberNumber}`;
}

/** Primer y último número de abonado que cubre un bloque, por ejemplo 4321-0000 a 4321-9999. */
export function blockRange(
  areaCode: string,
  block: string,
): { first: string; last: string } {
  const free = NATIONAL_NUMBER_LENGTH - areaCode.length - block.length;
  if (free <= 0) return { first: block, last: block };
  return {
    first: `${block}${"0".repeat(free)}`,
    last: `${block}${"9".repeat(free)}`,
  };
}

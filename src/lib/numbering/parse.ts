import {
  COUNTRY_CODE,
  CPP_PREFIX,
  MOBILE_INTERNATIONAL_DIGIT,
  NATIONAL_NUMBER_LENGTH,
  NATIONAL_PREFIX,
  RESERVED_SUBSCRIBER_PREFIXES,
  SUBSCRIBER_FIRST_DIGITS,
} from "./constants";
import { AREA_CODE_LENGTHS } from "./constants";

/**
 * Interpretación de un número telefónico escrito por una persona.
 *
 * El desafío no es limpiar el formato sino el recorte: el Plan admite
 * indicativos de 2, 3 y 4 dígitos y hay indicativos que son prefijo de otros
 * —existen el 298 y el 2982—, así que un mismo número de diez dígitos puede
 * partirse de más de una manera. En vez de adivinar, se devuelven todas las
 * lecturas que respetan el Plan y quien consulta decide.
 */

export type ParsedNumber = {
  /** Indicativo interurbano. */
  areaCode: string;
  /** Número de abonado, sin prefijos de acceso. */
  subscriberNumber: string;
  /** Número nacional completo de diez dígitos. */
  national: string;
};

export type ParseResult =
  | { ok: true; digits: string; candidates: ParsedNumber[] }
  | { ok: false; digits: string; reason: ParseFailure };

export type ParseFailure =
  | "vacio"
  | "sin-digitos"
  | "muy-corto"
  | "muy-largo"
  | "indicativo-desconocido";

/**
 * Quita los prefijos de acceso que la gente escribe al marcar: el código de
 * país, el 0 de larga distancia y el 9 que se intercala en formato
 * internacional para móviles. El 15 se saca después, porque va detrás del
 * indicativo y recién ahí se sabe dónde empieza.
 */
function stripAccessPrefixes(digits: string): string {
  let rest = digits;

  // 00 internacional o 0 nacional, escritos antes del código de país.
  while (rest.startsWith(NATIONAL_PREFIX) && rest.length > NATIONAL_NUMBER_LENGTH) {
    rest = rest.slice(NATIONAL_PREFIX.length);
  }
  if (rest.startsWith(COUNTRY_CODE) && rest.length > NATIONAL_NUMBER_LENGTH) {
    rest = rest.slice(COUNTRY_CODE.length);
  }
  // El 0 de larga distancia puede venir después del código de país.
  while (rest.startsWith(NATIONAL_PREFIX) && rest.length > NATIONAL_NUMBER_LENGTH) {
    rest = rest.slice(NATIONAL_PREFIX.length);
  }
  // El 9 de +54 9 … indica móvil y no forma parte del número nacional.
  if (
    rest.startsWith(MOBILE_INTERNATIONAL_DIGIT) &&
    rest.length === NATIONAL_NUMBER_LENGTH + 1
  ) {
    rest = rest.slice(MOBILE_INTERNATIONAL_DIGIT.length);
  }

  return rest;
}

/**
 * Devuelve true si el número de abonado arranca con un dígito asignable.
 * El 0 y el 1 quedan fuera del espacio de numeración, así que un número que
 * empiece así no puede existir y no vale la pena buscarlo en la base.
 */
export function hasValidFirstDigit(subscriberNumber: string): boolean {
  return (SUBSCRIBER_FIRST_DIGITS as readonly string[]).includes(subscriberNumber[0]);
}

/**
 * Devuelve true si el número de abonado respeta todas las restricciones del
 * Plan, incluidos los prefijos reservados como el 911.
 *
 * El parseo no usa esta función: un número dentro del 911 se interpreta igual,
 * para poder explicar por qué no puede existir en vez de decir que no se
 * entendió lo que se escribió.
 */
export function isValidSubscriberNumber(subscriberNumber: string): boolean {
  if (!hasValidFirstDigit(subscriberNumber)) return false;
  return !RESERVED_SUBSCRIBER_PREFIXES.some((prefix) =>
    subscriberNumber.startsWith(prefix),
  );
}

/**
 * Interpreta un número escrito en cualquier formato de uso corriente:
 * `011 4321-5678`, `+54 9 11 4321 5678`, `0223 15 480-1234`, `2657440123`.
 *
 * `knownAreaCodes` son los indicativos que existen en la base; sin esa lista no
 * hay forma de decidir dónde termina el indicativo.
 */
export function parsePhoneNumber(
  input: string,
  knownAreaCodes: ReadonlySet<string>,
): ParseResult {
  if (!input.trim()) return { ok: false, digits: "", reason: "vacio" };

  const raw = input.replace(/\D/g, "");
  if (!raw) return { ok: false, digits: "", reason: "sin-digitos" };

  const digits = stripAccessPrefixes(raw);

  const candidates: ParsedNumber[] = [];
  for (const length of AREA_CODE_LENGTHS) {
    const areaCode = digits.slice(0, length);
    if (!knownAreaCodes.has(areaCode)) continue;

    let subscriberNumber = digits.slice(length);
    // El 15 va entre el indicativo y el número: 0223 15 480-1234.
    if (
      subscriberNumber.startsWith(CPP_PREFIX) &&
      subscriberNumber.length === NATIONAL_NUMBER_LENGTH - length + CPP_PREFIX.length
    ) {
      subscriberNumber = subscriberNumber.slice(CPP_PREFIX.length);
    }

    if (subscriberNumber.length !== NATIONAL_NUMBER_LENGTH - length) continue;
    if (!hasValidFirstDigit(subscriberNumber)) continue;

    candidates.push({
      areaCode,
      subscriberNumber,
      national: `${areaCode}${subscriberNumber}`,
    });
  }

  if (candidates.length > 0) return { ok: true, digits, candidates };

  // Sin candidatos: el motivo más útil es el que explica por qué no cerró.
  if (digits.length < NATIONAL_NUMBER_LENGTH) {
    return { ok: false, digits, reason: "muy-corto" };
  }
  if (digits.length > NATIONAL_NUMBER_LENGTH + CPP_PREFIX.length) {
    return { ok: false, digits, reason: "muy-largo" };
  }
  return { ok: false, digits, reason: "indicativo-desconocido" };
}

/** Formatea un número nacional para mostrarlo: "11 4321-5678". */
export function formatNational(areaCode: string, subscriberNumber: string): string {
  const head = subscriberNumber.slice(0, subscriberNumber.length - 4);
  const tail = subscriberNumber.slice(-4);
  return `${areaCode} ${head}-${tail}`;
}

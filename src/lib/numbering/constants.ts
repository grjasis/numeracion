/**
 * Constantes del Plan Fundamental de Numeración Nacional (PFNN) de la
 * República Argentina, aprobado por Resolución SC 46/1997
 * (Boletín Oficial Nº 28.568 del 21/01/1997), incorporado como Anexo IV
 * del Decreto 92/97 y complementado por la Resolución SC 1643/98.
 *
 * El texto de referencia está en docs/referencia/resolucion-sc-46-1997.md
 * y el análisis en docs/01-plan-fundamental-numeracion.md.
 */

/** Longitud fija del Número Nacional: PFNN III.1.1 ("uniforme a 10 dígitos"). */
export const NATIONAL_NUMBER_LENGTH = 10;

/** Código de país asignado a la Argentina por la UIT-T (Recomendación E.164). */
export const COUNTRY_CODE = "54";

/**
 * Longitudes válidas del Indicativo Interurbano (código de área), según la
 * tabla 3.1 del PFNN: AB, ABC o ABCD.
 */
export const AREA_CODE_LENGTHS = [2, 3, 4] as const;

/**
 * Longitudes válidas del Número de Abonado (tabla 3.1): seis, siete u ocho
 * dígitos, siempre complementarias al indicativo hasta llegar a 10.
 */
export const SUBSCRIBER_NUMBER_LENGTHS = [6, 7, 8] as const;

/** El Número Interno de Central siempre tiene 4 dígitos, de 0000 a 9999 (PFNN III.2.1.2). */
export const INTERNAL_NUMBER_LENGTH = 4;

/**
 * Primer dígito válido de la Característica de Central, es decir el primer
 * dígito del Número de Abonado. El PFNN restringe el 0 (reservado a prefijos
 * de acceso) y el 1 (reservado a servicios especiales), así que el espacio
 * útil de cada indicativo arranca en 2.
 */
export const SUBSCRIBER_FIRST_DIGITS = ["2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * Prefijos que un número de abonado no puede usar aunque su primer dígito sea
 * válido. El 911, número único de emergencias, queda excluido del espacio
 * asignable: ningún número local puede empezar con esa combinación.
 * Se verifica en la base de Enacom, donde existen los bloques 910, 912 y 913
 * pero nunca el 911.
 */
export const RESERVED_SUBSCRIBER_PREFIXES = ["911"] as const;

/**
 * Prefijos de acceso definidos en la tabla 4.2 del PFNN.
 * No forman parte del número: seleccionan formato de marcación, red o servicio.
 */
export const ACCESS_PREFIXES: ReadonlyArray<{ prefix: string; meaning: string }> = [
  { prefix: "0", meaning: "Larga distancia nacional automática del operador preseleccionado" },
  { prefix: "00", meaning: "Larga distancia internacional automática del operador preseleccionado" },
  { prefix: "15", meaning: "Llamada con la modalidad «abonado llamante paga»" },
  { prefix: "17", meaning: "Selección de operador para larga distancia nacional" },
  { prefix: "18", meaning: "Selección de operador para larga distancia internacional" },
];

/** Prefijo de acceso a la red nacional (larga distancia). */
export const NATIONAL_PREFIX = "0";

/** Prefijo de la modalidad «abonado llamante paga», el que se usa para llamar a móviles. */
export const CPP_PREFIX = "15";

/**
 * Dígito que se intercala en formato internacional para llamar a móviles
 * argentinos (+54 9 11 XXXX XXXX). Es el equivalente internacional del 15.
 */
export const MOBILE_INTERNATIONAL_DIGIT = "9";

/** Números reservados como prefijos de acceso o códigos de servicios especiales (tabla 5.1). */
export const RESERVED_PREFIXES = ["13", "14", "16"] as const;

/**
 * Primeros dígitos del Número Nacional reservados para abrir nuevos indicativos
 * interurbanos o servicios no geográficos (tabla 5.2).
 */
export const RESERVED_FIRST_DIGITS = ["4", "5", "7", "9"] as const;

/**
 * Regiones definidas por el proceso de migración del PFNN (VII.3): a los
 * indicativos previos a 1999 se les antepuso un dígito según la región.
 * Por eso hoy el primer dígito del indicativo revela la macrorregión.
 */
export const MIGRATION_REGIONS: ReadonlyArray<{
  digit: string;
  name: string;
  description: string;
}> = [
  { digit: "1", name: "AMBA", description: "Área Metropolitana de Buenos Aires (indicativo 11)" },
  { digit: "2", name: "Interior Sur", description: "Centro-este, Cuyo y Patagonia" },
  { digit: "3", name: "Interior Norte", description: "NOA, NEA y centro-norte" },
];

/**
 * Códigos de Servicios Especiales con formato 1XY (PFNN III.4.2, tabla 3.6),
 * más el 911 incorporado posteriormente como número único de emergencias.
 * `group` sigue la tabla 3.5: 10Y emergencias, 11Y y 12Y atención al cliente.
 */
export const SPECIAL_SERVICE_CODES: ReadonlyArray<{
  code: string;
  service: string;
  group: "emergencia" | "cliente" | "operadora";
}> = [
  { code: "100", service: "Bomberos", group: "emergencia" },
  { code: "101", service: "Policía", group: "emergencia" },
  { code: "102", service: "Ayuda al niño", group: "emergencia" },
  { code: "103", service: "Defensa Civil", group: "emergencia" },
  { code: "105", service: "Emergencia ambiental", group: "emergencia" },
  { code: "106", service: "Emergencia náutica", group: "emergencia" },
  { code: "107", service: "Emergencia médica", group: "emergencia" },
  { code: "110", service: "Información", group: "cliente" },
  { code: "112", service: "Atención a clientes del prestador local", group: "cliente" },
  { code: "113", service: "Hora oficial", group: "cliente" },
  { code: "114", service: "Reparaciones", group: "cliente" },
  { code: "115", service: "Prueba de campanilla", group: "cliente" },
  { code: "121", service: "Estado de cuenta del servicio", group: "cliente" },
  { code: "19", service: "Operadora nacional", group: "operadora" },
  { code: "000", service: "Operadora internacional", group: "operadora" },
  // Incorporado con posterioridad al texto original de la Res. SC 46/97 como
  // número único de emergencias; no responde al formato 1XY de la tabla 3.5.
  { code: "911", service: "Emergencias (número único)", group: "emergencia" },
];

/** Indicativos de Servicios No Geográficos definidos en la tabla 3.4 del PFNN. */
export const NON_GEOGRAPHIC_RANGES: ReadonlyArray<{
  range: string;
  description: string;
}> = [
  { range: "600", description: "Número no geográfico de valor agregado tipo audiotexto" },
  { range: "601 a 609", description: "Reserva para valor agregado tipo audiotexto" },
  { range: "610", description: "Otros servicios de valor agregado" },
  { range: "611 a 699", description: "Reserva para servicios no geográficos" },
  { range: "800", description: "Cobro revertido automático" },
  { range: "801 a 809", description: "Reserva para cobro revertido automático" },
  { range: "819 a 899", description: "Reserva para servicios no geográficos" },
];

/**
 * Servicios que aparecen en la base de Enacom (columna SERVICIO), con su
 * descripción. La columna puede combinar varios separados por barra.
 */
export const SERVICE_LABELS: Record<string, string> = {
  SBT: "Servicio Básico Telefónico",
  STM: "Servicio de Telefonía Móvil",
  PCS: "Servicio de Comunicaciones Personales",
  SRMC: "Servicio Radioeléctrico de Concentración de Enlaces Móvil Celular",
  SRCE: "Servicio Radioeléctrico de Concentración de Enlaces",
  SCMA: "Servicio de Comunicaciones Móviles Avanzadas",
  STEFI: "Servicio de Telefonía Fija Inalámbrica",
  OMV: "Operador Móvil Virtual",
  SAP: "Servicio de Aviso a Personas",
  TELSAT: "Servicio de Telefonía Satelital",
};

/** Servicios de la base que corresponden a numeración móvil. */
export const MOBILE_SERVICES = ["STM", "PCS", "SRMC", "SRCE", "SCMA", "OMV", "SAP"] as const;

/** Modalidades de tarificación que usa Enacom en la columna MODALIDAD. */
export const MODALITY_LABELS: Record<string, string> = {
  BASICA: "Básica: la llamada se tarifica al llamante como local",
  CPP: "Calling Party Pays: paga quien llama (se marca con el prefijo 15)",
  MPP: "Mobile Party Pays: paga el abonado móvil",
};

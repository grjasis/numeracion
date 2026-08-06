/** Formateadores con convenciones argentinas: punto de miles, coma decimal. */

const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("es-AR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const longDate = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export const formatInteger = (value: number): string => integer.format(value);

export const formatPercent = (value: number): string => percent.format(value);

/** Abrevia cantidades grandes: 188.271.600 -> "188,3 M". */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e6) return `${decimal.format(value / 1e6)} M`;
  if (Math.abs(value) >= 1e3) return `${decimal.format(value / 1e3)} k`;
  return integer.format(value);
}

/** Formatea una fecha ISO (YYYY-MM-DD) como "27 de julio de 2026". */
export function formatDate(iso: string): string {
  if (!iso) return "sin fecha";
  return longDate.format(new Date(`${iso}T00:00:00Z`));
}

/** Formatea una fecha ISO como "27/07/2026". */
export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  return shortDate.format(new Date(`${iso}T00:00:00Z`));
}

/** Separa un número de abonado en grupos legibles: 43210000 -> "4321-0000". */
export function formatSubscriberNumber(value: string): string {
  if (value.length <= 4) return value;
  return `${value.slice(0, value.length - 4)}-${value.slice(-4)}`;
}

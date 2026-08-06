import type { ReactNode } from "react";

import { formatPercent } from "@/lib/format";

/** Contenedor de sección con título y bajada opcional. */
export function Section({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-sm text-ink-secondary">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Tarjeta con superficie y borde hairline. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Tarjeta de indicador: una cifra grande con su etiqueta.
 * Sin gráfico, porque un número solo se lee mejor como número.
 */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
}) {
  return (
    <Card>
      <p className="text-sm text-ink-secondary">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
    </Card>
  );
}

/**
 * Barra de ocupación en línea, para usar dentro de tablas.
 * El valor va siempre escrito al lado: el color no es el único canal.
 */
export function OccupancyBar({ ratio }: { ratio: number }) {
  const percent = Math.min(1, Math.max(0, ratio));
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-gridline"
        role="presentation"
      >
        <span
          className="block h-full rounded-full bg-series-1"
          style={{ width: `${percent * 100}%` }}
        />
      </span>
      <span className="tabular text-ink-secondary">{formatPercent(ratio)}</span>
    </span>
  );
}

/**
 * Tabla con estilos consistentes y desplazamiento horizontal propio.
 *
 * El `min-w-0` no es decorativo: sin él, dentro de una grilla el contenedor
 * toma el ancho mínimo de su contenido en vez de encogerse, la tabla estira la
 * columna y la última se corta contra el borde en lugar de poder desplazarse.
 *
 * `minWidth` fija el ancho a partir del cual la tabla empieza a desplazarse;
 * conviene subirlo en las tablas de muchas columnas para que no se apelotonen.
 */
export function TableWrapper({
  children,
  minWidth = "40rem",
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="table-scroll w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

/** Encabezado de columna. `numeric` alinea a la derecha. */
export function Th({
  children,
  numeric = false,
}: {
  children: ReactNode;
  numeric?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-hairline px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-muted ${
        numeric ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/** Celda de datos. `numeric` alinea a la derecha con cifras tabulares. */
export function Td({
  children,
  numeric = false,
  className = "",
}: {
  children: ReactNode;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-gridline px-4 py-3 align-middle ${
        numeric ? "tabular text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

/**
 * Aviso destacado. `tone` cambia el color del filo lateral, pero el texto
 * siempre dice de qué se trata: el color no es el único canal.
 */
export function Callout({
  title,
  tone = "info",
  children,
}: {
  title: string;
  tone?: "info" | "warning";
  children: ReactNode;
}) {
  const border = tone === "warning" ? "border-l-warning" : "border-l-series-1";
  return (
    <aside
      className={`rounded-lg border border-hairline border-l-4 ${border} bg-surface p-5`}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 space-y-2 text-sm text-ink-secondary">{children}</div>
    </aside>
  );
}

/** Estado vacío para listados sin resultados. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-hairline bg-surface px-4 py-8 text-center text-sm text-ink-secondary">
      {children}
    </p>
  );
}

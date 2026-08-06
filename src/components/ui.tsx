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

/** Tabla con estilos consistentes y desplazamiento horizontal propio. */
export function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
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
      className={`border-b border-hairline px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-muted ${
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

/** Estado vacío para listados sin resultados. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-hairline bg-surface px-4 py-8 text-center text-sm text-ink-secondary">
      {children}
    </p>
  );
}

"use client";

import type { ReactNode } from "react";

/**
 * Piezas compartidas por los gráficos: ejes recesivos, tooltip propio y
 * envoltorio con título. Los colores salen de las variables CSS, así el
 * modo oscuro se resuelve solo.
 */

export const AXIS_STYLE = {
  fontSize: 12,
  fill: "var(--text-muted)",
} as const;

export const GRID_STROKE = "var(--gridline)";
export const SERIES_1 = "var(--series-1)";
export const SERIES_2 = "var(--series-2)";

/** Envoltorio con título, bajada y alto fijo para el área de dibujo. */
export function ChartFrame({
  title,
  description,
  height = 280,
  children,
}: {
  title: string;
  description?: string;
  height?: number;
  children: ReactNode;
}) {
  return (
    <figure className="rounded-lg border border-hairline bg-surface p-5">
      <figcaption className="mb-4 space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-sm text-ink-secondary">{description}</p>
        ) : null}
      </figcaption>
      <div style={{ height }}>{children}</div>
    </figure>
  );
}

type TooltipRow = { name?: string; value?: number | string; color?: string };

/** Tooltip con la superficie y la tinta del tablero, en vez del default de Recharts. */
export function ChartTooltip({
  active,
  label,
  payload,
  formatValue,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipRow[];
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((row, index) => (
          <li key={index} className="flex items-center gap-2 text-ink-secondary">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: row.color }}
            />
            <span>{row.name}</span>
            <span className="tabular ml-auto pl-4 text-ink">
              {typeof row.value === "number" ? formatValue(row.value) : row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

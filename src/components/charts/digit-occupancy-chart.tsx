"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatInteger, formatPercent } from "@/lib/format";
import { AXIS_STYLE, ChartFrame, GRID_STROKE, SERIES_1 } from "./chart-theme";

export type DigitOccupancy = {
  digit: string;
  nominal: number;
  assigned: number;
  unavailable: number;
  available: number;
  capacity: number;
  ratio: number;
  cededTo: string[];
  unusable: boolean;
};

/** Gris para la parte del dígito que este indicativo no puede asignar. */
const UNAVAILABLE_FILL = "var(--text-muted)";

type Row = DigitOccupancy & {
  assignedShare: number;
  unavailableShare: number;
};

/** Tooltip con el reparto completo del dígito y el motivo de lo no asignable. */
function DigitTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  const entry = payload?.[0]?.payload;
  if (!active || !entry) return null;

  return (
    <div className="max-w-72 rounded-md border border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">Números que empiezan con {entry.digit}</p>
      <dl className="mt-1 space-y-0.5 text-ink-secondary">
        <div className="flex justify-between gap-4">
          <dt>Asignado</dt>
          <dd className="tabular text-ink">{formatInteger(entry.assigned)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>No asignable</dt>
          <dd className="tabular text-ink">{formatInteger(entry.unavailable)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Disponible</dt>
          <dd className="tabular text-ink">{formatInteger(entry.available)}</dd>
        </div>
      </dl>
      {entry.capacity > 0 ? (
        <p className="mt-1 text-ink-secondary">
          Ocupación sobre lo asignable:{" "}
          <span className="text-ink">{formatPercent(entry.ratio)}</span>
        </p>
      ) : null}
      {entry.cededTo.length > 0 ? (
        <p className="mt-1 text-ink-secondary">
          {entry.unusable ? "Todo este tramo pertenece" : "Comparte este tramo"} con el
          código de área {entry.cededTo.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

/** Cuadradito de color con su etiqueta, para la leyenda. */
function LegendItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block size-3 rounded-sm"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

/**
 * Reparto del espacio de numeración de un indicativo, abierto por el primer
 * dígito de la característica de central.
 *
 * Cada barra representa el dígito completo: en azul lo asignado, en gris lo que
 * este indicativo no puede asignar —el tramo del 911 y lo que se lleva un
 * código de área que abre dentro de este— y en blanco lo que queda disponible.
 * Con dos porciones apiladas, un tramo cedido a medias se lee tal cual es en
 * vez de aparecer como un dígito lleno.
 */
export function DigitOccupancyChart({ data }: { data: DigitOccupancy[] }) {
  const rows: Row[] = data.map((entry) => ({
    ...entry,
    assignedShare: entry.nominal > 0 ? entry.assigned / entry.nominal : 0,
    unavailableShare: entry.nominal > 0 ? entry.unavailable / entry.nominal : 0,
  }));

  const cededTo = [...new Set(data.flatMap((entry) => entry.cededTo))];

  return (
    <ChartFrame
      title="Ocupación por primer dígito"
      description="Cada barra es el espacio completo de esa característica de central inicial. El 0 y el 1 no se asignan nunca."
      height={240}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="digit"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: "var(--baseline)" }}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[0, 1]}
            tickFormatter={(value: number) => formatPercent(value)}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", fillOpacity: 0.5 }}
            content={<DigitTooltip />}
          />
          <Bar
            dataKey="assignedShare"
            name="Asignado"
            stackId="espacio"
            fill={SERIES_1}
            maxBarSize={40}
          />
          <Bar
            dataKey="unavailableShare"
            name="No asignable"
            stackId="espacio"
            fill={UNAVAILABLE_FILL}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-secondary">
        <LegendItem color={SERIES_1}>Asignado</LegendItem>
        <LegendItem color={UNAVAILABLE_FILL}>
          No asignable
          {cededTo.length > 0 ? ` (911 y códigos de área ${cededTo.join(", ")})` : " (911)"}
        </LegendItem>
        <LegendItem color="var(--gridline)">Disponible</LegendItem>
      </div>
    </ChartFrame>
  );
}

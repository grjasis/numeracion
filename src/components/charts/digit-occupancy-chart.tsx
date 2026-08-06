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

import { formatPercent } from "@/lib/format";
import { AXIS_STYLE, ChartFrame, ChartTooltip, GRID_STROKE, SERIES_1 } from "./chart-theme";

export type DigitOccupancy = {
  digit: string;
  assigned: number;
  capacity: number;
  ratio: number;
};

/**
 * Ocupación del espacio de numeración de un indicativo, abierta por el primer
 * dígito de la característica de central. Muestra dónde queda lugar libre.
 */
export function DigitOccupancyChart({ data }: { data: DigitOccupancy[] }) {
  return (
    <ChartFrame
      title="Ocupación por primer dígito"
      description="Porcentaje del espacio asignado dentro de cada característica de central inicial. El 0 y el 1 no se asignan, y el tramo del 911 se descuenta del dígito 9."
      height={240}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
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
            content={<ChartTooltip formatValue={formatPercent} />}
          />
          <Bar
            dataKey="ratio"
            name="Ocupación"
            fill={SERIES_1}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

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

import { formatCompact, formatInteger } from "@/lib/format";
import { AXIS_STYLE, ChartFrame, ChartTooltip, GRID_STROKE, SERIES_1 } from "./chart-theme";

export type OperatorBar = {
  /** Nombre acortado para el eje. */
  label: string;
  /** Nombre completo, para el tooltip. */
  name: string;
  assignedNumbers: number;
};

/**
 * Ranking de operadores por números asignados.
 * Barras horizontales porque las etiquetas son nombres largos.
 */
export function OperatorsChart({
  data,
  title = "Operadores con más numeración asignada",
  description,
}: {
  data: OperatorBar[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartFrame title={title} description={description} height={Math.max(240, data.length * 34)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: "var(--baseline)" }}
            tickFormatter={formatCompact}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={168}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", fillOpacity: 0.5 }}
            content={<ChartTooltip formatValue={formatInteger} />}
          />
          <Bar
            dataKey="assignedNumbers"
            name="Números asignados"
            fill={SERIES_1}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

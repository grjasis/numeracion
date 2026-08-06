"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompact, formatInteger } from "@/lib/format";
import type { TimelinePoint } from "@/lib/dataset/queries";
import { AXIS_STYLE, ChartFrame, ChartTooltip, GRID_STROKE, SERIES_1 } from "./chart-theme";

/** Cada cuántos años se rotula el eje, contando desde el último hacia atrás. */
const TICK_STEP = 4;

/**
 * Años a rotular en el eje horizontal.
 *
 * Se generan desde el último hacia atrás para que el año de cierre de la serie
 * siempre quede escrito; el primero se agrega solo si no queda pegado al
 * siguiente. Sin esto Recharts descarta etiquetas por falta de lugar y el
 * extremo derecho del eje puede quedar sin año.
 */
function yearTicks(points: TimelinePoint[]): number[] {
  if (points.length === 0) return [];
  const first = points[0].year;
  const last = points[points.length - 1].year;

  const ticks: number[] = [];
  for (let year = last; year > first; year -= TICK_STEP) ticks.push(year);
  if (ticks.length === 0 || ticks[ticks.length - 1] - first >= 2) ticks.push(first);

  return ticks.reverse();
}

/**
 * Evolución de las asignaciones en el tiempo.
 *
 * Son dos medidas de escalas distintas (cantidad de números y cantidad de
 * bloques), así que van en dos gráficos separados en vez de un doble eje.
 */
export function TimelineCharts({ points }: { points: TimelinePoint[] }) {
  const ticks = yearTicks(points);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartFrame
        title="Números asignados acumulados"
        description="Suma de la capacidad de todos los bloques asignados hasta cada año."
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="acumulado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.24} />
                <stop offset="100%" stopColor={SERIES_1} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="year"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={{ stroke: "var(--baseline)" }}
              ticks={ticks}
              interval={0}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatCompact}
            />
            <Tooltip
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
              content={<ChartTooltip formatValue={formatInteger} />}
            />
            <Area
              type="monotone"
              dataKey="cumulativeNumbers"
              name="Números acumulados"
              stroke={SERIES_1}
              strokeWidth={2}
              fill="url(#acumulado)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface-1)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        title="Bloques asignados por año"
        description="Cantidad de resoluciones de asignación registradas en cada año."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="year"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={{ stroke: "var(--baseline)" }}
              ticks={ticks}
              interval={0}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatCompact}
            />
            <Tooltip
              cursor={{ fill: "var(--gridline)", fillOpacity: 0.5 }}
              content={<ChartTooltip formatValue={formatInteger} />}
            />
            <Bar
              dataKey="allocationCount"
              name="Bloques asignados"
              fill={SERIES_1}
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

import Link from "next/link";

import { OperatorsChart } from "@/components/charts/operators-chart";
import { TimelineCharts } from "@/components/charts/timeline-chart";
import { Card, Section, StatCard, Td, TableWrapper, Th } from "@/components/ui";
import {
  getAreaCodes,
  getNationalSummary,
  getNationalTimeline,
  getOperators,
} from "@/lib/dataset/queries";
import { formatCompact, formatDate, formatInteger, formatPercent } from "@/lib/format";
import { OccupancyBar } from "@/components/ui";

/** Acorta nombres societarios largos para que entren en el eje del gráfico. */
function shortenOperator(name: string): string {
  const short = name
    .replace(/\s+S\.?A\.?U?\.?$/i, "")
    .replace(/\s+S\.?R\.?L\.?$/i, "")
    .replace(/\s+SOCIEDAD.*$/i, "");
  return short.length > 28 ? `${short.slice(0, 27)}…` : short;
}

export default function HomePage() {
  const summary = getNationalSummary();
  const timeline = getNationalTimeline();
  const operators = getOperators();
  const areaCodes = getAreaCodes();

  const topOperators = operators.slice(0, 10);
  const topAreas = areaCodes.slice(0, 10);
  const mostSaturated = [...areaCodes]
    .sort((a, b) => b.occupancy - a.occupancy)
    .slice(0, 10);
  // `areaCodes` viene ordenado de mayor a menor, así que la cola son los más chicos.
  const smallestAreas = [...areaCodes].reverse().slice(0, 10);

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Panorama nacional de la numeración geográfica
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Análisis de los bloques de numeración telefónica geográfica que Enacom
          asignó a los prestadores, con los criterios del Plan Fundamental de
          Numeración Nacional. Datos al {formatDate(summary.meta.latestResolutionDate)}.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Números asignados"
          value={formatCompact(summary.assignedNumbers)}
          hint={`${formatInteger(summary.assignedNumbers)} números en bloques asignados`}
        />
        <StatCard
          label="Ocupación del espacio"
          value={formatPercent(summary.occupancy)}
          hint={`Sobre ${formatCompact(summary.totalCapacity)} números disponibles en los indicativos en uso`}
        />
        <StatCard
          label="Bloques asignados"
          value={formatInteger(summary.allocationCount)}
          hint={`${formatInteger(summary.operatorCount)} operadores distintos`}
        />
        <StatCard
          label="Códigos de área"
          value={formatInteger(summary.areaCodeCount)}
          hint={`${formatInteger(summary.localityCount)} localidades cabecera`}
        />
      </div>

      <Section
        title="Evolución de las asignaciones"
        description="Cada bloque se imputa al año de la resolución que lo asignó. La serie acumulada muestra cómo creció el uso del recurso desde 1998."
      >
        <TimelineCharts points={timeline} />
      </Section>

      <Section
        title="Concentración por operador"
        description={
          <>
            Los diez operadores con más numeración asignada sobre un total de{" "}
            {formatInteger(summary.operatorCount)}.{" "}
            <Link href="/operadores" className="underline underline-offset-2">
              Ver el ranking completo
            </Link>
            .
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <OperatorsChart
            data={topOperators.map((operator) => ({
              label: shortenOperator(operator.name),
              name: operator.name,
              assignedNumbers: operator.assignedNumbers,
            }))}
            description="Cantidad de números contenidos en los bloques asignados a cada prestador."
          />
          <TableWrapper minWidth="30rem">
            <thead>
              <tr>
                <Th>Operador</Th>
                <Th numeric>Números</Th>
                <Th numeric>Participación</Th>
              </tr>
            </thead>
            <tbody>
              {topOperators.map((operator) => (
                <tr key={operator.slug}>
                  <Td>
                    <Link
                      href={`/operadores/${operator.slug}`}
                      className="hover:underline"
                    >
                      {operator.name}
                    </Link>
                  </Td>
                  <Td numeric>{formatInteger(operator.assignedNumbers)}</Td>
                  <Td numeric>{formatPercent(operator.share)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      </Section>

      <Section
        title="Códigos de área"
        description={
          <>
            Los indicativos con mayor y menor volumen asignado, y los que tienen su
            espacio más comprometido.{" "}
            <Link href="/areas" className="underline underline-offset-2">
              Ver todos los códigos de área
            </Link>
            .
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TableWrapper minWidth="24rem">
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Mayor cantidad de números asignados
            </caption>
            <thead>
              <tr>
                <Th>Indicativo</Th>
                <Th>Localidad</Th>
                <Th numeric>Números</Th>
              </tr>
            </thead>
            <tbody>
              {topAreas.map((area) => (
                <tr key={area.areaCode}>
                  <Td>
                    <Link href={`/areas/${area.areaCode}`} className="font-mono hover:underline">
                      {area.areaCode}
                    </Link>
                  </Td>
                  <Td>{area.locality}</Td>
                  <Td numeric>{formatInteger(area.assignedNumbers)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          <TableWrapper minWidth="24rem">
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Menor cantidad de números asignados
            </caption>
            <thead>
              <tr>
                <Th>Indicativo</Th>
                <Th>Localidad</Th>
                <Th numeric>Números</Th>
              </tr>
            </thead>
            <tbody>
              {smallestAreas.map((area) => (
                <tr key={area.areaCode}>
                  <Td>
                    <Link href={`/areas/${area.areaCode}`} className="font-mono hover:underline">
                      {area.areaCode}
                    </Link>
                  </Td>
                  <Td>{area.locality}</Td>
                  <Td numeric>{formatInteger(area.assignedNumbers)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          <TableWrapper minWidth="24rem">
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Mayor ocupación del espacio disponible
            </caption>
            <thead>
              <tr>
                <Th>Indicativo</Th>
                <Th>Localidad</Th>
                <Th>Ocupación</Th>
              </tr>
            </thead>
            <tbody>
              {mostSaturated.map((area) => (
                <tr key={area.areaCode}>
                  <Td>
                    <Link href={`/areas/${area.areaCode}`} className="font-mono hover:underline">
                      {area.areaCode}
                    </Link>
                  </Td>
                  <Td>{area.locality}</Td>
                  <Td>
                    <OccupancyBar ratio={area.occupancy} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      </Section>

      <Section
        title="Espacio disponible para nuevos indicativos"
        description="Indicativos de cuatro dígitos equivalentes bajo los prefijos 2 (Interior Sur) y 3 (Interior Norte), que son los rangos que el Plan abrió para numeración geográfica."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Espacio tomado"
            value={formatInteger(summary.areaSpace.used)}
            hint={`de ${formatInteger(summary.areaSpace.total)} indicativos equivalentes`}
          />
          <StatCard
            label="Espacio libre"
            value={formatInteger(summary.areaSpace.free)}
            hint={formatPercent(summary.areaSpace.free / summary.areaSpace.total)}
          />
          <Card>
            <p className="text-sm text-ink-secondary">Numeración móvil y fija</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt>Servicios móviles</dt>
                <dd className="tabular">{formatCompact(summary.mobileNumbers)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Servicio básico</dt>
                <dd className="tabular">{formatCompact(summary.fixedNumbers)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </Section>
    </div>
  );
}

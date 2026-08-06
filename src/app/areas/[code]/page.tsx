import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DigitOccupancyChart } from "@/components/charts/digit-occupancy-chart";
import { OperatorsChart } from "@/components/charts/operators-chart";
import { TimelineCharts } from "@/components/charts/timeline-chart";
import {
  Callout,
  OccupancyBar,
  Section,
  StatCard,
  TableWrapper,
  Td,
  Th,
} from "@/components/ui";
import { getAreaCodes, getAreaCodeDetail } from "@/lib/dataset/queries";
import { blockRange } from "@/lib/numbering/capacity";
import {
  formatCompact,
  formatInteger,
  formatPercent,
  formatShortDate,
  formatSubscriberNumber,
} from "@/lib/format";

/** Cantidad de asignaciones que se listan en el detalle antes de derivar al buscador. */
const ALLOCATION_PREVIEW = 100;

export function generateStaticParams() {
  return getAreaCodes().map((area) => ({ code: area.areaCode }));
}

export async function generateMetadata({
  params,
}: PageProps<"/areas/[code]">): Promise<Metadata> {
  const { code } = await params;
  const detail = getAreaCodeDetail(code);
  if (!detail) return { title: "Código de área no encontrado" };
  return {
    title: `Código de área ${detail.areaCode} · ${detail.locality}`,
    description: `Numeración asignada en el indicativo ${detail.areaCode} (${detail.locality}): ocupación, operadores y bloques libres.`,
  };
}

export default async function AreaDetailPage({ params }: PageProps<"/areas/[code]">) {
  const { code } = await params;
  const detail = getAreaCodeDetail(code);
  if (!detail) notFound();

  const freeNumbers = detail.space.free;
  const topOperators = detail.operators.slice(0, 10);

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="text-sm text-ink-secondary">
          <Link href="/areas" className="hover:underline">
            Códigos de área
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          <span className="font-mono">{detail.areaCode}</span> · {detail.locality}
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Región {detail.region}. Los números de abonado de este indicativo tienen{" "}
          {detail.subscriberDigits} dígitos, así que el espacio útil va del{" "}
          <span className="font-mono">
            {formatSubscriberNumber("2".padEnd(detail.subscriberDigits, "0"))}
          </span>{" "}
          al{" "}
          <span className="font-mono">
            {formatSubscriberNumber("9".padEnd(detail.subscriberDigits, "9"))}
          </span>
          .
        </p>
      </header>

      {detail.childAreaCodes.length > 0 ? (
        <Callout title="Este código de área contiene a otros">
          <p>
            Los indicativos{" "}
            {detail.childAreaCodes.map((code, index) => (
              <span key={code}>
                {index > 0 ? (index === detail.childAreaCodes.length - 1 ? " y " : ", ") : null}
                <Link href={`/areas/${code}`} className="font-mono text-ink hover:underline">
                  {code}
                </Link>
                {detail.relatedLocalities[code] ? ` (${detail.relatedLocalities[code]})` : null}
              </span>
            ))}{" "}
            abren dentro del {detail.areaCode}: sus números son exactamente los de esta
            área que empiezan con{" "}
            {detail.childAreaCodes
              .map((code) => code.slice(detail.areaCode.length))
              .join(", ")}
            , porque marcar {detail.areaCode} y después ese dígito da el mismo número
            nacional.
          </p>
          <p>
            Por eso esos tramos no cuentan como espacio disponible del{" "}
            {detail.areaCode}: aparecen en gris en el gráfico y listados aparte como
            tramos cedidos.
          </p>
        </Callout>
      ) : null}

      {detail.parentAreaCode ? (
        <Callout title="Este código de área abre dentro de otro">
          <p>
            El {detail.areaCode} ocupa los números del{" "}
            <Link
              href={`/areas/${detail.parentAreaCode}`}
              className="font-mono text-ink hover:underline"
            >
              {detail.parentAreaCode}
            </Link>
            {detail.relatedLocalities[detail.parentAreaCode]
              ? ` (${detail.relatedLocalities[detail.parentAreaCode]})`
              : null}{" "}
            que empiezan con{" "}
            <span className="font-mono text-ink">
              {detail.areaCode.slice(detail.parentAreaCode.length)}
            </span>
            . Un número de esta área también se puede leer como un número del{" "}
            {detail.parentAreaCode}, así que al consultarlo pueden aparecer las dos
            lecturas.
          </p>
        </Callout>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Números asignados"
          value={formatCompact(detail.assignedNumbers)}
          hint={formatInteger(detail.assignedNumbers)}
        />
        <StatCard
          label="Sin asignar"
          value={formatCompact(freeNumbers)}
          hint={`${formatPercent(1 - detail.occupancy)} del espacio del indicativo`}
        />
        <StatCard
          label="Ocupación"
          value={formatPercent(detail.occupancy)}
          hint={`Capacidad total: ${formatCompact(detail.capacity)}`}
        />
        <StatCard
          label="Bloques asignados"
          value={formatInteger(detail.allocationCount)}
          hint={`${detail.operatorCount} operadores`}
        />
      </div>

      <Section title="Uso del espacio de numeración">
        <div className="grid gap-4 lg:grid-cols-2">
          <DigitOccupancyChart data={detail.space.byFirstDigit} />
          <div className="space-y-4">
            <TableWrapper minWidth="24rem">
              <caption className="px-4 py-3 text-left text-sm font-medium">
                Tramos sin asignar
              </caption>
              <thead>
                <tr>
                  <Th>Desde</Th>
                  <Th>Hasta</Th>
                  <Th numeric>Números</Th>
                </tr>
              </thead>
              <tbody>
                {detail.space.freeRanges.map((range) => (
                  <tr key={range.first}>
                    <Td className="font-mono">{formatSubscriberNumber(range.first)}</Td>
                    <Td className="font-mono">{formatSubscriberNumber(range.last)}</Td>
                    <Td numeric>{formatInteger(range.size)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>

            {detail.space.unavailableRanges.length > 0 ? (
              <TableWrapper minWidth="34rem">
                <caption className="px-4 py-3 text-left text-sm font-medium">
                  Tramos no asignables
                  <span className="ml-2 font-normal text-ink-secondary">
                    numeración que este código de área no puede entregar
                  </span>
                </caption>
                <thead>
                  <tr>
                    <Th>Desde</Th>
                    <Th>Hasta</Th>
                    <Th numeric>Números</Th>
                    <Th>Motivo</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.space.unavailableRanges.map((range) => (
                    <tr key={`${range.reason}-${range.first}`}>
                      <Td className="font-mono">{formatSubscriberNumber(range.first)}</Td>
                      <Td className="font-mono">{formatSubscriberNumber(range.last)}</Td>
                      <Td numeric>{formatInteger(range.size)}</Td>
                      <Td>
                        {range.reason === "reservado" ? (
                          <>
                            Reservado por el Plan (
                            <span className="font-mono">{range.detail}</span>)
                          </>
                        ) : (
                          <>
                            Pertenece al código de área{" "}
                            <Link
                              href={`/areas/${range.detail}`}
                              className="font-mono hover:underline"
                            >
                              {range.detail}
                            </Link>
                            {detail.relatedLocalities[range.detail]
                              ? ` (${detail.relatedLocalities[range.detail]})`
                              : null}
                          </>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            ) : null}
          </div>
        </div>
      </Section>

      <Section
        title="Operadores en el indicativo"
        description="Distribución de la numeración asignada entre los prestadores que operan en esta área."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <OperatorsChart
            data={topOperators.map((operator) => ({
              label:
                operator.name.length > 26
                  ? `${operator.name.slice(0, 25)}…`
                  : operator.name,
              name: operator.name,
              assignedNumbers: operator.assignedNumbers,
            }))}
            title="Numeración por operador"
            description="Los diez prestadores con más números asignados en este indicativo."
          />
          <TableWrapper minWidth="40rem">
            <thead>
              <tr>
                <Th>Operador</Th>
                <Th numeric>Bloques</Th>
                <Th numeric>Números</Th>
                <Th>Participación</Th>
              </tr>
            </thead>
            <tbody>
              {detail.operators.map((operator) => (
                <tr key={operator.slug}>
                  <Td>
                    <Link href={`/operadores/${operator.slug}`} className="hover:underline">
                      {operator.name}
                    </Link>
                  </Td>
                  <Td numeric>{formatInteger(operator.allocationCount)}</Td>
                  <Td numeric>{formatInteger(operator.assignedNumbers)}</Td>
                  <Td>
                    <OccupancyBar ratio={operator.share} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      </Section>

      <Section
        title="Evolución de las asignaciones"
        description="Bloques asignados en este indicativo por año de resolución."
      >
        <TimelineCharts points={detail.timeline} />
      </Section>

      <Section
        title="Asignaciones"
        description={
          <>
            Últimas {Math.min(ALLOCATION_PREVIEW, detail.allocations.length)} de{" "}
            {formatInteger(detail.allocationCount)} asignaciones.{" "}
            <Link
              href={`/asignaciones?areaCode=${detail.areaCode}`}
              className="underline underline-offset-2"
            >
              Ver todas con filtros
            </Link>
            .
          </>
        }
      >
        <TableWrapper minWidth="68rem">
          <thead>
            <tr>
              <Th>Bloque</Th>
              <Th>Rango</Th>
              <Th numeric>Números</Th>
              <Th>Operador</Th>
              <Th>Servicio</Th>
              <Th>Modalidad</Th>
              <Th>Resolución</Th>
              <Th numeric>Fecha</Th>
            </tr>
          </thead>
          <tbody>
            {detail.allocations.slice(0, ALLOCATION_PREVIEW).map((allocation) => {
              const range = blockRange(allocation.areaCode, allocation.block);
              return (
                <tr key={`${allocation.block}-${allocation.date}`}>
                  <Td className="font-mono">{allocation.block}</Td>
                  <Td className="font-mono text-ink-secondary">
                    {formatSubscriberNumber(range.first)} a{" "}
                    {formatSubscriberNumber(range.last)}
                  </Td>
                  <Td numeric>{formatInteger(allocation.capacity)}</Td>
                  <Td>{allocation.operator}</Td>
                  <Td>{allocation.service}</Td>
                  <Td>{allocation.modality}</Td>
                  <Td>{allocation.resolution}</Td>
                  <Td numeric>{formatShortDate(allocation.date)}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
      </Section>
    </div>
  );
}

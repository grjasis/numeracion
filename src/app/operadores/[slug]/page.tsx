import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TimelineCharts } from "@/components/charts/timeline-chart";
import { Section, StatCard, TableWrapper, Td, Th } from "@/components/ui";
import { getOperatorDetail, getOperators } from "@/lib/dataset/queries";
import { formatCompact, formatInteger, formatPercent, formatShortDate } from "@/lib/format";

/** Cantidad de asignaciones que se listan antes de derivar al buscador. */
const ALLOCATION_PREVIEW = 100;

export function generateStaticParams() {
  return getOperators().map((operator) => ({ slug: operator.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/operadores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = getOperatorDetail(slug);
  if (!detail) return { title: "Operador no encontrado" };
  return {
    title: detail.name,
    description: `Numeración geográfica asignada a ${detail.name}: bloques, códigos de área y evolución.`,
  };
}

export default async function OperatorDetailPage({
  params,
}: PageProps<"/operadores/[slug]">) {
  const { slug } = await params;
  const detail = getOperatorDetail(slug);
  if (!detail) notFound();

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="text-sm text-ink-secondary">
          <Link href="/operadores" className="hover:underline">
            Operadores
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {detail.name}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Números asignados"
          value={formatCompact(detail.assignedNumbers)}
          hint={formatInteger(detail.assignedNumbers)}
        />
        <StatCard
          label="Participación nacional"
          value={formatPercent(detail.share)}
        />
        <StatCard label="Bloques" value={formatInteger(detail.allocationCount)} />
        <StatCard
          label="Cobertura"
          value={formatInteger(detail.areaCodeCount)}
          hint={`códigos de área · ${formatInteger(detail.localityCount)} localidades`}
        />
      </div>

      <Section
        title="Presencia por código de área"
        description="Numeración asignada en cada indicativo donde el operador tiene bloques."
      >
        <TableWrapper minWidth="34rem">
          <thead>
            <tr>
              <Th>Indicativo</Th>
              <Th>Localidad</Th>
              <Th numeric>Bloques</Th>
              <Th numeric>Números</Th>
            </tr>
          </thead>
          <tbody>
            {detail.byAreaCode.map((area) => (
              <tr key={area.areaCode}>
                <Td>
                  <Link href={`/areas/${area.areaCode}`} className="font-mono hover:underline">
                    {area.areaCode}
                  </Link>
                </Td>
                <Td>{area.locality}</Td>
                <Td numeric>{formatInteger(area.allocationCount)}</Td>
                <Td numeric>{formatInteger(area.assignedNumbers)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>

      <Section
        title="Evolución de las asignaciones"
        description="Bloques obtenidos por año de resolución."
      >
        <TimelineCharts points={detail.timeline} />
      </Section>

      <Section
        title="Asignaciones"
        description={
          <>
            Últimas {Math.min(ALLOCATION_PREVIEW, detail.allocations.length)} de{" "}
            {formatInteger(detail.allocationCount)}.{" "}
            <Link
              href={`/asignaciones?operator=${encodeURIComponent(detail.name)}`}
              className="underline underline-offset-2"
            >
              Ver todas con filtros
            </Link>
            .
          </>
        }
      >
        <TableWrapper minWidth="54rem">
          <thead>
            <tr>
              <Th>Indicativo</Th>
              <Th>Bloque</Th>
              <Th numeric>Números</Th>
              <Th>Localidad</Th>
              <Th>Servicio</Th>
              <Th>Resolución</Th>
              <Th numeric>Fecha</Th>
            </tr>
          </thead>
          <tbody>
            {detail.allocations.slice(0, ALLOCATION_PREVIEW).map((allocation) => (
              <tr key={`${allocation.areaCode}-${allocation.block}`}>
                <Td className="font-mono">{allocation.areaCode}</Td>
                <Td className="font-mono">{allocation.block}</Td>
                <Td numeric>{formatInteger(allocation.capacity)}</Td>
                <Td>{allocation.locality}</Td>
                <Td>{allocation.service}</Td>
                <Td>{allocation.resolution}</Td>
                <Td numeric>{formatShortDate(allocation.date)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>
    </div>
  );
}

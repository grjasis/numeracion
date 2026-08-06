import type { Metadata } from "next";
import Link from "next/link";

import { OperatorsChart } from "@/components/charts/operators-chart";
import { OccupancyBar, Section, StatCard, TableWrapper, Td, Th } from "@/components/ui";
import { getNationalSummary, getOperators } from "@/lib/dataset/queries";
import { formatCompact, formatInteger, formatShortDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Operadores",
  description:
    "Ranking de prestadores por cantidad de numeración geográfica asignada por Enacom.",
};

export default function OperatorsPage() {
  const operators = getOperators();
  const summary = getNationalSummary();

  const topTen = operators.slice(0, 10);
  const topTenShare = topTen.reduce((sum, operator) => sum + operator.share, 0);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Operadores</h1>
        <p className="max-w-3xl text-ink-secondary">
          Prestadores con numeración geográfica asignada. La participación se
          calcula sobre la cantidad de números contenidos en los bloques, no sobre
          la cantidad de bloques: un bloque puede valer 100, 1.000 o 10.000 números
          según su longitud.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Operadores" value={formatInteger(operators.length)} />
        <StatCard
          label="Concentración top 10"
          value={`${Math.round(topTenShare * 100)}%`}
          hint="Participación de los diez primeros en el total nacional"
        />
        <StatCard
          label="Números asignados"
          value={formatCompact(summary.assignedNumbers)}
        />
      </div>

      <Section title="Los diez primeros">
        <OperatorsChart
          data={topTen.map((operator) => ({
            label:
              operator.name.length > 30 ? `${operator.name.slice(0, 29)}…` : operator.name,
            name: operator.name,
            assignedNumbers: operator.assignedNumbers,
          }))}
          description="Cantidad de números contenidos en los bloques asignados a cada prestador."
        />
      </Section>

      <Section
        title="Todos los operadores"
        description="Ordenados por cantidad de números asignados."
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Operador</Th>
              <Th numeric>Bloques</Th>
              <Th numeric>Números</Th>
              <Th>Participación</Th>
              <Th numeric>Códigos de área</Th>
              <Th numeric>Localidades</Th>
              <Th numeric>Última asignación</Th>
            </tr>
          </thead>
          <tbody>
            {operators.map((operator) => (
              <tr key={operator.slug}>
                <Td>
                  <Link
                    href={`/operadores/${operator.slug}`}
                    className="font-medium hover:underline"
                  >
                    {operator.name}
                  </Link>
                </Td>
                <Td numeric>{formatInteger(operator.allocationCount)}</Td>
                <Td numeric>{formatInteger(operator.assignedNumbers)}</Td>
                <Td>
                  <OccupancyBar ratio={operator.share} />
                </Td>
                <Td numeric>{operator.areaCodeCount}</Td>
                <Td numeric>{operator.localityCount}</Td>
                <Td numeric>{formatShortDate(operator.lastAssignedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>
    </div>
  );
}

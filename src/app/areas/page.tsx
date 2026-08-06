import type { Metadata } from "next";

import { AreaCodesTable } from "@/components/area-codes-table";
import { Section, StatCard, TableWrapper, Td, Th } from "@/components/ui";
import { getAreaCodes, getNationalSummary } from "@/lib/dataset/queries";
import { formatCompact, formatInteger } from "@/lib/format";

export const metadata: Metadata = {
  title: "Códigos de área",
  description:
    "Listado de indicativos interurbanos con su ocupación, cantidad de bloques asignados y espacio libre.",
};

export default function AreasPage() {
  const areas = getAreaCodes();
  const summary = getNationalSummary();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Códigos de área
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Cada indicativo interurbano define un espacio de numeración propio: junto
          con el número de abonado suma siempre diez dígitos, por lo que un
          indicativo de dos dígitos tiene diez veces más capacidad que uno de tres.
          Cuando un indicativo más largo abre dentro de otro —el 2982 dentro del
          298—, los números que se lleva figuran en la columna «cedido» y no cuentan
          como capacidad del más corto.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Indicativos en uso" value={formatInteger(areas.length)} />
        <StatCard
          label="Capacidad total"
          value={formatCompact(summary.totalCapacity)}
          hint="Números disponibles en los indicativos en uso"
        />
        <StatCard
          label="Asignado"
          value={formatCompact(summary.assignedNumbers)}
        />
        <StatCard
          label="Sin asignar"
          value={formatCompact(summary.totalCapacity - summary.assignedNumbers)}
          hint="Números todavía libres en indicativos abiertos"
        />
      </div>

      <Section
        title="Todos los indicativos"
        description="Ordenados por indicativo. Hacé clic en cualquier encabezado para ordenar por esa columna y de nuevo para invertir el orden; el indicativo lleva al detalle."
      >
        <AreaCodesTable areas={areas} />
      </Section>

      <Section
        title="Indicativos sin abrir"
        description="Tramos de cuatro dígitos bajo los prefijos 2 y 3 que todavía no fueron asignados a ninguna localidad. Un indicativo corto ocupa todo su tramo: el 221 de La Plata bloquea el 2210 al 2219."
      >
        <TableWrapper minWidth="48rem">
          <thead>
            <tr>
              <Th>Prefijo</Th>
              <Th>Región</Th>
              <Th numeric>Libres</Th>
              <Th>Indicativos disponibles</Th>
            </tr>
          </thead>
          <tbody>
            {summary.areaSpace.freeByPrefix.map((group) => (
              <tr key={group.prefix}>
                <Td className="font-mono">{group.prefix}</Td>
                <Td>{group.region}</Td>
                <Td numeric>{group.codes.length}</Td>
                <Td className="font-mono text-ink-secondary">
                  {group.codes.join(" · ")}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>
    </div>
  );
}

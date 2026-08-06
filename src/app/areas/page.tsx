import type { Metadata } from "next";
import Link from "next/link";

import { OccupancyBar, Section, StatCard, TableWrapper, Td, Th } from "@/components/ui";
import { getAreaCodes, getNationalSummary } from "@/lib/dataset/queries";
import { formatCompact, formatInteger, formatShortDate } from "@/lib/format";

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
        description="Ordenados por cantidad de números asignados. Hacé clic en un indicativo para ver su detalle."
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Indicativo</Th>
              <Th>Localidad cabecera</Th>
              <Th>Región</Th>
              <Th numeric>Dígitos de abonado</Th>
              <Th numeric>Bloques</Th>
              <Th numeric>Asignados</Th>
              <Th numeric>Sin asignar</Th>
              <Th>Ocupación</Th>
              <Th numeric>Operadores</Th>
              <Th numeric>Última asignación</Th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.areaCode}>
                <Td>
                  <Link
                    href={`/areas/${area.areaCode}`}
                    className="font-mono font-medium hover:underline"
                  >
                    {area.areaCode}
                  </Link>
                </Td>
                <Td>{area.locality}</Td>
                <Td>{area.region}</Td>
                <Td numeric>{area.subscriberDigits}</Td>
                <Td numeric>{formatInteger(area.allocationCount)}</Td>
                <Td numeric>{formatInteger(area.assignedNumbers)}</Td>
                <Td numeric>{formatInteger(area.capacity - area.assignedNumbers)}</Td>
                <Td>
                  <OccupancyBar ratio={area.occupancy} />
                </Td>
                <Td numeric>{area.operatorCount}</Td>
                <Td numeric>{formatShortDate(area.lastAssignedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>

      <Section
        title="Indicativos sin abrir"
        description="Tramos de cuatro dígitos bajo los prefijos 2 y 3 que todavía no fueron asignados a ninguna localidad. Un indicativo corto ocupa todo su tramo: el 221 de La Plata bloquea el 2210 al 2219."
      >
        <TableWrapper>
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

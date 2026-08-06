"use client";

import Link from "next/link";

import { SortableTable, type SortableColumn } from "./sortable-table";
import { OccupancyBar } from "./ui";
import type { AreaCodeStats } from "@/lib/dataset/queries";
import { formatInteger, formatShortDate } from "@/lib/format";

/**
 * Listado de indicativos, ordenable por cualquier columna.
 *
 * Arranca por indicativo ascendente y en orden lexicográfico, no numérico: así
 * cada indicativo queda al lado de los que abren dentro de él —el 2982 y el 2983
 * inmediatamente después del 298— que es como se lee el espacio de numeración.
 */
const columns: Array<SortableColumn<AreaCodeStats>> = [
  {
    key: "areaCode",
    header: "Indicativo",
    sortValue: (area) => area.areaCode,
    render: (area) => (
      <Link
        href={`/areas/${area.areaCode}`}
        className="font-mono font-medium hover:underline"
      >
        {area.areaCode}
      </Link>
    ),
  },
  {
    key: "locality",
    header: "Localidad cabecera",
    sortValue: (area) => area.locality,
    render: (area) => area.locality,
  },
  {
    key: "region",
    header: "Región",
    sortValue: (area) => area.region,
    render: (area) => area.region,
  },
  {
    key: "subscriberDigits",
    header: "Dígitos de abonado",
    numeric: true,
    sortValue: (area) => area.subscriberDigits,
    render: (area) => area.subscriberDigits,
  },
  {
    key: "allocationCount",
    header: "Bloques",
    numeric: true,
    sortValue: (area) => area.allocationCount,
    render: (area) => formatInteger(area.allocationCount),
  },
  {
    key: "assignedNumbers",
    header: "Asignados",
    numeric: true,
    sortValue: (area) => area.assignedNumbers,
    render: (area) => formatInteger(area.assignedNumbers),
  },
  {
    key: "freeNumbers",
    header: "Sin asignar",
    numeric: true,
    sortValue: (area) => area.capacity - area.assignedNumbers,
    render: (area) => formatInteger(area.capacity - area.assignedNumbers),
  },
  {
    key: "cededNumbers",
    header: "Cedido",
    numeric: true,
    sortValue: (area) => area.cededNumbers,
    render: (area) =>
      area.cededNumbers > 0 ? formatInteger(area.cededNumbers) : "—",
  },
  {
    key: "occupancy",
    header: "Ocupación",
    sortValue: (area) => area.occupancy,
    render: (area) => <OccupancyBar ratio={area.occupancy} />,
  },
  {
    key: "operatorCount",
    header: "Operadores",
    numeric: true,
    sortValue: (area) => area.operatorCount,
    render: (area) => area.operatorCount,
  },
  {
    key: "lastAssignedAt",
    header: "Última asignación",
    numeric: true,
    sortValue: (area) => area.lastAssignedAt,
    render: (area) => formatShortDate(area.lastAssignedAt),
  },
];

export function AreaCodesTable({ areas }: { areas: AreaCodeStats[] }) {
  return (
    <SortableTable
      rows={areas}
      columns={columns}
      initialSort={{ key: "areaCode", direction: "asc" }}
      minWidth="70rem"
      rowKey={(area) => area.areaCode}
    />
  );
}

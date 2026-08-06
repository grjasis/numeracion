import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, Section, TableWrapper, Td, Th } from "@/components/ui";
import {
  getFilterOptions,
  searchAllocations,
  type AllocationFilters,
} from "@/lib/dataset/queries";
import { blockRange } from "@/lib/numbering/capacity";
import { formatInteger, formatShortDate, formatSubscriberNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Asignaciones",
  description:
    "Buscador de todas las asignaciones de numeración geográfica publicadas por Enacom.",
};

const PAGE_SIZE = 50;

/** Toma el primer valor de un parámetro de búsqueda, ignorando los vacíos. */
function firstValue(value: string | string[] | undefined): string | undefined {
  const result = Array.isArray(value) ? value[0] : value;
  return result?.trim() || undefined;
}

/** Arma el href de una página conservando los filtros activos. */
function pageHref(filters: AllocationFilters, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/asignaciones?${query}` : "/asignaciones";
}

export default async function AllocationsPage({
  searchParams,
}: PageProps<"/asignaciones">) {
  const resolved = await searchParams;
  const filters: AllocationFilters = {
    areaCode: firstValue(resolved.areaCode),
    operator: firstValue(resolved.operator),
    locality: firstValue(resolved.locality),
    service: firstValue(resolved.service),
    modality: firstValue(resolved.modality),
    query: firstValue(resolved.query),
  };
  const page = Number(firstValue(resolved.page) ?? "1") || 1;
  const result = searchAllocations(filters, page, PAGE_SIZE);
  const options = getFilterOptions();
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Asignaciones
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Todas las asignaciones de bloques de numeración geográfica publicadas por
          Enacom, con la resolución que las respalda.
        </p>
      </header>

      {/* Los filtros son un formulario GET: cada búsqueda queda en la URL y se puede compartir. */}
      <form
        method="get"
        action="/asignaciones"
        className="grid gap-3 rounded-lg border border-hairline bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="flex flex-col gap-1 text-sm lg:col-span-2">
          <span className="text-ink-secondary">Búsqueda libre</span>
          <input
            type="search"
            name="query"
            defaultValue={filters.query ?? ""}
            placeholder="Operador, localidad, bloque o resolución"
            className="rounded-md border border-hairline bg-page px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-secondary">Código de área</span>
          <select
            name="areaCode"
            defaultValue={filters.areaCode ?? ""}
            className="rounded-md border border-hairline bg-page px-3 py-2"
          >
            <option value="">Todos</option>
            {options.areaCodes.map((area) => (
              <option key={area.areaCode} value={area.areaCode}>
                {area.areaCode} · {area.locality}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-secondary">Servicio</span>
          <select
            name="service"
            defaultValue={filters.service ?? ""}
            className="rounded-md border border-hairline bg-page px-3 py-2"
          >
            <option value="">Todos</option>
            {options.services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-secondary">Modalidad</span>
          <select
            name="modality"
            defaultValue={filters.modality ?? ""}
            className="rounded-md border border-hairline bg-page px-3 py-2"
          >
            <option value="">Todas</option>
            {options.modalities.map((modality) => (
              <option key={modality} value={modality}>
                {modality}
              </option>
            ))}
          </select>
        </label>
        {/* El operador llega por enlace desde su ficha; se conserva al filtrar. */}
        {filters.operator ? (
          <input type="hidden" name="operator" value={filters.operator} />
        ) : null}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-md bg-series-1 px-4 py-2 text-sm font-medium text-white"
          >
            Filtrar
          </button>
          {hasFilters ? (
            <Link
              href="/asignaciones"
              className="rounded-md border border-hairline px-4 py-2 text-sm"
            >
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>

      {filters.operator ? (
        <p className="text-sm text-ink-secondary">
          Filtrado por operador: <strong>{filters.operator}</strong>
        </p>
      ) : null}

      <Section
        title={`${formatInteger(result.total)} asignaciones`}
        description={`Página ${result.page} de ${result.pageCount}, ordenadas de la resolución más reciente a la más antigua.`}
      >
        {result.items.length === 0 ? (
          <EmptyState>No hay asignaciones que coincidan con los filtros.</EmptyState>
        ) : (
          <TableWrapper minWidth="76rem">
            <thead>
              <tr>
                <Th>Indicativo</Th>
                <Th>Bloque</Th>
                <Th>Rango</Th>
                <Th numeric>Números</Th>
                <Th>Operador</Th>
                <Th>Localidad</Th>
                <Th>Servicio</Th>
                <Th>Modalidad</Th>
                <Th>Resolución</Th>
                <Th numeric>Fecha</Th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((allocation) => {
                const range = blockRange(allocation.areaCode, allocation.block);
                return (
                  <tr key={`${allocation.areaCode}-${allocation.block}`}>
                    <Td>
                      <Link
                        href={`/areas/${allocation.areaCode}`}
                        className="font-mono hover:underline"
                      >
                        {allocation.areaCode}
                      </Link>
                    </Td>
                    <Td className="font-mono">{allocation.block}</Td>
                    <Td className="font-mono text-ink-secondary">
                      {formatSubscriberNumber(range.first)} a{" "}
                      {formatSubscriberNumber(range.last)}
                    </Td>
                    <Td numeric>{formatInteger(allocation.capacity)}</Td>
                    <Td>{allocation.operator}</Td>
                    <Td>{allocation.locality}</Td>
                    <Td>{allocation.service}</Td>
                    <Td>{allocation.modality}</Td>
                    <Td>{allocation.resolution}</Td>
                    <Td numeric>{formatShortDate(allocation.date)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        )}

        <nav
          aria-label="Paginación"
          className="flex items-center justify-between gap-4 text-sm"
        >
          {result.page > 1 ? (
            <Link
              href={pageHref(filters, result.page - 1)}
              className="rounded-md border border-hairline px-4 py-2"
            >
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-secondary">
            {formatInteger((result.page - 1) * result.pageSize + 1)} a{" "}
            {formatInteger(
              Math.min(result.page * result.pageSize, result.total),
            )}{" "}
            de {formatInteger(result.total)}
          </span>
          {result.page < result.pageCount ? (
            <Link
              href={pageHref(filters, result.page + 1)}
              className="rounded-md border border-hairline px-4 py-2"
            >
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </Section>
    </div>
  );
}

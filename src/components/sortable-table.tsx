"use client";

import { useMemo, useState, type ReactNode } from "react";

import { TableWrapper, Td } from "./ui";

/**
 * Tabla ordenable por columna.
 *
 * Las columnas llevan funciones de render y de comparación, así que sólo pueden
 * declararse dentro de un componente cliente: una función no viaja desde el
 * servidor. El componente de página arma las filas —datos planos, serializables—
 * y el componente cliente que lo envuelve define las columnas.
 */

export type SortableColumn<T> = {
  /** Identificador único de la columna. */
  key: string;
  header: ReactNode;
  /** Alinea a la derecha y usa cifras tabulares. */
  numeric?: boolean;
  /**
   * Valor por el que se ordena. Los textos se comparan con `localeCompare` en
   * es-AR para que los acentos no manden las localidades al final.
   */
  sortValue: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
};

export type SortState = { key: string; direction: "asc" | "desc" };

const collator = new Intl.Collator("es-AR", { sensitivity: "base" });

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

/** Flecha del encabezado. La columna activa además queda en tinta primaria. */
function SortArrow({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span aria-hidden className="text-xs">
      {direction === "asc" ? "▲" : direction === "desc" ? "▼" : "↕"}
    </span>
  );
}

export function SortableTable<T>({
  rows,
  columns,
  initialSort,
  minWidth,
  rowKey,
}: {
  rows: T[];
  columns: Array<SortableColumn<T>>;
  initialSort: SortState;
  minWidth?: string;
  rowKey: (row: T) => string;
}) {
  const [sort, setSort] = useState<SortState>(initialSort);

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) => sign * compare(column.sortValue(a), column.sortValue(b)),
    );
  }, [rows, columns, sort]);

  // Un primer clic ordena de mayor a menor en las columnas numéricas y de la A a
  // la Z en las de texto, que es lo que se busca en cada caso; el segundo clic
  // invierte.
  function toggle(column: SortableColumn<T>) {
    setSort((current) =>
      current.key === column.key
        ? { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key: column.key, direction: column.numeric ? "desc" : "asc" },
    );
  }

  return (
    <TableWrapper minWidth={minWidth}>
      <thead>
        <tr>
          {columns.map((column) => {
            const active = column.key === sort.key;
            const direction = active ? sort.direction : null;
            return (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  active
                    ? direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className={`whitespace-nowrap border-b border-hairline p-0 text-xs font-medium uppercase tracking-wide ${
                  active ? "text-ink" : "text-ink-muted"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(column)}
                  className={`flex w-full items-center gap-1.5 px-4 py-3 hover:text-ink ${
                    column.numeric ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{column.header}</span>
                  <SortArrow direction={direction} />
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <Td
                key={column.key}
                numeric={column.numeric}
                className={column.className}
              >
                {column.render(row)}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

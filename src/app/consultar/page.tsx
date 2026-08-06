import type { Metadata } from "next";
import Link from "next/link";

import { Callout, Card, Section, TableWrapper, Td, Th } from "@/components/ui";
import { lookupNumber, toSlug, type NumberMatch } from "@/lib/dataset/queries";
import { formatNational } from "@/lib/numbering/parse";
import type { ParseFailure } from "@/lib/numbering/parse";
import { formatDate, formatInteger, formatSubscriberNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Consultar un número",
  description:
    "Averiguá a qué bloque de numeración pertenece un número telefónico argentino y qué operador lo tiene asignado.",
};

/** Números de ejemplo que muestran los formatos aceptados. */
const EXAMPLES = ["011 4321-5678", "+54 9 223 480-1234", "0351 15 456-7890", "2657440123"];

const FAILURE_MESSAGES: Record<ParseFailure, string> = {
  vacio: "Escribí un número para consultar.",
  "sin-digitos": "No encontramos ningún dígito en lo que escribiste.",
  "muy-corto":
    "El número quedó corto. Un número nacional tiene diez dígitos contando el código de área, sin el 0 ni el 15.",
  "muy-largo":
    "El número quedó largo. Un número nacional tiene diez dígitos contando el código de área.",
  "indicativo-desconocido":
    "No reconocimos el código de área, o el número de abonado empieza con 0 o con 1, dígitos que el Plan no permite.",
};

/** Toma el primer valor de un parámetro de búsqueda. */
function firstValue(value: string | string[] | undefined): string {
  const result = Array.isArray(value) ? value[0] : value;
  return result?.trim() ?? "";
}

/** Tarjeta con el resultado de una interpretación del número. */
function MatchCard({ match }: { match: NumberMatch }) {
  const { allocation } = match;

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-2xl font-semibold tracking-tight">
          {formatNational(match.areaCode, match.subscriberNumber)}
        </p>
        <p className="text-sm text-ink-secondary">
          Código de área{" "}
          <Link href={`/areas/${match.areaCode}`} className="font-mono hover:underline">
            {match.areaCode}
          </Link>
          {match.locality ? ` · ${match.locality}` : null}
        </p>
      </div>

      {allocation ? (
        <>
          <p className="mt-4 text-sm text-ink-secondary">
            El número cae dentro del bloque{" "}
            <span className="font-mono text-ink">{allocation.block}</span>, asignado a:
          </p>
          <p className="mt-1 text-lg font-semibold">
            <Link
              href={`/operadores/${toSlug(allocation.operator)}`}
              className="hover:underline"
            >
              {allocation.operator}
            </Link>
          </p>

          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-secondary">Servicio</dt>
              <dd>{allocation.service}</dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Modalidad</dt>
              <dd>{allocation.modality}</dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Resolución</dt>
              <dd>{allocation.resolution}</dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Fecha de asignación</dt>
              <dd>{formatDate(allocation.date)}</dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Tamaño del bloque</dt>
              <dd className="tabular">{formatInteger(allocation.capacity)} números</dd>
            </div>
            {match.blockRange ? (
              <div>
                <dt className="text-ink-secondary">Rango que abarca</dt>
                <dd className="font-mono">
                  {formatSubscriberNumber(match.blockRange.first)} a{" "}
                  {formatSubscriberNumber(match.blockRange.last)}
                </dd>
              </div>
            ) : null}
          </dl>
        </>
      ) : match.unassignedReason === "reservado" ? (
        <p className="mt-4 text-sm text-ink-secondary">
          Este número cae en el tramo <span className="font-mono text-ink">911</span>,
          reservado para el número único de emergencias. El Plan no permite asignarlo
          a ningún abonado, así que no puede existir como línea.
        </p>
      ) : (
        <p className="mt-4 text-sm text-ink-secondary">
          El código de área existe, pero{" "}
          <strong className="text-ink">ningún bloque asignado contiene este número</strong>.
          Es numeración que Enacom todavía no entregó a ningún prestador, por lo que no
          debería corresponder a una línea en servicio.
        </p>
      )}
    </Card>
  );
}

export default async function LookupPage({ searchParams }: PageProps<"/consultar">) {
  const resolved = await searchParams;
  const input = firstValue(resolved.numero);
  const result = input ? lookupNumber(input) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Consultar un número
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Escribí un número telefónico argentino con su código de área y te decimos a
          qué bloque de numeración pertenece y qué operador lo tiene asignado. Podés
          escribirlo como quieras: con 0, con 15, con +54, con guiones o todo junto.
        </p>
      </header>

      <form
        method="get"
        action="/consultar"
        className="rounded-lg border border-hairline bg-surface p-5"
      >
        <label htmlFor="numero" className="text-sm text-ink-secondary">
          Número con código de área
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          <input
            id="numero"
            name="numero"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={input}
            placeholder="011 4321-5678"
            className="min-w-0 flex-1 rounded-md border border-hairline bg-page px-3 py-2 font-mono text-lg"
          />
          <button
            type="submit"
            className="rounded-md bg-series-1 px-5 py-2 text-sm font-medium text-white"
          >
            Consultar
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-secondary">
          Ejemplos:{" "}
          {EXAMPLES.map((example, index) => (
            <span key={example}>
              {index > 0 ? " · " : null}
              <Link
                href={`/consultar?numero=${encodeURIComponent(example)}`}
                className="font-mono underline underline-offset-2"
              >
                {example}
              </Link>
            </span>
          ))}
        </p>
      </form>

      {result && !result.ok ? (
        <Callout title="No pudimos interpretar el número" tone="warning">
          <p>{FAILURE_MESSAGES[result.reason]}</p>
          {result.digits ? (
            <p>
              Leímos estos dígitos:{" "}
              <span className="font-mono text-ink">{result.digits}</span>.
            </p>
          ) : null}
        </Callout>
      ) : null}

      {result?.ok ? (
        <Section
          title={
            result.matches.length > 1
              ? "El número admite más de una lectura"
              : "Resultado"
          }
          description={
            result.matches.length > 1 ? (
              <>
                Existen códigos de área que son prefijo de otros —por ejemplo el 298 y
                el 2982—, así que este número se puede partir de más de una manera y
                todas respetan el Plan. Mostramos todas las lecturas posibles.
              </>
            ) : undefined
          }
        >
          <div className="space-y-4">
            {result.matches.map((match) => (
              <MatchCard key={match.national} match={match} />
            ))}
          </div>
        </Section>
      ) : null}

      {result?.ok && result.matches.some((match) => match.allocation) ? (
        <Callout title="Qué significa y qué no significa este resultado" tone="warning">
          <p>
            <strong className="text-ink">
              No quiere decir que el número esté activo.
            </strong>{" "}
            La base registra qué numeración le entregó Enacom a cada prestador, no qué
            líneas están dadas de alta. Un bloque asignado puede estar usado en parte, o
            no estar usado en absoluto.
          </p>
          <p>
            <strong className="text-ink">
              Tampoco quiere decir que hoy pertenezca a ese operador.
            </strong>{" "}
            Con la portabilidad numérica, una persona puede cambiar de prestador
            conservando su número. El bloque indica a quién se le asignó originalmente
            la numeración, no quién presta el servicio en este momento. Para saber eso
            hay que consultar la base de portabilidad, que es otra cosa y no es pública.
          </p>
          <p>
            Los datos corresponden a la última publicación de Enacom procesada. Los
            criterios de interpretación están en la{" "}
            <Link href="/metodologia" className="underline underline-offset-2">
              metodología
            </Link>
            .
          </p>
        </Callout>
      ) : null}

      {!result ? (
        <TableWrapper minWidth="30rem">
          <caption className="px-4 py-3 text-left text-sm font-medium">
            Formatos que se aceptan
          </caption>
          <thead>
            <tr>
              <Th>Cómo lo escribís</Th>
              <Th>Cómo se interpreta</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td className="font-mono">011 4321-5678</Td>
              <Td>Se descarta el 0 de larga distancia</Td>
            </tr>
            <tr>
              <Td className="font-mono">+54 9 223 480-1234</Td>
              <Td>Se descartan el código de país y el 9 de móvil</Td>
            </tr>
            <tr>
              <Td className="font-mono">0351 15 456-7890</Td>
              <Td>Se descartan el 0 y el 15 de «abonado llamante paga»</Td>
            </tr>
            <tr>
              <Td className="font-mono">2657440123</Td>
              <Td>Número nacional de diez dígitos, tal cual</Td>
            </tr>
          </tbody>
        </TableWrapper>
      ) : null}
    </div>
  );
}

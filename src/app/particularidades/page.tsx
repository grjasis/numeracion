import type { Metadata } from "next";
import Link from "next/link";

import { Callout, Card, Section, StatCard, TableWrapper, Td, Th } from "@/components/ui";
import { getCuriosities, getNationalSummary } from "@/lib/dataset/queries";
import { formatDate, formatInteger } from "@/lib/format";

export const metadata: Metadata = {
  title: "Particularidades",
  description:
    "Rarezas de la numeración geográfica argentina: códigos de área que son prefijo de otros, bloques de tamaños distintos, el 911 ausente y otros casos límite.",
};

export default function CuriositiesPage() {
  const curiosities = getCuriosities();
  const summary = getNationalSummary();

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Particularidades
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Casos límite y rarezas que aparecen al cruzar la base de Enacom con el Plan
          Fundamental de Numeración. Todo lo que sigue está calculado sobre los datos
          publicados: no hay nada escrito a mano.
        </p>
      </header>

      <Section
        title="Códigos de área que son prefijo de otro"
        description={`${curiosities.nestedAreaCodes.length} indicativos cortos conviven con otros más largos que empiezan igual, y entre unos y otros suman ${curiosities.nestedAreaCodeCount} códigos de área.`}
      >
        <Callout title="Por qué importa">
          <p>
            El indicativo <span className="font-mono text-ink">298</span> es General
            Roca y el <span className="font-mono text-ink">2982</span> es otra
            localidad. Como el Plan admite indicativos de dos, tres y cuatro dígitos,
            un número de diez dígitos que arranque con 2982 se puede partir de dos
            maneras y las dos respetan la longitud total.
          </p>
          <p>
            Lo que desempata es el número de abonado: no puede empezar con 0 ni con 1,
            y tiene que caer dentro de un bloque efectivamente asignado. Por eso la{" "}
            <Link href="/consultar" className="underline underline-offset-2">
              consulta de un número
            </Link>{" "}
            muestra todas las lecturas posibles en vez de elegir una por su cuenta.
          </p>
          <p>
            La otra consecuencia es de capacidad: los números del 298 que empiezan con
            2 <strong className="text-ink">son</strong> los del 2982, no un espacio
            aparte. El tablero los descuenta de la capacidad del indicativo corto y los
            muestra como tramos cedidos, para no contar dos veces la misma numeración.
          </p>
          <p>
            El reparto no siempre es total. En el 264 (San Juan) conviven bloques
            propios que empiezan con 6 y el indicativo 2646 (San Agustín del Valle
            Fértil), que ocupa el resto de ese mismo tramo. Al revisar la base no hay
            un solo número que quede asignado a dos áreas a la vez: Enacom coordina el
            reparto dentro del espacio compartido.
          </p>
        </Callout>

        <TableWrapper minWidth="46rem">
          <thead>
            <tr>
              <Th>Indicativo corto</Th>
              <Th>Localidad</Th>
              <Th numeric>Contiene</Th>
              <Th>Indicativos más largos que empiezan igual</Th>
            </tr>
          </thead>
          <tbody>
            {curiosities.nestedAreaCodes.map((entry) => (
              <tr key={entry.parent}>
                <Td>
                  <Link
                    href={`/areas/${entry.parent}`}
                    className="font-mono font-medium hover:underline"
                  >
                    {entry.parent}
                  </Link>
                </Td>
                <Td>{entry.parentLocality}</Td>
                <Td numeric>{entry.children.length}</Td>
                <Td>
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {entry.children.map((child) => (
                      <Link
                        key={child.areaCode}
                        href={`/areas/${child.areaCode}`}
                        className="font-mono hover:underline"
                        title={child.locality}
                      >
                        {child.areaCode}
                      </Link>
                    ))}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>

      <Section
        title="El 911 es el único bloque que falta"
        description="Existen asignaciones que arrancan con 910, 912, 913 y así hasta el 919. El 911 no aparece en ningún indicativo del país."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Card>
            <p className="text-sm text-ink-secondary">
              La reserva del 911 no figura en el texto original de 1997, pero la base
              la respeta sin excepciones. Es la comprobación empírica de que ningún
              número local puede empezar con esa combinación: si existiera, marcarlo
              chocaría con el número único de emergencias.
            </p>
            <p className="mt-3 text-sm text-ink-secondary">
              En cada indicativo eso deja un hueco permanente en el espacio de
              numeración, que este tablero descuenta de la capacidad.
            </p>
          </Card>

          <Card>
            <p className="text-sm text-ink-secondary">
              Bloques de tres dígitos que arrancan con 91, y en cuántos indicativos
              aparece cada uno:
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {["910", "911", "912", "913", "914", "915", "916", "917", "918", "919"].map(
                (block) => {
                  const found = curiosities.blocksNear911.find((b) => b.block === block);
                  return (
                    <li
                      key={block}
                      className={`rounded-md border p-3 text-center ${
                        found
                          ? "border-hairline"
                          : "border-warning border-dashed bg-page"
                      }`}
                    >
                      <p className="font-mono text-lg">{block}</p>
                      <p className="mt-1 text-xs text-ink-secondary">
                        {found ? `${found.areaCodes} indicativos` : "sin asignar"}
                      </p>
                    </li>
                  );
                },
              )}
            </ul>
          </Card>
        </div>
      </Section>

      <Section
        title="Los bloques no son todos del mismo tamaño"
        description="El Plan habla de asignaciones mínimas de 1.000 números y de características de central de 10.000. En la práctica también hay bloques de 100."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TableWrapper minWidth="30rem">
            <thead>
              <tr>
                <Th numeric>Números por bloque</Th>
                <Th numeric>Bloques</Th>
                <Th numeric>Números totales</Th>
                <Th numeric>Del total</Th>
              </tr>
            </thead>
            <tbody>
              {curiosities.blockSizes.map((entry) => (
                <tr key={entry.size}>
                  <Td numeric className="font-mono">
                    {formatInteger(entry.size)}
                  </Td>
                  <Td numeric>{formatInteger(entry.blocks)}</Td>
                  <Td numeric>{formatInteger(entry.numbers)}</Td>
                  <Td numeric>
                    {Math.round((entry.numbers / summary.assignedNumbers) * 100)}%
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          <Card>
            <h3 className="text-sm font-semibold">De qué depende el tamaño</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              No es un atributo del bloque sino una consecuencia de la aritmética del
              Plan: el bloque ocupa los dígitos que le sobran al indicativo, y los que
              quedan libres hasta llegar a diez son los números que contiene.
            </p>
            <p className="mt-3 text-sm text-ink-secondary">
              Los bloques de 100 números son asignaciones más finas que el mínimo que
              menciona el Plan. Es coherente con la previsión de compartir una
              característica de central entre varios prestadores cuando la demanda de
              una localidad es chica, aunque conviene confirmar el criterio con
              Enacom antes de darlo por sentado.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Longitud de los códigos de área">
        <div className="grid gap-4 sm:grid-cols-3">
          {curiosities.areaCodeLengths.map((entry) => (
            <StatCard
              key={entry.length}
              label={`Indicativos de ${entry.length} dígitos`}
              value={formatInteger(entry.count)}
              hint={
                entry.example
                  ? `Por ejemplo ${entry.example} · abonados de ${10 - entry.length} dígitos`
                  : undefined
              }
            />
          ))}
        </div>
        <p className="text-sm text-ink-secondary">
          El <span className="font-mono">11</span> es el único indicativo de dos
          dígitos del país, herencia de la migración de 1999: al AMBA se le antepuso
          un 1 al viejo indicativo 1. Eso le deja ocho dígitos de número de abonado y
          diez veces la capacidad de cualquier otro código de área.
        </p>
      </Section>

      <Section title="Extremos de competencia">
        <div className="grid gap-4 lg:grid-cols-2">
          {curiosities.mostCompetitiveArea ? (
            <Card>
              <h3 className="text-sm font-semibold">Dónde hay más prestadores</h3>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {curiosities.mostCompetitiveArea.operatorCount}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                operadores con numeración asignada en el{" "}
                <Link
                  href={`/areas/${curiosities.mostCompetitiveArea.areaCode}`}
                  className="font-mono hover:underline"
                >
                  {curiosities.mostCompetitiveArea.areaCode}
                </Link>{" "}
                ({curiosities.mostCompetitiveArea.locality}).
              </p>
            </Card>
          ) : null}

          <TableWrapper minWidth="26rem">
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Indicativos con menos prestadores
            </caption>
            <thead>
              <tr>
                <Th>Indicativo</Th>
                <Th>Localidad</Th>
                <Th numeric>Operadores</Th>
              </tr>
            </thead>
            <tbody>
              {curiosities.leastCompetitiveAreas.map((area) => (
                <tr key={area.areaCode}>
                  <Td>
                    <Link href={`/areas/${area.areaCode}`} className="font-mono hover:underline">
                      {area.areaCode}
                    </Link>
                  </Td>
                  <Td>{area.locality}</Td>
                  <Td numeric>{area.operatorCount}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      </Section>

      <Section title="Cola larga de operadores">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Operadores con una sola asignación"
            value={formatInteger(curiosities.singleAllocationOperators)}
            hint={`de ${formatInteger(summary.operatorCount)} razones sociales en la base`}
          />
          <Card>
            <p className="text-sm text-ink-secondary">
              Casi la mitad de los prestadores aparece una sola vez. Son en general
              cooperativas y empresas locales que recibieron un único bloque para su
              localidad, contra un puñado de operadores nacionales que concentran la
              mayor parte de la numeración.
            </p>
          </Card>
        </div>
      </Section>

      {curiosities.rareServices.length > 0 ? (
        <Section
          title="Servicios que casi no aparecen"
          description="Combinaciones de servicio registradas en muy pocas asignaciones."
        >
          <TableWrapper minWidth="26rem">
            <thead>
              <tr>
                <Th>Servicio</Th>
                <Th numeric>Asignaciones</Th>
              </tr>
            </thead>
            <tbody>
              {curiosities.rareServices.map((entry) => (
                <tr key={entry.service}>
                  <Td className="font-mono">{entry.service}</Td>
                  <Td numeric>{formatInteger(entry.allocations)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </Section>
      ) : null}

      <Section title="Los extremos del tiempo">
        <div className="grid gap-4 lg:grid-cols-2">
          {curiosities.oldest ? (
            <Card>
              <h3 className="text-sm font-semibold">Asignación más antigua</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                {formatDate(curiosities.oldest.date)} · {curiosities.oldest.resolution}
              </p>
              <p className="mt-1">
                Indicativo{" "}
                <span className="font-mono">{curiosities.oldest.areaCode}</span>, bloque{" "}
                <span className="font-mono">{curiosities.oldest.block}</span> —{" "}
                {curiosities.oldest.operator}
              </p>
            </Card>
          ) : null}

          {curiosities.newest ? (
            <Card>
              <h3 className="text-sm font-semibold">Asignación más reciente</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                {formatDate(curiosities.newest.date)} · {curiosities.newest.resolution}
              </p>
              <p className="mt-1">
                Indicativo{" "}
                <span className="font-mono">{curiosities.newest.areaCode}</span>, bloque{" "}
                <span className="font-mono">{curiosities.newest.block}</span> —{" "}
                {curiosities.newest.operator}
              </p>
            </Card>
          ) : null}

          {curiosities.busiestYear ? (
            <StatCard
              label={`Año de más actividad: ${curiosities.busiestYear.year}`}
              value={formatInteger(curiosities.busiestYear.allocationCount)}
              hint={`bloques asignados · ${formatInteger(curiosities.busiestYear.assignedNumbers)} números`}
            />
          ) : null}

          {curiosities.quietestYear ? (
            <StatCard
              label={`Año de menos actividad: ${curiosities.quietestYear.year}`}
              value={formatInteger(curiosities.quietestYear.allocationCount)}
              hint={`bloques asignados · ${formatInteger(curiosities.quietestYear.assignedNumbers)} números`}
            />
          ) : null}
        </div>
      </Section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Card, Section, TableWrapper, Td, Th } from "@/components/ui";
import { getNationalSummary } from "@/lib/dataset/queries";
import { formatDate, formatInteger } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodología",
  description:
    "Cómo se procesan los datos de Enacom, qué se calcula y qué límites tiene el análisis.",
};

export default function MethodologyPage() {
  const summary = getNationalSummary();
  const { meta } = summary;

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Metodología
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Qué se hace con el archivo publicado por Enacom, cómo se calculan las
          cifras del tablero y qué no puede responder este análisis.
        </p>
      </header>

      <Section title="Origen del dato">
        <TableWrapper>
          <tbody>
            <tr>
              <Th>Archivo procesado</Th>
              <Td className="font-mono">{meta.sourceFile}</Td>
            </tr>
            <tr>
              <Th>Hoja</Th>
              <Td className="font-mono">{meta.sourceSheet}</Td>
            </tr>
            <tr>
              <Th>Huella SHA-256</Th>
              <Td className="font-mono break-all text-xs">{meta.sourceSha256}</Td>
            </tr>
            <tr>
              <Th>Descarga original</Th>
              <Td>
                {meta.sourceUrl ? (
                  <a
                    href={meta.sourceUrl}
                    className="break-all underline underline-offset-2"
                  >
                    {meta.sourceUrl}
                  </a>
                ) : (
                  "No registrada"
                )}
              </Td>
            </tr>
            <tr>
              <Th>Procesado el</Th>
              <Td>{formatDate(meta.generatedAt.slice(0, 10))}</Td>
            </tr>
            <tr>
              <Th>Resolución más reciente</Th>
              <Td>{formatDate(meta.latestResolutionDate)}</Td>
            </tr>
            <tr>
              <Th>Asignaciones cargadas</Th>
              <Td className="tabular">{formatInteger(meta.rowCount)}</Td>
            </tr>
            <tr>
              <Th>Avisos de validación</Th>
              <Td className="tabular">{formatInteger(meta.warnings.length)}</Td>
            </tr>
          </tbody>
        </TableWrapper>
      </Section>

      <Section
        title="Cómo se cuenta la numeración"
        description="Enacom asigna bloques, no números sueltos. La cantidad de números que representa cada bloque se deduce del Plan de Numeración."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold">Capacidad de un bloque</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Como el indicativo más el número de abonado suman diez dígitos, los
              dígitos que quedan libres después del bloque determinan su tamaño:
            </p>
            <ul className="mt-3 space-y-1 font-mono text-sm">
              <li>11 + 4321 → 4 libres → 10.000 números</li>
              <li>2657 + 440 → 3 libres → 1.000 números</li>
              <li>223 + 4805 → 3 libres → 1.000 números</li>
              <li>2657 + 4993 → 2 libres → 100 números</li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold">Capacidad de un indicativo</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Se cuentan todos los números de abonado cuya característica de central
              empieza entre 2 y 9, porque el Plan restringe el 0 y el 1, y se
              descuenta el tramo del 911, que no es asignable. Un indicativo de tres
              dígitos tiene entonces 7.990.000 números útiles, no 10.000.000.
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              La ocupación que muestra el tablero es la relación entre los números
              contenidos en bloques asignados y esa capacidad útil.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Validaciones aplicadas en la carga">
        <TableWrapper>
          <thead>
            <tr>
              <Th>Control</Th>
              <Th>Qué verifica</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Indicativo válido</Td>
              <Td>Que tenga 2, 3 o 4 dígitos, las longitudes que admite el Plan.</Td>
            </tr>
            <tr>
              <Td>Bloque válido</Td>
              <Td>Que sea numérico y no empiece con 0 ni 1.</Td>
            </tr>
            <tr>
              <Td>Bloque reservado</Td>
              <Td>
                Que no invada el 911: ningún número local puede empezar con esa
                combinación.
              </Td>
            </tr>
            <tr>
              <Td>Longitud total</Td>
              <Td>Que indicativo más bloque no superen los diez dígitos.</Td>
            </tr>
            <tr>
              <Td>Bloques duplicados</Td>
              <Td>Que un mismo bloque no aparezca dos veces en el mismo indicativo.</Td>
            </tr>
            <tr>
              <Td>Bloques solapados</Td>
              <Td>
                Que un bloque no sea prefijo de otro dentro del mismo indicativo, lo
                que implicaría numeración asignada dos veces.
              </Td>
            </tr>
          </tbody>
        </TableWrapper>
        {meta.warnings.length > 0 ? (
          <TableWrapper>
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Avisos de la carga actual
            </caption>
            <thead>
              <tr>
                <Th numeric>Fila</Th>
                <Th>Tipo</Th>
                <Th>Detalle</Th>
              </tr>
            </thead>
            <tbody>
              {meta.warnings.slice(0, 50).map((warning, index) => (
                <tr key={index}>
                  <Td numeric>{warning.row}</Td>
                  <Td className="font-mono text-xs">{warning.kind}</Td>
                  <Td>{warning.detail}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        ) : null}
      </Section>

      <Section title="Límites del análisis">
        <Card>
          <ul className="space-y-3 text-sm text-ink-secondary">
            <li>
              <strong className="text-ink">Asignado no es igual a en uso.</strong> La
              base registra qué numeración le otorgó Enacom a cada prestador, no
              cuántas líneas están efectivamente activas. La ocupación real de la
              red es siempre menor.
            </li>
            <li>
              <strong className="text-ink">No contempla portabilidad numérica.</strong>{" "}
              Un número portado sigue perteneciendo al bloque de su operador
              original, así que la numeración atribuida a cada prestador no refleja
              su cartera de clientes.
            </li>
            <li>
              <strong className="text-ink">Solo numeración geográfica.</strong> Quedan
              fuera los números no geográficos (600, 800, 810), los códigos de
              servicios especiales y la numeración de servicios satelitales o de
              máquina a máquina.
            </li>
            <li>
              <strong className="text-ink">La fecha es la de la resolución.</strong> La
              serie temporal ordena por la fecha del acto administrativo que asignó
              el bloque, que puede ser anterior a su puesta en servicio.
            </li>
            <li>
              <strong className="text-ink">Los nombres de operador no están consolidados.</strong>{" "}
              Enacom registra la razón social vigente al momento de cada resolución,
              de modo que fusiones y cambios de denominación aparecen como
              prestadores distintos. Hay {formatInteger(summary.operatorCount)}{" "}
              razones sociales en la base.
            </li>
          </ul>
        </Card>
      </Section>

      <Section title="Actualización de los datos">
        <Card>
          <p className="text-sm text-ink-secondary">
            La base se actualiza a mano: cuando Enacom publica un archivo nuevo se lo
            copia en <span className="font-mono">data/raw/</span>, se corre{" "}
            <span className="font-mono">npm run ingest</span> y se vuelve a desplegar.
            El procedimiento completo está en el repositorio, en{" "}
            <span className="font-mono">docs/03-actualizar-la-base.md</span>.
          </p>
          <p className="mt-3 text-sm text-ink-secondary">
            Los criterios de interpretación de la numeración están detallados en la{" "}
            <Link href="/plan" className="underline underline-offset-2">
              sección del Plan de Numeración
            </Link>
            .
          </p>
        </Card>
      </Section>
    </div>
  );
}

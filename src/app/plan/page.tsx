import type { Metadata } from "next";

import { Card, Section, TableWrapper, Td, Th } from "@/components/ui";
import {
  ACCESS_PREFIXES,
  AREA_CODE_LENGTHS,
  MIGRATION_REGIONS,
  MODALITY_LABELS,
  NON_GEOGRAPHIC_RANGES,
  RESERVED_FIRST_DIGITS,
  RESERVED_PREFIXES,
  SERVICE_LABELS,
  SPECIAL_SERVICE_CODES,
} from "@/lib/numbering/constants";

export const metadata: Metadata = {
  title: "Plan de numeración",
  description:
    "Resumen del Plan Fundamental de Numeración Nacional (Resolución SC 46/1997): estructura del número, prefijos, servicios especiales y no geográficos.",
};

const GROUP_LABELS: Record<string, string> = {
  emergencia: "Emergencia",
  cliente: "Atención al cliente",
  operadora: "Operadora",
};

export default function PlanPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Plan Fundamental de Numeración Nacional
        </h1>
        <p className="max-w-3xl text-ink-secondary">
          Aprobado por la Resolución SC 46/1997 (Boletín Oficial Nº 28.568 del
          21/01/1997) e incorporado como Anexo IV del Decreto 92/97. Define cómo se
          estructura, asigna y administra la numeración telefónica en la Argentina.
          Es el marco con el que este tablero interpreta la base de Enacom.
        </p>
      </header>

      <Section
        title="Estructura del Número Nacional"
        description="El Plan unificó la longitud del Número Nacional en diez dígitos, repartidos entre el indicativo interurbano y el número de abonado."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold">Número Nacional Geográfico</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Indicativo interurbano + número de abonado = 10 dígitos. Cuanto más
              corto el indicativo, más largo el número de abonado y mayor la
              capacidad del área.
            </p>
            <ul className="mt-4 space-y-2 font-mono text-sm">
              {AREA_CODE_LENGTHS.map((length) => (
                <li key={length} className="flex items-center gap-3">
                  <span className="rounded bg-series-1-soft px-2 py-1">
                    {"A".repeat(length)}
                  </span>
                  <span className="rounded border border-hairline px-2 py-1">
                    {"x".repeat(10 - length)}
                  </span>
                  <span className="font-sans text-ink-secondary">
                    indicativo de {length} · abonado de {10 - length}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold">Número de abonado</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Se compone de la característica de central más el número interno de
              central, que siempre tiene cuatro dígitos (0000 a 9999).
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-secondary">
              <li>
                La característica de central no puede empezar con <strong>0</strong>,
                reservado para los prefijos de acceso.
              </li>
              <li>
                Tampoco con <strong>1</strong>, reservado para los servicios
                especiales.
              </li>
              <li>
                Ningún número local puede empezar con <strong>911</strong>, el
                número único de emergencias.
              </li>
              <li>
                Por eso el espacio útil de cada indicativo son ocho décimos de su
                capacidad nominal —los números que arrancan en 2 a 9— menos el
                tramo del 911.
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section
        title="Origen de los códigos de área actuales"
        description="En la migración a diez dígitos, el Plan antepuso un dígito a cada indicativo previo según la región. Por eso el primer dígito todavía indica la macrozona."
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Dígito antepuesto</Th>
              <Th>Región</Th>
              <Th>Alcance</Th>
            </tr>
          </thead>
          <tbody>
            {MIGRATION_REGIONS.map((region) => (
              <tr key={region.digit}>
                <Td className="font-mono">{region.digit}</Td>
                <Td>{region.name}</Td>
                <Td>{region.description}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <p className="text-sm text-ink-secondary">
          Los primeros dígitos {RESERVED_FIRST_DIGITS.join(", ")} quedaron en
          reserva para abrir nuevos indicativos o servicios no geográficos, y el 6 y
          el 8 están tomados por los servicios no geográficos existentes.
        </p>
      </Section>

      <Section title="Prefijos de acceso">
        <div className="grid gap-4 lg:grid-cols-2">
          <TableWrapper>
            <thead>
              <tr>
                <Th>Prefijo</Th>
                <Th>Significado</Th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_PREFIXES.map((prefix) => (
                <tr key={prefix.prefix}>
                  <Td className="font-mono">{prefix.prefix}</Td>
                  <Td>{prefix.meaning}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <Card>
            <h3 className="text-sm font-semibold">Reservas</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Los números {RESERVED_PREFIXES.join(", ")} quedan reservados para
              usarse como prefijos de acceso o como códigos de servicios especiales.
              Las marcaciones que empiezan con «*» quedan a libre uso de los
              prestadores locales.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Códigos de servicios especiales"
        description="Formato 1XY, salvo los servicios de operadora. El 911 se incorporó después del texto original como número único de emergencias."
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Servicio</Th>
              <Th>Grupo</Th>
            </tr>
          </thead>
          <tbody>
            {SPECIAL_SERVICE_CODES.map((entry) => (
              <tr key={entry.code}>
                <Td className="font-mono">{entry.code}</Td>
                <Td>{entry.service}</Td>
                <Td>{GROUP_LABELS[entry.group]}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>

      <Section
        title="Números no geográficos"
        description="Numeración virtual que requiere una traducción antes de encaminar la llamada. Queda fuera del alcance de este tablero, que analiza solo numeración geográfica."
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Indicativo</Th>
              <Th>Descripción</Th>
            </tr>
          </thead>
          <tbody>
            {NON_GEOGRAPHIC_RANGES.map((entry) => (
              <tr key={entry.range}>
                <Td className="font-mono">{entry.range}</Td>
                <Td>{entry.description}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </Section>

      <Section
        title="Servicios y modalidades de la base"
        description="Códigos que usa Enacom en las columnas SERVICIO y MODALIDAD del archivo publicado."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TableWrapper>
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Servicios
            </caption>
            <thead>
              <tr>
                <Th>Sigla</Th>
                <Th>Servicio</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SERVICE_LABELS).map(([code, label]) => (
                <tr key={code}>
                  <Td className="font-mono">{code}</Td>
                  <Td>{label}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>

          <TableWrapper>
            <caption className="px-4 py-3 text-left text-sm font-medium">
              Modalidades
            </caption>
            <thead>
              <tr>
                <Th>Sigla</Th>
                <Th>Modalidad</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MODALITY_LABELS).map(([code, label]) => (
                <tr key={code}>
                  <Td className="font-mono">{code}</Td>
                  <Td>{label}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      </Section>

      <Section title="Fuente normativa">
        <Card>
          <ul className="space-y-2 text-sm text-ink-secondary">
            <li>
              <a
                href="https://www.enacom.gob.ar/multimedia/normativas/1997/Resolucion%2046_97.pdf"
                className="underline underline-offset-2 hover:text-ink"
              >
                Resolución SC 46/1997 — Plan Fundamental de Numeración Nacional (PDF)
              </a>
            </li>
            <li>Anexo IV del Decreto 92/97.</li>
            <li>Normativa relacionada: Resolución SC 1643/98.</li>
          </ul>
        </Card>
      </Section>
    </div>
  );
}

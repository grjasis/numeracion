<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Numeración geográfica argentina

Tablero público sobre la numeración telefónica que asigna Enacom. Sin login, sin
base de datos: un script de ingesta convierte el Excel de Enacom en un JSON
versionado y el sitio se prerrenderiza.

## Convenciones

- **Código en inglés** (identificadores, nombres de archivo, tipos).
- **Comentarios en español.**
- **Documentación e interfaz en español rioplatense**, con acentuación completa.
- Formato de números y fechas siempre con `src/lib/format.ts` (locale `es-AR`).

## Reglas de dominio

Todo cálculo sobre numeración sale del Plan Fundamental de Numeración Nacional
(Res. SC 46/1997). Antes de tocar `src/lib/numbering/` leé
`docs/01-plan-fundamental-numeracion.md`. Invariantes que no se negocian:

- Indicativo + número de abonado = **10 dígitos**, siempre.
- La característica de central no empieza con `0` ni con `1`.
- **Ningún número local empieza con `911`**: ese tramo no es asignable y se
  descuenta de la capacidad.
- Un bloque nunca puede ser prefijo de otro dentro del mismo indicativo.

`src/lib/numbering/` no sabe nada del Excel; `src/lib/dataset/` no reimplementa
reglas del Plan.

## Datos

- `data/raw/*.xls` — publicaciones de Enacom, versionadas.
- `src/data/generated/dataset.json` — salida de `npm run ingest`, versionada.
- El dataset se lee **solo en el servidor**; nunca se envía al navegador.

## Gráficos

Una serie por gráfico siempre que se pueda, nunca dos ejes verticales, toda
ocupación lleva su porcentaje escrito y todo gráfico tiene su tabla equivalente.
Los colores salen de las variables CSS de `src/app/globals.css`.

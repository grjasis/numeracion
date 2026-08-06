# Arquitectura

## Decisiones de fondo

**Sin base de datos.** El dataset completo son 48.903 filas: entra en memoria y toda
agregación se resuelve en milisegundos. Una base agregaría infraestructura,
credenciales y un punto de falla sin dar nada a cambio.

**Datos precalculados en el repositorio.** La ingesta corre en la máquina de quien
actualiza, no en el servidor. El build de Vercel consume un JSON versionado, así que
no depende de que el sitio de Enacom responda.

**Casi todo estático.** Las páginas de panorama, códigos de área, operadores y
documentación se prerrenderizan en el build (unas 790 rutas). La única ruta dinámica
es `/asignaciones`, porque combina filtros libres con paginación.

**El dataset no llega al navegador.** Las páginas son componentes de servidor; al
cliente le llega solo lo que cada vista muestra. Los gráficos reciben decenas de
puntos, no decenas de miles de filas.

**Sin autenticación.** Es un sitio público de consulta sobre datos públicos.

## Estructura del proyecto

```
data/
  raw/                         .xls originales de Enacom + sources.json
docs/                          esta documentación
  referencia/                  Resolución SC 46/97 en PDF
scripts/
  ingest.ts                    Excel → dataset.json (npm run ingest)
src/
  app/
    layout.tsx                 estructura, navegación y pie
    page.tsx                   panorama nacional
    areas/                     listado y detalle de códigos de área
    operadores/                ranking y ficha por prestador
    asignaciones/              buscador con filtros y paginación
    plan/                      el Plan Fundamental explicado
    metodologia/               procedencia, cálculos y límites
  components/
    charts/                    gráficos (componentes de cliente, Recharts)
    ui.tsx                     tarjetas, tablas, barras de ocupación
  data/generated/
    dataset.json               salida de la ingesta (versionada)
  lib/
    numbering/                 el Plan Fundamental en código
      constants.ts             longitudes, prefijos, servicios especiales
      capacity.ts              capacidad de bloques e indicativos
      free-space.ts            tramos libres y ocupación por dígito
      area-space.ts            indicativos disponibles para abrir
    dataset/
      types.ts                 forma del dataset
      load.ts                  lectura del JSON
      queries.ts               agregaciones y buscador
    format.ts                  formato de números y fechas en es-AR
```

La separación importante es entre **`lib/numbering`** — las reglas del Plan
Fundamental, que no saben nada del Excel — y **`lib/dataset`** — la lectura y
agregación del dato concreto. Si mañana se suma numeración no geográfica, las reglas
se reutilizan tal cual.

## Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Next.js 16, App Router | Componentes de servidor, prerrenderizado, despliegue directo en Vercel |
| Lenguaje | TypeScript | El modelo de numeración tiene invariantes que conviene sostener con tipos |
| Estilos | Tailwind CSS 4 | Tokens de color en CSS, sin capa de configuración |
| Gráficos | Recharts | Suficiente para las formas que se necesitan, sin dependencias externas en runtime |
| Excel | SheetJS (`xlsx`) | Lee el `.xls` binario de Enacom; se usa solo en el script de ingesta |
| Scripts | `tsx` | Corre TypeScript sin paso de compilación aparte |

## Sistema visual

Los colores están definidos como variables CSS en
[`src/app/globals.css`](../src/app/globals.css), con modo claro y oscuro. Las de
serie salen de una paleta validada para daltonismo y contraste sobre cada
superficie; el modo oscuro tiene sus propios valores, no es una inversión
automática.

Criterios que siguen los gráficos:

- **Nunca dos ejes verticales.** Cuando hay dos medidas de escalas distintas
  (cantidad de números y cantidad de bloques) van en dos gráficos separados.
- **El color no es el único canal.** Toda ocupación lleva su porcentaje escrito al
  lado de la barra, y todo gráfico tiene su tabla equivalente en la misma página.
- **Ejes y grillas recesivos**, marcas finas, sin etiquetas sobre cada punto.

## Despliegue en Vercel

No hace falta configuración especial: es un proyecto Next.js estándar sin variables
de entorno ni servicios externos.

1. Importar el repositorio en Vercel.
2. Framework: Next.js (autodetectado). Build: `npm run build`.
3. Cada push a la rama principal despliega.

`npm run ingest` **no** corre en el build: el dataset ya está versionado.

## Rendimiento

- El build genera ~790 páginas estáticas en menos de diez segundos.
- El dataset ocupa 1,7 MB en el servidor y nunca se envía al cliente.
- La ruta dinámica `/asignaciones` filtra 48.903 filas por request, del orden de
  milisegundos.

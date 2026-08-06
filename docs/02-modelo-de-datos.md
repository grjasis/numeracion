# Modelo de datos

## El archivo de origen

Enacom publica la numeración geográfica en un Excel binario (`.xls`) con **una sola
hoja** y ocho columnas. La versión procesada al armar el proyecto es
`archivo_20260727084225_3117.xls`, con 48.903 filas de datos.

| Columna | Contenido | Ejemplo |
|---|---|---|
| `OPERADOR` | Razón social del prestador | `TELECOM ARGENTINA S.A.` |
| `SERVICIO` | Siglas del o los servicios, separadas por `/` | `SRMC/STM/PCS` |
| `MODALIDAD` | Modalidad de tarificación | `CPP` |
| `LOCALIDAD` | Localidad cabecera del indicativo | `MAR DEL PLATA` |
| `INDICATIVO` | Código de área, 2 a 4 dígitos | `223` |
| `BLOQUE` | Característica de central asignada | `480` |
| `RESOLUCION` | Acto administrativo que asignó el bloque | `SC 2233/98` |
| `FECHA` | Fecha de la resolución (serial de Excel) | `36070` |

Observaciones sobre la calidad del dato, verificadas en la publicación de julio
de 2026:

- La clave `INDICATIVO` + `BLOQUE` es **única**: no hay duplicados ni bloques
  solapados.
- La relación indicativo ↔ localidad es **1 a 1**: 300 indicativos, 300 localidades.
- Los textos vienen con espacios de más (`MERCEDES (PROV.  SAN LUIS)`), variantes de
  mayúsculas y valores casi duplicados (`BASICO` por `BASICA`, `SBT ` con espacio
  final, `STM/ SRMC/ PCS` con espacios alrededor de las barras). La ingesta los
  normaliza.
- Las fechas van del 02/10/1998 al 26/05/2026 y vienen siempre como serial numérico
  de Excel.
- **Las razones sociales no están consolidadas**: fusiones y cambios de nombre
  aparecen como prestadores distintos, porque cada fila conserva la denominación
  vigente al momento de su resolución.

## El dataset generado

`npm run ingest` produce un único archivo,
`src/data/generated/dataset.json` (~1,7 MB), en formato **columnar con
diccionarios**: los textos que se repiten se guardan una sola vez y cada fila
almacena índices. El tipo está definido en
[`src/lib/dataset/types.ts`](../src/lib/dataset/types.ts).

```jsonc
{
  "meta": {
    "generatedAt": "2026-08-05T…",
    "sourceFile": "2026-07-27-numeracion-geografica.xls",
    "sourceSha256": "…",          // detecta si Enacom republicó el archivo
    "sourceSheet": "num geo para web 2003",
    "sourceUrl": "https://…",
    "rowCount": 48903,
    "latestResolutionDate": "2026-05-26",
    "warnings": []                 // filas que no cumplen el PFNN
  },
  "operators":  ["TELECOM ARGENTINA S.A.", …],
  "localities": ["MAR DEL PLATA", …],
  "services":   ["SBT", …],
  "modalities": ["BASICA", …],
  "resolutions":["SC 2233/98", …],
  "allocations": [
    // [indicativo, bloque, iOperador, iLocalidad, iServicio, iModalidad, iResolución, día]
    ["223", "480", 0, 3, 0, 1, 0, 20364]
  ]
}
```

`día` son los días transcurridos desde el 1970-01-01 en UTC. Guardar un entero en
lugar de una fecha ISO ahorra unos 400 KB sobre el total.

## Cómo se consume

El JSON **nunca viaja al navegador**. Todas las páginas se renderizan en el
servidor y al cliente solo llegan los datos ya agregados de cada vista (por
ejemplo, 29 puntos de serie temporal o 10 filas de ranking).

- [`src/lib/dataset/load.ts`](../src/lib/dataset/load.ts) lee el archivo una vez por
  proceso.
- [`src/lib/dataset/queries.ts`](../src/lib/dataset/queries.ts) tiene todas las
  agregaciones: panorama nacional, métricas por indicativo, ranking de operadores,
  series temporales y el buscador con filtros.

Con 48.903 filas todas las agregaciones se resuelven en memoria en milisegundos, así
que **no hace falta una base de datos**.

## Magnitudes derivadas

Estas son las cifras que el tablero calcula y que no están en el archivo original:

| Métrica | Cómo se calcula |
|---|---|
| Números de un bloque | `10 ^ (10 − largo(indicativo) − largo(bloque))` |
| Capacidad de un indicativo | `8 × 10 ^ (dígitos de abonado − 1)` menos el tramo del 911, que no es asignable |
| Números asignados | Suma de la capacidad de todos los bloques |
| Ocupación | Números asignados ÷ capacidad del indicativo |
| Tramos libres | Huecos entre los intervalos que cubren los bloques asignados y los prefijos reservados |
| Indicativos disponibles | Espacio de cuatro dígitos bajo los prefijos 2 y 3 no cubierto por un indicativo en uso |

El fundamento normativo de cada una está en
[`01-plan-fundamental-numeracion.md`](01-plan-fundamental-numeracion.md).

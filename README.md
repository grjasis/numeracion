# Numeración geográfica argentina

Tablero público para analizar la numeración telefónica geográfica que Enacom asigna
a los prestadores, interpretada según el **Plan Fundamental de Numeración Nacional**
(Resolución SC 46/1997).

Sin login, sin base de datos: los datos se procesan a mano desde el Excel que publica
Enacom y el sitio se despliega estático en Vercel.

## Qué muestra

- **Panorama nacional**: números asignados, ocupación del espacio, evolución desde
  1998, concentración por operador.
- **Códigos de área**: los 300 indicativos en uso con su ocupación, capacidad y
  numeración sin asignar; además, qué indicativos de cuatro dígitos siguen libres.
- **Detalle por indicativo**: tramos de numeración libres, ocupación por
  característica de central, operadores presentes y todas sus asignaciones.
- **Consultar un número**: escribís un teléfono en cualquier formato y devuelve el
  bloque, el operador y los datos de la asignación, con las salvedades del caso.
- **Operadores**: ranking por numeración asignada y ficha con cobertura geográfica.
- **Asignaciones**: buscador con filtros sobre las 48.903 asignaciones, compartible
  por URL.
- **Particularidades**: códigos de área que son prefijo de otro, tamaños de bloque,
  el 911 ausente de toda la base y otros casos límite.
- **Plan de numeración** y **metodología**: las reglas aplicadas y los límites del
  análisis, explicados en el propio sitio.

Alcance actual: **solo numeración geográfica**. Los números no geográficos (600,
800, 810) y los códigos de servicios especiales quedan fuera.

## Empezar

```bash
npm install
npm run ingest      # procesa el .xls de data/raw/ y genera el dataset
npm run dev         # http://localhost:3000
```

El dataset ya viene versionado en el repositorio, así que `npm run dev` funciona sin
correr la ingesta.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila y prerrenderiza ~790 páginas |
| `npm run start` | Sirve el build de producción |
| `npm run ingest` | Procesa el Excel de Enacom y regenera `src/data/generated/dataset.json` |
| `npm run lint` | ESLint |

## Actualizar los datos

La actualización es manual. Cuando Enacom publica una base nueva:

```bash
curl -L -o data/raw/AAAA-MM-DD-numeracion-geografica.xls "<url de Enacom>"
# agregar el archivo y su URL a data/raw/sources.json
npm run ingest
npm run build
git add data/raw src/data/generated && git commit && git push
```

El procedimiento completo, incluido qué hacer con los avisos de validación, está en
[`docs/03-actualizar-la-base.md`](docs/03-actualizar-la-base.md).

## Documentación

| Documento | Contenido |
|---|---|
| [01 · Plan Fundamental de Numeración](docs/01-plan-fundamental-numeracion.md) | Las reglas normativas que gobiernan todos los cálculos |
| [02 · Modelo de datos](docs/02-modelo-de-datos.md) | El Excel de origen y el dataset generado |
| [03 · Actualizar la base](docs/03-actualizar-la-base.md) | Procedimiento de actualización manual |
| [04 · Arquitectura](docs/04-arquitectura.md) | Decisiones técnicas y estructura del proyecto |
| [05 · Hoja de ruta](docs/05-hoja-de-ruta.md) | Qué está hecho y qué sigue |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Recharts · SheetJS para leer
el Excel. Despliegue en Vercel sin configuración adicional.

## Autor

Gustavo Riveros Jasis · [grjasis@code.ar](mailto:grjasis@code.ar)

## Fuentes

- Base de numeración geográfica: [Enacom](https://www.enacom.gob.ar)
- [Resolución SC 46/1997 — Plan Fundamental de Numeración Nacional](https://www.enacom.gob.ar/multimedia/normativas/1997/Resolucion%2046_97.pdf)
  (copia en [`docs/referencia/`](docs/referencia/))

Sitio informativo sin vínculo con Enacom.

# Actualizar la base

La actualización es **manual**: cuando Enacom publica un archivo nuevo, se lo baja,
se corre la ingesta y se despliega. El proceso completo lleva un par de minutos.

## Procedimiento

### 1. Conseguir el archivo

Enacom publica la base en su sitio, en la sección de noticias o de numeración. La
URL tiene esta forma:

```
https://www.enacom.gob.ar/multimedia/noticias/archivos/AAAAMM/archivo_AAAAMMDDHHMMSS_NNNN.xls
```

Descargalo a `data/raw/` con un nombre que empiece por la fecha de publicación, para
que quede ordenado cronológicamente:

```bash
curl -L -o data/raw/2026-11-15-numeracion-geografica.xls \
  "https://www.enacom.gob.ar/multimedia/noticias/archivos/202611/archivo_XXXX.xls"
```

### 2. Registrar la procedencia

Agregá el archivo a `data/raw/sources.json` con su URL de descarga. Ese dato se
publica en la página de metodología, para que cualquiera pueda verificar el origen:

```json
{
  "2026-07-27-numeracion-geografica.xls": "https://www.enacom.gob.ar/…_3117.xls",
  "2026-11-15-numeracion-geografica.xls": "https://www.enacom.gob.ar/…_XXXX.xls"
}
```

### 3. Correr la ingesta

```bash
npm run ingest
```

Sin argumentos toma **el último archivo de `data/raw/` por orden alfabético**, que
con la convención de nombres es el más nuevo. Para procesar uno puntual:

```bash
npm run ingest -- data/raw/2026-07-27-numeracion-geografica.xls
```

El script **sobrescribe** `src/data/generated/dataset.json` y muestra un resumen:

```
Procesando 2026-07-27-numeracion-geografica.xls (6.7 MB)
  Asignaciones: 48.903
  Indicativos:  300
  Operadores:   480
  Localidades:  300
  Última resolución: 2026-05-26
  Avisos: 1
    fila 6119 [modalidad-vacia] Fila sin modalidad; se carga como «SIN DATO».
```

### 4. Revisar los avisos

Los avisos no frenan la carga, pero conviene mirarlos: si aparecen muchos de un tipo
que antes no existía, probablemente Enacom cambió el formato del archivo.

| Aviso | Qué significa |
|---|---|
| `indicativo-invalido` | El indicativo no tiene 2, 3 o 4 dígitos. La fila se descarta. |
| `bloque-invalido` | El bloque no es numérico o empieza con 0 o 1. La fila se descarta. |
| `bloque-reservado` | El bloque invade el 911, que no es asignable. La fila se descarta. |
| `longitud-excedida` | Indicativo + bloque pasan los 10 dígitos. La fila se descarta. |
| `bloque-duplicado` | El bloque ya apareció en ese indicativo. La fila se descarta. |
| `bloque-solapado` | El bloque es prefijo de otro ya asignado: numeración duplicada. La fila se carga igual. |
| `modalidad-vacia` | Fila sin modalidad; se carga como `SIN DATO`. |
| `fecha-invalida` | Fecha no interpretable; la fila se carga sin fecha y queda fuera de las series temporales. |

Los avisos quedan guardados en el dataset y se muestran en la página
`/metodologia`, así que la carga es auditable desde el sitio.

### 5. Verificar y publicar

```bash
npm run build     # compila y regenera las ~790 páginas estáticas
npm run start     # revisá el resultado en http://localhost:3000
```

Si está todo bien:

```bash
git add data/raw src/data/generated
git commit -m "Actualizar base de numeración a la publicación del 15/11/2026"
git push
```

Vercel despliega solo al recibir el push.

## Por qué se versiona el dataset generado

`src/data/generated/dataset.json` **se commitea al repositorio**, junto con el `.xls`
original. Es deliberado:

- El build de Vercel no depende de que el sitio de Enacom esté disponible ni de que
  la URL siga viva — los archivos publicados suelen rotar.
- Queda el historial: `git log` sobre `data/raw/` muestra qué publicación se usó en
  cada momento, y el `sourceSha256` del dataset permite verificar que el archivo no
  cambió.
- Se puede reprocesar cualquier publicación anterior sin volver a descargarla.

El costo es tener archivos binarios en el repositorio (unos 7 MB por publicación).
Si con los años el repositorio crece de más, la alternativa es guardar solo el
último `.xls` y mover los anteriores a otro lado.

## Si Enacom cambia el formato

El script asume la primera hoja del libro y los ocho encabezados listados en
[`02-modelo-de-datos.md`](02-modelo-de-datos.md). Si cambian:

1. Inspeccioná el archivo nuevo para ver los encabezados y el nombre de la hoja.
2. Ajustá el tipo `SheetRow` y las funciones de limpieza en
   [`scripts/ingest.ts`](../scripts/ingest.ts).
3. Volvé a correr la ingesta y revisá que los totales sean coherentes con la carga
   anterior — un salto grande en la cantidad de asignaciones o en la ocupación es
   señal de que algo se interpretó mal.

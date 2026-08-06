# Hoja de ruta

Estado de lo pedido y lo que queda por delante. Solo numeración **geográfica**: la
no geográfica (600, 800, 810) y los servicios especiales están fuera del alcance
actual.

## Implementado

- Ingesta del `.xls` de Enacom con normalización y validación contra el Plan
  Fundamental.
- Panorama nacional: números asignados, ocupación, bloques, códigos de área,
  reparto entre servicios fijos y móviles.
- Evolución de las asignaciones en el tiempo, nacional y por indicativo y operador.
- Listado de códigos de área con ocupación, capacidad y numeración sin asignar.
- Detalle por código de área: tramos libres, ocupación por primer dígito,
  operadores presentes, serie temporal y asignaciones.
- Ranking de operadores y ficha por prestador con su cobertura geográfica.
- Buscador de asignaciones con filtros y paginación, compartible por URL.
- Indicativos de cuatro dígitos que todavía no fueron abiertos.
- Consulta de un número suelto: a qué bloque, operador y localidad pertenece, con
  las advertencias sobre portabilidad y sobre que asignado no implica activo.
- Reparto del espacio de los indicativos que abren dentro de otro: lo que se lleva
  el más largo se descuenta de la capacidad del más corto y se muestra aparte.
- Página de particularidades con las rarezas verificables de la base.
- El Plan Fundamental y la metodología documentados en el propio sitio.

## Próximo

### Provincia y geografía

Hoy la única dimensión territorial es la localidad cabecera del indicativo y la
macrorregión que se deduce del primer dígito (AMBA / Interior Sur / Interior Norte).
Falta un mapeo **indicativo → provincia**, que la base de Enacom no trae. Se puede
armar como archivo de referencia en `data/reference/` a partir del listado de
localidades. Con eso se abren:

- Agregados por provincia y por región.
- Un mapa de ocupación.

### Consolidación de operadores

Las razones sociales aparecen tal como estaban al momento de cada resolución, así
que un mismo grupo económico se cuenta varias veces (Telefónica de Argentina y
Telefónica Móviles; CTI, CTI Norte y AMX; Telmex y Claro). Un archivo de
equivalencias en `data/reference/` permitiría ver la concentración real por grupo,
manteniendo la razón social original como dato de detalle.

### Comparación entre publicaciones

Como se versiona cada `.xls`, se puede procesar más de una publicación y mostrar qué
cambió entre dos fechas: bloques nuevos, devoluciones, cambios de operador. Requiere
que la ingesta escriba un dataset por publicación en lugar de sobrescribir siempre
el mismo.

### Exportación

Botón para bajar en CSV el resultado de cualquier vista filtrada, y un endpoint JSON
para quien quiera reprocesar los datos.

### Alcance ampliado

Numeración no geográfica y códigos de servicios especiales, si Enacom publica bases
equivalentes. Las reglas del Plan ya están codificadas en `src/lib/numbering`; haría
falta la ingesta y las vistas.

## Cosas a tener en cuenta

- **La ocupación que se muestra es de numeración asignada, no en uso.** Vale la pena
  reforzarlo en la interfaz si el sitio gana audiencia general, para que nadie lea
  «31,8% de ocupación» como líneas activas.
- **Los bloques de 100 números** aparecen en la base pero el Plan habla de
  asignaciones mínimas de 1.000. Convendría confirmar con Enacom el criterio, que
  puede responder a compartir una característica de central entre prestadores.
- **El archivo puede cambiar de formato** sin aviso. La ingesta valida y avisa, pero
  conviene comparar los totales con la carga anterior en cada actualización.

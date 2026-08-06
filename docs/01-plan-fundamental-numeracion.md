# El Plan Fundamental de Numeración Nacional

Todo lo que este tablero calcula sale de las reglas que fija el **Plan Fundamental
de Numeración Nacional (PFNN)**, aprobado por la **Resolución SC 46/1997**
(Boletín Oficial Nº 28.568 del 21/01/1997), incorporado como Anexo IV del Decreto
92/97 y complementado por la Resolución SC 1643/98.

- Texto original: [`referencia/resolucion-sc-46-1997.pdf`](referencia/resolucion-sc-46-1997.pdf)
- En línea: <https://www.enacom.gob.ar/multimedia/normativas/1997/Resolucion%2046_97.pdf>

Este documento resume las partes del Plan que el código necesita conocer. Las
constantes están codificadas en [`src/lib/numbering/constants.ts`](../src/lib/numbering/constants.ts)
y los cálculos en [`src/lib/numbering/capacity.ts`](../src/lib/numbering/capacity.ts).

## 1. La regla que gobierna todo: diez dígitos

> «La longitud de los Números Nacionales será uniforme a 10 dígitos.» (PFNN III.1.1)

El Número Nacional Geográfico se forma con el **indicativo interurbano** (código de
área) más el **número de abonado**, y entre los dos suman siempre diez dígitos
(tabla 3.1):

| Indicativo | Número de abonado | Ejemplo |
|---|---|---|
| 2 dígitos (`AB`) | 8 dígitos (`cdefghij`) | `11` 4820-5656 |
| 3 dígitos (`ABC`) | 7 dígitos (`defghij`) | `221` 483-6789 |
| 4 dígitos (`ABCD`) | 6 dígitos (`efghij`) | `3837` 42-6789 |

**Consecuencia práctica**: cuanto más corto el indicativo, más grande su espacio de
numeración. El 11 tiene diez veces la capacidad de un indicativo de tres dígitos y
cien veces la de uno de cuatro.

## 2. Estructura del número de abonado

El número de abonado se divide en (tabla 3.2):

- **Característica de central**: 2, 3 o 4 dígitos. Identifica un conjunto de números
  consecutivos y es lo que Enacom asigna a los prestadores.
- **Número interno de central**: siempre 4 dígitos, de `0000` a `9999`.

Las restricciones que definen el espacio útil:

- La característica de central **no puede empezar con `0`**, porque el cero está
  asignado a los prefijos de acceso.
- Tampoco **con `1`**, reservado para los servicios especiales.
- Ningún número local puede empezar con **`911`**, el número único de emergencias.
  Es una restricción posterior al texto de 1997, pero está vigente y la base la
  respeta: existen los bloques `910`, `912` y `913`, pero **ninguno `911`** en
  ningún indicativo del país.

Por eso el espacio real de un indicativo son los números de abonado que arrancan
entre **2 y 9** —ocho décimos de la capacidad nominal— menos el tramo del `911`:

| Indicativo | Abonado | Nominal | Reservado 911 | Capacidad útil |
|---|---|---|---|---|
| 2 dígitos (`11`) | 8 dígitos | 80.000.000 | 100.000 | **79.900.000** |
| 3 dígitos | 7 dígitos | 8.000.000 | 10.000 | **7.990.000** |
| 4 dígitos | 6 dígitos | 800.000 | 1.000 | **799.000** |

El código lo expresa en `RESERVED_SUBSCRIBER_PREFIXES`
([`constants.ts`](../src/lib/numbering/constants.ts)) y lo aplica en el cálculo de
capacidad, en los tramos libres y en la validación de la ingesta.

## 3. Cómo se traduce un "bloque" de la base de Enacom

La base publicada tiene una columna `BLOQUE` que es la característica de central
asignada. La cantidad de números que representa se deduce restando:

```
números del bloque = 10 ^ (10 − largo(indicativo) − largo(bloque))
```

| Indicativo | Bloque | Dígitos libres | Números |
|---|---|---|---|
| `11` | `4321` | 4 | 10.000 |
| `223` | `480` | 4 | 10.000 |
| `2657` | `440` | 3 | 1.000 |
| `2657` | `4993` | 2 | 100 |

El Plan (VI.2.1) fija que la asignación mínima habitual es de 1.000 números, y que
una característica de central puede compartirse entre varios prestadores en bloques
de 1.000 cuando la demanda es menor. Los bloques de 100 que aparecen en la base
corresponden a asignaciones más granulares posteriores.

**Un bloque nunca puede ser prefijo de otro dentro del mismo indicativo**: eso
significaría numeración asignada dos veces. La ingesta valida esta condición y
emite un aviso si la encuentra.

## 4. De dónde salen los códigos de área actuales

Antes de 1999 los números nacionales tenían 8 dígitos y los indicativos, de 1 a 3.
La migración (PFNN VII.3) hizo dos cosas:

1. **Expandió el número local** anteponiendo un `4` a todos los números de abonado.
   Por eso tantas líneas fijas históricas empiezan con 4.
2. **Expandió los indicativos** anteponiendo un dígito según la región:

   | Dígito | Región |
   |---|---|
   | `1` | AMBA |
   | `2` | Área Interior Sur |
   | `3` | Área Interior Norte |

Ejemplos del propio Plan: AMBA `1`-8205656 → `11`-48205656; La Plata `21`-836789 →
`221`-4836789; Córdoba `51`-456789 → `351`-4456789; Tinogasta `837`-26789 →
`3837`-426789.

De ahí que el **primer dígito del indicativo siga indicando la macrorregión**, algo
que el tablero usa para agrupar áreas.

## 5. Qué espacio queda para nuevos códigos de área

El Plan reserva (tabla 5.2) los primeros dígitos **4, 5, 7 y 9** para abrir nuevos
indicativos o servicios no geográficos. El **6** y el **8** ya están tomados por los
servicios no geográficos (tabla 3.4). Los nuevos indicativos geográficos, dice el
Plan, «podrán tomarse de los que estén libres en A = 2 o 3 o de los que están en
reserva».

Por eso el cálculo de indicativos disponibles del tablero explora el espacio bajo
los prefijos **2** y **3**, contando en unidades de indicativo de cuatro dígitos.
Un indicativo corto ocupa todo su subárbol: el `221` de La Plata bloquea del `2210`
al `2219`. Ver [`src/lib/numbering/area-space.ts`](../src/lib/numbering/area-space.ts).

## 6. Prefijos de acceso

No forman parte del número; seleccionan formato de marcación, red o servicio
(tabla 4.2):

| Prefijo | Significado |
|---|---|
| `0` | Larga distancia nacional automática, operador preseleccionado |
| `00` | Larga distancia internacional automática, operador preseleccionado |
| `15` | Llamada con la modalidad «abonado llamante paga» |
| `17` | Selección de operador para larga distancia nacional |
| `18` | Selección de operador para larga distancia internacional |

Los números `13`, `14` y `16` quedan en reserva (tabla 5.1) para usarse como
prefijos o como códigos de servicios especiales. Las marcaciones que empiezan con
`*` quedan a libre uso de los prestadores locales.

El `15` explica la modalidad **CPP** de la base: la numeración móvil se marca con
ese prefijo desde una línea fija dentro del área local, y en formato internacional
el equivalente es el `9` que se intercala en `+54 9 11 …`.

## 7. Códigos de servicios especiales

Formato `1XY` (PFNN III.4), agrupados por el dígito genérico `X`: `10Y` servicios de
emergencia, `11Y` y `12Y` servicios al cliente.

| Código | Servicio |
|---|---|
| `100` | Bomberos |
| `101` | Policía |
| `102` | Ayuda al niño |
| `103` | Defensa Civil |
| `105` | Emergencia ambiental |
| `106` | Emergencia náutica |
| `107` | Emergencia médica |
| `110` | Información |
| `112` | Atención a clientes del prestador local |
| `113` | Hora oficial |
| `114` | Reparaciones |
| `115` | Prueba de campanilla |
| `121` | Estado de cuenta del servicio |
| `19` | Operadora nacional |
| `000` | Operadora internacional |
| `911` | **Emergencias (número único)** |

El **911 no figura en la tabla 3.6 original** de la Resolución 46/97: se incorporó
después como número único de emergencias y no responde al formato `1XY`. Está
incluido acá porque es parte del plan de numeración vigente en la práctica, marcado
como incorporación posterior en el código.

## 8. Números no geográficos

Numeración virtual que requiere traducción antes de encaminar la llamada
(tabla 3.4). **Queda fuera del alcance de este tablero**, que analiza solo
numeración geográfica.

| Indicativo | Descripción |
|---|---|
| `600` | Valor agregado tipo audiotexto |
| `601` a `609` | Reserva para audiotexto |
| `610` | Otros servicios de valor agregado |
| `611` a `699` | Reserva para servicios no geográficos |
| `800` | Cobro revertido automático |
| `801` a `809` | Reserva para cobro revertido |
| `819` a `899` | Reserva para servicios no geográficos |

## 9. Administración del recurso

Puntos del PFNN (VI) que importan para leer los datos:

- La numeración es un **recurso nacional**; la asignación no implica propiedad.
- El administrador (hoy **Enacom**) asigna las características de central, abre y
  modifica indicativos y publica la información, que **puede ser consultada por los
  prestadores** — de ahí sale el archivo que alimenta este tablero.
- Un prestador tiene **un año** para empezar a usar la numeración asignada, o el
  administrador puede revocarla. Esto es clave: **asignado no es lo mismo que en
  uso**, y la base no dice cuántas líneas están efectivamente activas.
- La **portabilidad numérica** permite cambiar de prestador conservando el número,
  así que la numeración atribuida a un operador no equivale a su cartera de
  clientes.

## 10. Siglas de servicio que aparecen en la base

| Sigla | Servicio |
|---|---|
| `SBT` | Servicio Básico Telefónico |
| `STM` | Servicio de Telefonía Móvil |
| `PCS` | Servicio de Comunicaciones Personales |
| `SRMC` | Servicio Radioeléctrico de Concentración de Enlaces Móvil Celular |
| `SRCE` | Servicio Radioeléctrico de Concentración de Enlaces |
| `SCMA` | Servicio de Comunicaciones Móviles Avanzadas |
| `STEFI` | Servicio de Telefonía Fija Inalámbrica |
| `OMV` | Operador Móvil Virtual |
| `SAP` | Servicio de Aviso a Personas |
| `TELSAT` | Servicio de Telefonía Satelital |

Modalidades: **BASICA** (tarifa local al llamante), **CPP** (paga quien llama) y
**MPP** (paga el abonado móvil).

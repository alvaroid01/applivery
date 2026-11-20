# Fases de recalibración

Casi todo el ajuste del comportamiento está en `src/common/protocols.ts`. No todo fue una corrección hecha con IA. Algunas cosas las decidí al implementar, y otras las contrasté o las depuré con asistencia.

Esta reconstrucción se basa en las decisiones que fui tomando durante el desarrollo, ya que no conservé un historial de versiones del fichero.

## Resumen

| Fase | Tipo de intervención | Participación de IA |
| --- | --- | --- |
| Elección del mapa `protocolFilters` | Decisión arquitectónica | Contraste de tres alternativas |
| Descartar el sistema de pesos | Recalibración de diseño | Evaluación de la propuesta |
| Corregir el bucle de `processProtocol` | Debugging | Identificación del error |
| Separar `applyConstraints` | Decisión de implementación | Ninguna |
| Devolver una lista nueva en cada función | Decisión de implementación | Ninguna |
| `assist-allies` sin aliados, y lista vacía | Decisión de implementación | Ninguna |

## Elección del mapa `protocolFilters`

Decisión mía. Antes de escribir el fichero me planteé tres formas de despachar cada protocolo:

- un mapa, con el nombre como clave y la función como valor
- una función suelta por filtro
- un `switch`

Elegí el mapa. Me parecía más fácil de ampliar: un protocolo nuevo es una entrada nueva, y el bucle que recorre la petición no cambia. Se lo comenté a la IA y coincidió con esa lectura. La decisión ya era mía.

## Descartar el sistema de pesos

Esto sí fue una recalibración de diseño. Para varios protocolos en la misma petición pensé en dar un peso a cada uno y ordenar los puntos por esa puntuación. Se lo pregunté a la IA y me hizo ver que no encajaba. Lo descarté.

El enunciado no especificaba un sistema de prioridades ni pesos entre protocolos. Por ello decidí aplicarlos secuencialmente, respetando el orden en el que llegaban en la petición. Me pareció una solución más sencilla y predecible que inventar un sistema de puntuaciones.

Descarté los pesos porque me parecía añadir complejidad innecesaria. Además, algunos protocolos filtran objetivos mientras que otros simplemente los ordenan, por lo que asignarles una puntuación común no terminaba de encajar.

Con esa decisión, `closest-enemies` seguido de `avoid-mech` funciona así: primero se ordena por distancia y después se quitan los mech. En `test_cases.txt` ese caso devuelve `{x:0, y:10}`. El mech de `{x:0, y:1}` desaparece y se ataca el soldado más cercano que queda.

## `assist-allies` y una lista sin candidatos

El enunciado dice que deben priorizarse los puntos en los que haya algún aliado. Priorizar no es descartar el resto. Lo dejé como `prioritize-mech`: si hay puntos con aliados, me quedo con esos; si no hay ninguno, la lista sigue igual y otro protocolo puede seguir eligiendo.

`avoid-mech`, `avoid-crossfire` y la criba de distancia sí pueden vaciar la lista, porque ahí el enunciado prohíbe el ataque y no ofrece un plan B. `processProtocol` mira si queda algún punto antes de leer el primero. Si no queda ninguno, no devuelve coordenadas. El controlador responde 400 con `No valid target found` y no guarda la auditoría.

## Corregir el bucle de `processProtocol`

Esta es la corrección hecha con IA. Al correr los tests, el array procesado seguía siendo el original. El fallo no era que el mapa no existiera. El fallo era que en cada vuelta del `for` no pasaba el array ya actualizado: cada protocolo volvía a recibir la lista inicial, así que el resultado de uno no llegaba al siguiente.

No lo veía. Le pedí a la IA que mirara `processProtocol` con ese síntoma, y señaló el bucle.

La corrección guarda el retorno y lo usa como entrada de la vuelta siguiente:

```ts
const filterFunction = protocolFilters[protocol];
if (filterFunction) {
    response = filterFunction(response);
}
```

`response` empieza siendo la lista que sale de las restricciones. Cada protocolo recibe esa variable, y lo que devuelve la sustituye. El protocolo siguiente ve la lista ya transformada, no la original.

## Separar `applyConstraints`

Decisión mía, sin asistencia. La distancia máxima y la obligación de que haya enemigos no son protocolos de la petición. Los aplico una vez, antes del bucle: el punto sigue solo si `enemies.number` es mayor que 0 y la distancia al origen `{x:0, y:0}` es menor o igual que 100. La distancia es euclídea, con `Math.hypot`.

Si esas reglas estuvieran dentro del mapa, se repetirían en cada protocolo y dependerían del orden en el que yo hubiera decidido aplicarlos.

## Devolver una lista nueva en cada función

También lo hice por mi cuenta. Los protocolos que ordenan copian la lista antes del `sort` (`[...scans].sort`). Los que filtran construyen otra con `filter`. Así un protocolo no modifica el array que pudiera seguir usando el paso anterior.

`prioritize-mech` devuelve la lista recibida cuando no hay mech, porque el enunciado permite atacar otro tipo de objetivo. `closest-enemies` y `furthest-enemies` ordenan por distancia al origen. En el tercer caso de `test_cases.txt`, `{x:10, y:30}` queda por delante de `{x:5, y:35}`.

## Fuera de este fichero

El POST sin cuerpo, el reparto de tipos (`IScan`, `ICoordinate`, `IEnemies`, `TProtocol`) y la corrección del CRUD de auditoría no forman parte de este ciclo. Están en `BITACORA_USO_IA.md`.

# Bitácora de uso de asistencia de IA

Módulo de radar y auditoría del YVH. Me encargué del diseño, la estructura del proyecto y las decisiones relacionadas con la lógica del módulo. Utilicé IA únicamente en las partes que documento a continuación.

Los prompts de las fases 0 a 4 no se conservaron. Los reconstruyo, en el inglés en el que los escribí, y los marco como reconstrucción. No son citas textuales. Los prompts de las fases 5 y 6 sí lo son.

El detalle de cómo evolucionaron las decisiones de protocolos está en `FASES_RECALIBRACION.md`. Aquí registro la consulta, el prompt y qué hice con la respuesta.

## Qué se hizo sin asistencia

- Estructura del proyecto y módulo de radar: modelo, controlador, router y DTO, escritos a mano.
- Tipos de dominio finales: `IScan`, `ICoordinate`, `IEnemies` y `TProtocol`, separados a mano a partir de un primer borrador demasiado grueso.
- Elección de la arquitectura de protocolos: mapa de nombre a función, y aplicación en el orden recibido. La unidad opinó; la decisión fue mía.
- Reglas de cada protocolo y la restricción de distancia (ignorar puntos a más de 100, e ignorar puntos sin enemigos), implementadas en `src/common/protocols.ts`.

## 0. El cuerpo del POST no llegaba

**Directriz.** Al probar las peticiones, `req.body` llegaba vacío. Se pidió el diagnóstico, no una reescritura del servidor.

**Prompt (reconstrucción).**

```text
When setting up the project and firing requests, I am not getting the body in the POST. Why?
```

**Resultado.** La causa era la ausencia de `app.use(express.json())` en `index.ts`. Lo había omitido en el primer arranque.

**Recalibración.** Añadí el middleware de JSON (y el de `urlencoded`) antes de montar las rutas. No hizo falta cambiar los controladores: el fallo estaba en la entrada de Express, no en la lógica de radar.

## 1. Tipos compartidos

**Directriz.** Generar los tipos del dominio a partir del contrato del enunciado. En ese momento bastaban dos piezas: lo que entra al radar y lo que se persiste en auditoría.

**Prompt (reconstrucción).**

```text
Generate the TypeScript types for this module. I need two interfaces: one for Radar and one for Audit.
Radar receives protocols and a scan of points. Each point has coordinates, enemies and, optionally, allies.
Audit stores the input, the output and the creation date.
```

**Resultado.** La unidad devolvió dos interfaces, `Radar` y `Audit`, con los campos anidados dentro de la misma declaración.

**Recalibración.** No acepté ese corte. Lo reescribí a mano en `src/common/types/index.ts`:

- `IRadar` quedó como agregado: protocolos y lista de puntos.
- El punto pasó a `IScan`.
- Las coordenadas pasaron a `ICoordinate`.
- El enemigo pasó a `IEnemies`.
- Los seis protocolos del enunciado pasaron a la unión `TProtocol`, para que un nombre fuera del contrato no tipe.

El motivo: el enunciado trata coordenadas, enemigos y protocolos como conceptos distintos, y el filtro de protocolos necesita esos tipos por separado. Dejarlos embebidos en dos interfaces obligaba a repetir la forma en el DTO, en el esquema y en los filtros.

## 2. Módulo de auditoría

**Directriz.** El módulo de radar ya existía, escrito a mano. La auditoría es un CRUD pequeño con la misma forma (modelo, controlador, router, DTO). Se pidió generarlo siguiendo esa estructura, no rediseñar el radar.

**Prompt (reconstrucción).**

```text
I created the radar module by hand. Generate the audit module with the same structure: model, controller, router and DTO. It is a basic CRUD, keep it simple.
```

**Resultado.** La unidad creó `src/modules/audit/` con el esqueleto del módulo.

**Recalibración.** Al revisar el código generado y probar los endpoints, vi que algunas operaciones estaban incompletas. El controlador buscaba un id fijo (`33`), respondía `{ message: 'Hello' }` y el `try/catch` de la lectura por id estaba vacío. No había ruta de borrado y `AuditDTO` estaba vacío. Por eso hice una segunda consulta, en la fase 5, especificando exactamente qué necesitaba corregir. El esquema, además, declaraba `input` y `output` como `type: JSON`, que no es un tipo de Mongoose.

## 3. Arquitectura de los protocolos

**Directriz.** Llegué con tres opciones ya pensadas. Quería contraste, no que la unidad eligiera el diseño desde cero. Restricción: varios protocolos en una misma petición, y el resultado tiene que ser un solo punto `{ x, y }`.

**Prompt (reconstrucción).**

```text
I am deciding how to handle the protocols. I see three options:
1. A map: protocol name as key, function as value.
2. A standalone function for each filter.
3. A switch.

Which one fits better here, and why?
```

**Resultado.** La unidad coincidió con el mapa. Ya me inclinaba por esa opción y la mantuve. Quedó en `protocolFilters`. El motivo está en `FASES_RECALIBRACION.md`, en «Elección del mapa».

**Segunda orden, sobre varios protocolos a la vez (reconstrucción).**

```text
When the request includes several protocols, I am thinking of a weight system: assign a weight to each protocol and sort the points by that score. Is that a good way to combine them?
```

**Resultado.** La unidad desaconsejó los pesos. Descarté la idea y apliqué los protocolos en el orden de la petición. La justificación está en `FASES_RECALIBRACION.md`, en «Descartar el sistema de pesos».

## 4. El bucle no encadenaba la lista

**Directriz.** Los tests fallaban cuando había varios protocolos. No veía la causa. Pedí que localizara el fallo en `processProtocol`, no que reescribiera el módulo.

**Prompt (reconstrucción).** Solo el síntoma. En ese momento no había identificado la causa.

```text
Im having an issue with my processProtocol function. When running the tests it looks like the protocols are not being applied correctly when there are multiple ones. Can you help me find whats wrong?
```

**Resultado.** La unidad señaló el bucle: en cada vuelta no se pasaba el array ya actualizado, así que cada protocolo volvía a recibir la lista original.

**Recalibración.** Guardé el retorno de cada función y lo usé como entrada de la siguiente. El cambio y cómo queda la propagación están en `FASES_RECALIBRACION.md`, en «Corregir el bucle de `processProtocol`».

## 5. Lectura, borrado y DTO de auditoría

**Directriz.** Corregir el controlador para que la lectura y el borrado usen el id real y devuelvan el documento. Completar el DTO. No se pidió rehacer el alta: el radar ya persiste la auditoría al calcular un objetivo.

**Prompt (textual).**

```text
please fix the audfit controller so that the correctly retreive and delete the Audits

also, complete the DTO on audit
```

**Resultado.** La unidad reescribió el controlador y el router, rellenó el DTO y cambió el tipo del esquema.

**Qué quedó, y qué se decidió por encima del borrador anterior.**

- `GET /audit` devuelve todas las auditorías, de la más reciente a la más antigua.
- `GET /audit/:id` devuelve una. Id inválido: 400. Id inexistente: 404.
- `DELETE /audit/:id` borra y devuelve el documento eliminado, con los mismos 400 y 404.
- `AuditDTO` describe lo que realmente se guarda: `id`, `input` (`protocols` y `scan`), `output` (`x`, `y`) y `createdAt`. Usa `TProtocol`, `IScan` e `ICoordinate`, los tipos que separé a mano en la fase 1.
- El esquema pasó de `type: JSON` a `Schema.Types.Mixed` en `input` y `output`. Esa corrección no estaba en la orden. `JSON` no es un tipo de Mongoose, y sin un tipo mixto el documento no conserva el payload. `Mixed` guarda el input y el output de cada cálculo tal como llegaron. No valida que tengan la forma del DTO. Lo acepto porque lo que quiero conservar es el cálculo original, no un esquema rígido.
- `POST /audit` guarda `input`, `output` y `createdAt`. El radar también crea la auditoría cuando devuelve un objetivo.

## 6. Esta bitácora

**Directriz.** Redactar el documento de auditoría del proceso con el formato del enunciado: directrices, recalibraciones y prompts. Aporté el relato de las fases 0 a 4 porque el historial no se había guardado.

**Prompt (textual).** Se adjuntó el apartado «Sobre el uso de droides de asistencia (IA)» del enunciado, y a continuación:

```text
So since I didnt saved them im going to kind of guide youi thru the use of ai
0.When setting up the project and firuing requests, i was not gettinfg the body in the post so I asked ai why, it was do to the app.use(express.json()); not being used which I completely forgot about on first instance
1.The first use of ai was generating the Types inside common types. This were first only two interfaces, Radar and Audit interfaces, but then I correct it yb hand, creating the specfic subinterfaces for Scan, Coordindate, Enemies and also TProtocol

2.The scafolding was created by hand, except for the audit module which, once i created the radar module by hand, i let AI genrate it for me as its a basic crud and not that complex

3.The next use wasa doubt I had when it comes to the protocol handling architecture
I propose to the ai 3 patterns, a map/object patters, with the protocl name as key and function as value, then standolone functions for each foilter and lastly a switch
I chose the map pattern and ai agreed with that choise as it s easily extendable
Aditionally, when it comes to handling multiple protocols I asked the ai about the best way of handling them, I proposed a weights sort of system, assigning weights to each prtocol. This turn out to be not that good idea as ai let me know


4.The next query was for a bug I did not see, basically upon running tests, on the porcess protiocol fucntion, I did not realized that I was not passing the protocolsFilters on each for iteration which caused the processed array to be always the original protocols array

Provide an MD document please
```

**Recalibración.** Los prompts 0 a 4 se publican como reconstrucción, no como cita de un chat desaparecido. Donde la unidad se desvió (CRUD de auditoría incompleto, tipo `JSON` en el esquema), lo dejo escrito y la decisión final es mía.

## Criterio aplicado

| Fase | Qué se pidió | Qué se rechazó o se corrigió | Quién decidió |
| --- | --- | --- | --- |
| 0 | Diagnosticar el POST sin cuerpo | No reescribir el servidor; solo añadir `express.json()` | Yo, tras el diagnóstico |
| 1 | Dos interfaces iniciales | Las partí a mano en tipos de punto, coordenada, enemigo y protocolo | Yo, por encima del borrador |
| 2 y 5 | CRUD de auditoría con la forma del radar | Id fijo, respuesta vacía, DTO vacío y tipo de esquema inválido. Lo vi al revisar y probar los endpoints | Yo fijé el alcance; la unidad aplicó la corrección |
| 3 | Elegir entre mapa, funciones sueltas y `switch` | Descarté el sistema de pesos para combinar protocolos | Yo; la unidad confirmó el mapa y desaconsejó los pesos |
| 4 | Localizar un fallo de tests con varios protocolos | En cada vuelta se pasaba la lista original, no la ya actualizada | Yo vi el síntoma; la unidad señaló el bucle |

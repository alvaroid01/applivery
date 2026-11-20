# Manual de ejecución

## Requisitos

- Node.js 22 o superior
- npm

## Instalación

En la raíz del proyecto:

```bash
npm install
```

## Configuración de MongoDB

La conexión se lee de las variables de entorno. En local están en `.env`:

```env
PORT=8888
MONGODB_USER=applivery
MONGODB_PASSWORD=applivery
MONGODB_HOST=applivercluster.yqpvtl0.mongodb.net
```

`MONGODB_USER`, `MONGODB_PASSWORD` y `MONGODB_HOST` son obligatorias. Si falta alguna, el proceso se detiene al arrancar. `MONGODB_HOST` es solo el hostname, sin `mongodb+srv://` y sin usuario ni contraseña.

En Atlas, Network Access tiene que permitir la IP desde la que se conecta el proceso. En Railway hace falta `0.0.0.0/0`, porque el servidor no sale por la IP de casa.

En Railway no se sube el fichero `.env`. Las tres variables de Mongo se configuran en el servicio. `PORT` lo asigna Railway; no hace falta definirlo allí.

## Arranque

Desarrollo, con recarga:

```bash
npm run dev
```

Arranque sin recarga. Es el comando que usa Railway:

```bash
npm start
```

En local la API escucha en el puerto 8888. En Railway escucha en el `PORT` que inyecta la plataforma.

Comprobación:

```bash
curl http://localhost:8888/openapi.json
```

Documentación local: [http://localhost:8888/api-docs/](http://localhost:8888/api-docs/)

Documentación desplegada: [https://applivery-production.up.railway.app/api-docs/](https://applivery-production.up.railway.app/api-docs/)

## Tests

Pruebas unitarias. No abren conexión con MongoDB:

```bash
npm test
```

Casos oficiales de radar. El servidor tiene que estar arrancado en el puerto 8888:

```bash
./tests.sh
```

El script lee `test_cases.txt`, envía cada caso a `POST /radar` y compara la respuesta con las coordenadas esperadas.

## Auditoría

Cada `POST /radar` que devuelve un objetivo guarda un registro. Estos tres endpoints lo consultan y lo borran.

Listar, el más reciente primero:

```bash
curl http://localhost:8888/audit
```

Consultar uno por id:

```bash
curl http://localhost:8888/audit/EL_ID
```

Eliminar uno. La respuesta es el registro borrado:

```bash
curl -X DELETE http://localhost:8888/audit/EL_ID
```

Un id que no es un ObjectId responde `400` con `Invalid audit id`. Un id válido que no existe responde `404` con `Audit not found`.

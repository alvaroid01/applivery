# YVH Radar API

Selects the next point to attack from a radar scan and stores each calculation as an audit.

## Requirements

- Node.js 22 or newer
- npm

## Install

```bash
npm install
```

## Database

The app reads the connection settings from `.env` in the project root.

```env
PORT=8888
MONGODB_USER=applivery
MONGODB_PASSWORD=applivery
MONGODB_HOST=applivercluster.yqpvtl0.mongodb.net
```

`MONGODB_USER`, `MONGODB_PASSWORD`, and `MONGODB_HOST` are required. The process exits if any of them is missing.

## Start

```bash
npm run dev
```

`npm start` runs the same server without reloading. Railway uses that command.

The API listens on `PORT` from the environment, or 8888 when it is not set.

## Tests

```bash
npm test
```

The tests mock the database. They do not connect to MongoDB.

## API docs

Local Swagger UI: [http://localhost:8888/api-docs/](http://localhost:8888/api-docs/)

Local OpenAPI document: [http://localhost:8888/openapi.json](http://localhost:8888/openapi.json)

Deployed Swagger UI: [https://applivery-production.up.railway.app/api-docs/](https://applivery-production.up.railway.app/api-docs/)

Deployed OpenAPI document: [https://applivery-production.up.railway.app/openapi.json](https://applivery-production.up.railway.app/openapi.json)

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/radar` | Returns the coordinates of the next target |
| `GET` | `/audit` | Lists audits, newest first |
| `GET` | `/audit/:id` | Returns one audit |
| `DELETE` | `/audit/:id` | Deletes one audit and returns it |
| `POST` | `/audit` | Stores an audit with input and output |

`POST /radar` example:

```bash
curl -X POST http://localhost:8888/radar \
  -H "Content-Type: application/json" \
  -d '{"protocols":["avoid-mech"],"scan":[{"coordinates":{"x":0,"y":40},"enemies":{"type":"soldier","number":10}},{"coordinates":{"x":0,"y":80},"allies":5,"enemies":{"type":"mech","number":1}}]}'
```

Response:

```json
{"x":0,"y":40}
```

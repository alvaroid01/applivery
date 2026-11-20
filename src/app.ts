import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/openapi.ts';
import { auditRouter } from './modules/audit/audit.router.ts';
import { radarRouter } from './modules/radar/radar.router.ts';

export const createApp = () => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.get('/openapi.json', (_req, res) => {
        res.json(openApiSpec);
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    app.use(auditRouter);
    app.use(radarRouter);

    return app;
};

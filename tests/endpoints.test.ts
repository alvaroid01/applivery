import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { Express } from 'express';
import request from 'supertest';

type AuditRecord = {
    id: string;
    input: {
        protocols: string[];
        scan: unknown[];
    };
    output: { x: number; y: number };
    createdAt: Date;
};

const audits: AuditRecord[] = [];
const radarCreates: unknown[] = [];
const sortCalls: unknown[] = [];
let failAuditCreate = false;

const auditModel = {
    find: () => ({
        sort: (criteria: unknown) => {
            sortCalls.push(criteria);
            return Promise.resolve(
                [...audits].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
            );
        },
    }),
    findById: (id: string) => Promise.resolve(audits.find(audit => audit.id === id) ?? null),
    findByIdAndDelete: (id: string) => {
        const index = audits.findIndex(audit => audit.id === id);
        if (index === -1) return Promise.resolve(null);
        const [removed] = audits.splice(index, 1);
        return Promise.resolve(removed ?? null);
    },
    create: (doc: Omit<AuditRecord, 'id'>) => {
        if (failAuditCreate) return Promise.reject(new Error('db down'));
        const created = { ...doc, id: '507f1f77bcf86cd799439099' };
        audits.push(created);
        return Promise.resolve(created);
    },
};

const radarModel = {
    create: (doc: unknown) => {
        radarCreates.push(doc);
        return Promise.resolve(doc);
    },
};

mock.module('../src/modules/audit/audit.model.ts', {
    cache: true,
    exports: { Audit: auditModel },
});

mock.module('../src/modules/radar/radar.model.ts', {
    cache: true,
    exports: { Radar: radarModel },
});

const { createApp } = await import('../src/app.ts');
const app = createApp() as Express;

const auditId = '507f1f77bcf86cd799439011';
const scan = [
    {
        coordinates: { x: 0, y: 40 },
        enemies: { type: 'soldier', number: 10 },
    },
    {
        coordinates: { x: 0, y: 80 },
        allies: 5,
        enemies: { type: 'mech', number: 1 },
    },
];

const storedAudit = (createdAt: Date, id = auditId): AuditRecord => ({
    id,
    input: { protocols: ['avoid-mech'], scan },
    output: { x: 0, y: 40 },
    createdAt,
});

beforeEach(() => {
    audits.length = 0;
    radarCreates.length = 0;
    sortCalls.length = 0;
    failAuditCreate = false;
});

describe('POST /radar', () => {
    it('returns the coordinates and stores the radar and the audit', async () => {
        const response = await request(app).post('/radar').send({ protocols: ['avoid-mech'], scan });

        assert.equal(response.status, 200);
        assert.deepEqual(response.body, { x: 0, y: 40 });
        assert.deepEqual(radarCreates, [{ protocols: ['avoid-mech'], scan }]);
        assert.equal(audits.length, 1);
        assert.deepEqual(audits[0]?.input, { protocols: ['avoid-mech'], scan });
        assert.deepEqual(audits[0]?.output, { x: 0, y: 40 });
    });

    it('rejects an empty protocol list', async () => {
        const response = await request(app).post('/radar').send({ protocols: [], scan });

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, {
            code: 400,
            message: 'Protocols must not be empty. Provide at least one protocol',
        });
        assert.equal(radarCreates.length, 0);
    });

    it('rejects an empty scan', async () => {
        const response = await request(app)
            .post('/radar')
            .send({ protocols: ['avoid-mech'], scan: [] });

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, {
            code: 400,
            message: 'Scan must not be empty. Provide at least one scan',
        });
    });

    it('keeps the scan when assist-allies finds no allies', async () => {
        const response = await request(app)
            .post('/radar')
            .send({
                protocols: ['assist-allies'],
                scan: [
                    { coordinates: { x: 0, y: 40 }, enemies: { type: 'soldier', number: 10 } },
                    { coordinates: { x: 0, y: 10 }, enemies: { type: 'soldier', number: 5 } },
                ],
            });

        assert.equal(response.status, 200);
        assert.deepEqual(response.body, { x: 0, y: 40 });
    });

    it('returns 400 when every point is filtered out', async () => {
        const response = await request(app)
            .post('/radar')
            .send({
                protocols: ['avoid-mech'],
                scan: [{ coordinates: { x: 0, y: 40 }, enemies: { type: 'mech', number: 1 } }],
            });

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, { code: 400, message: 'No valid target found' });
        assert.equal(radarCreates.length, 0);
        assert.equal(audits.length, 0);
    });

    it('returns 500 when the audit cannot be stored', async () => {
        failAuditCreate = true;

        const response = await request(app).post('/radar').send({ protocols: ['avoid-mech'], scan });

        assert.equal(response.status, 500);
        assert.equal(response.body.code, 500);
    });
});

describe('GET /audit', () => {
    it('returns audits newest first', async () => {
        audits.push(storedAudit(new Date('2026-01-01T00:00:00.000Z'), '507f1f77bcf86cd799439012'));
        audits.push(storedAudit(new Date('2026-06-01T00:00:00.000Z'), auditId));

        const response = await request(app).get('/audit');

        assert.equal(response.status, 200);
        assert.deepEqual(sortCalls, [{ createdAt: -1 }]);
        assert.deepEqual(
            response.body.map((audit: { id: string }) => audit.id),
            [auditId, '507f1f77bcf86cd799439012'],
        );
    });
});

describe('GET /audit/:id', () => {
    it('returns the audit', async () => {
        const createdAt = new Date('2026-01-01T00:00:00.000Z');
        audits.push(storedAudit(createdAt));

        const response = await request(app).get(`/audit/${auditId}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.id, auditId);
        assert.deepEqual(response.body.output, { x: 0, y: 40 });
        assert.equal(response.body.createdAt, createdAt.toISOString());
    });

    it('rejects an invalid id', async () => {
        const response = await request(app).get('/audit/not-an-id');

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, { code: 400, message: 'Invalid audit id' });
    });

    it('returns 404 when the audit does not exist', async () => {
        const response = await request(app).get(`/audit/${auditId}`);

        assert.equal(response.status, 404);
        assert.deepEqual(response.body, { code: 404, message: 'Audit not found' });
    });
});

describe('DELETE /audit/:id', () => {
    it('deletes the audit and returns it', async () => {
        audits.push(storedAudit(new Date('2026-01-01T00:00:00.000Z')));

        const response = await request(app).delete(`/audit/${auditId}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.id, auditId);
        assert.equal(audits.length, 0);
    });

    it('rejects an invalid id', async () => {
        const response = await request(app).delete('/audit/not-an-id');

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, { code: 400, message: 'Invalid audit id' });
    });

    it('returns 404 when the audit does not exist', async () => {
        const response = await request(app).delete(`/audit/${auditId}`);

        assert.equal(response.status, 404);
        assert.deepEqual(response.body, { code: 404, message: 'Audit not found' });
    });
});

describe('POST /audit', () => {
    it('stores an audit', async () => {
        const response = await request(app)
            .post('/audit')
            .send({
                input: { protocols: ['avoid-mech'], scan },
                output: { x: 0, y: 40 },
            });

        assert.equal(response.status, 201);
        assert.equal(response.body.output.x, 0);
        assert.equal(audits.length, 1);
    });

    it('rejects a body without output', async () => {
        const response = await request(app).post('/audit').send({});

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, { code: 400, message: 'input and output are required' });
    });
});

describe('API docs', () => {
    it('serves the OpenAPI document', async () => {
        const response = await request(app).get('/openapi.json');

        assert.equal(response.status, 200);
        assert.equal(response.body.openapi, '3.0.3');
        assert.deepEqual(Object.keys(response.body.paths).sort(), ['/audit', '/audit/{id}', '/radar']);
    });

    it('serves Swagger UI', async () => {
        const response = await request(app).get('/api-docs/');

        assert.equal(response.status, 200);
        assert.match(response.headers['content-type'] ?? '', /html/);
        assert.match(response.text, /swagger-ui/);
    });
});

const protocolNames = [
    'closest-enemies',
    'furthest-enemies',
    'assist-allies',
    'avoid-crossfire',
    'prioritize-mech',
    'avoid-mech',
];

const coordinate = {
    type: 'object',
    required: ['x', 'y'],
    properties: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
};

const scanPoint = {
    type: 'object',
    required: ['coordinates', 'enemies'],
    properties: {
        coordinates: coordinate,
        enemies: {
            type: 'object',
            required: ['type', 'number'],
            properties: {
                type: { type: 'string', enum: ['soldier', 'mech'] },
                number: { type: 'integer', minimum: 0 },
            },
        },
        allies: { type: 'integer', minimum: 0 },
    },
};

const error = {
    type: 'object',
    required: ['code', 'message'],
    properties: {
        code: { type: 'integer' },
        message: { type: 'string' },
    },
};

const radarExample = {
    protocols: ['avoid-mech'],
    scan: [
        {
            coordinates: { x: 0, y: 40 },
            enemies: { type: 'soldier', number: 10 },
        },
        {
            coordinates: { x: 0, y: 80 },
            allies: 5,
            enemies: { type: 'mech', number: 1 },
        },
    ],
};

export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'YVH Radar API',
        version: '1.0.0',
        description: 'Radar target selection and audit log.',
    },
    servers: [{ url: '/' }],
    tags: [
        { name: 'Radar', description: 'Choose the next point to attack' },
        { name: 'Audit', description: 'Read and delete stored calculations' },
    ],
    paths: {
        '/radar': {
            post: {
                tags: ['Radar'],
                summary: 'Select the next target',
                operationId: 'createRadar',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RadarRequest' },
                            example: radarExample,
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Coordinates of the point to attack',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Coordinate' },
                                example: { x: 0, y: 40 },
                            },
                        },
                    },
                    '400': {
                        description: 'Protocols or scan is missing or empty, or no point remains',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    '500': {
                        description: 'The target could not be calculated or stored',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
        '/audit': {
            get: {
                tags: ['Audit'],
                summary: 'List audits',
                operationId: 'getAudit',
                responses: {
                    '200': {
                        description: 'Audits, newest first',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Audit' },
                                },
                            },
                        },
                    },
                    '500': {
                        description: 'The audits could not be read',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Audit'],
                summary: 'Store an audit',
                operationId: 'createAudit',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['input', 'output'],
                                properties: {
                                    input: { $ref: '#/components/schemas/RadarRequest' },
                                    output: { $ref: '#/components/schemas/Coordinate' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'The stored audit',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Audit' },
                            },
                        },
                    },
                    '400': {
                        description: 'input or output is missing',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                                example: { code: 400, message: 'input and output are required' },
                            },
                        },
                    },
                },
            },
        },
        '/audit/{id}': {
            get: {
                tags: ['Audit'],
                summary: 'Get one audit',
                operationId: 'getAuditById',
                parameters: [{ $ref: '#/components/parameters/AuditId' }],
                responses: {
                    '200': {
                        description: 'The audit',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Audit' },
                            },
                        },
                    },
                    '400': {
                        description: 'The id is not a valid ObjectId',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                                example: { code: 400, message: 'Invalid audit id' },
                            },
                        },
                    },
                    '404': {
                        description: 'No audit with that id',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                                example: { code: 404, message: 'Audit not found' },
                            },
                        },
                    },
                    '500': {
                        description: 'The audit could not be read',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Audit'],
                summary: 'Delete one audit',
                operationId: 'deleteAudit',
                parameters: [{ $ref: '#/components/parameters/AuditId' }],
                responses: {
                    '200': {
                        description: 'The deleted audit',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Audit' },
                            },
                        },
                    },
                    '400': {
                        description: 'The id is not a valid ObjectId',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                                example: { code: 400, message: 'Invalid audit id' },
                            },
                        },
                    },
                    '404': {
                        description: 'No audit with that id',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                                example: { code: 404, message: 'Audit not found' },
                            },
                        },
                    },
                    '500': {
                        description: 'The audit could not be deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        parameters: {
            AuditId: {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                example: '507f1f77bcf86cd799439011',
            },
        },
        schemas: {
            Coordinate: coordinate,
            Error: error,
            RadarRequest: {
                type: 'object',
                required: ['protocols', 'scan'],
                properties: {
                    protocols: {
                        type: 'array',
                        minItems: 1,
                        items: { type: 'string', enum: protocolNames },
                    },
                    scan: {
                        type: 'array',
                        minItems: 1,
                        items: scanPoint,
                    },
                },
            },
            Audit: {
                type: 'object',
                required: ['id', 'input', 'output', 'createdAt'],
                properties: {
                    id: { type: 'string' },
                    input: { $ref: '#/components/schemas/RadarRequest' },
                    output: { $ref: '#/components/schemas/Coordinate' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
};

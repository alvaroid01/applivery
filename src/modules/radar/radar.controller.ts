import { type Request, type Response } from 'express';

import { processProtocol, protocolFilters } from '../../common/protocols.ts';
import type { IScan, TProtocol } from '../../common/types/index.ts';
import { Radar } from './radar.model.ts';
import { Audit } from '../audit/audit.model.ts';

/* 
Constraints
-Multiple protocols in the request
-Multiple scan objects in the request
-Protocols should be compatible (must stablish a priority?)
-If distance >100 then ignore them
-Persist in db (MongoDB)
*/
export const createRadar = async (req: Request, res: Response) => {
    const body = req.body as { protocols?: TProtocol[]; scan?: IScan[] } | undefined;
    const { protocols, scan } = body ?? {};

    if (!body) {
        res.status(400).send({ code: 400, message: 'Payload must not be empty' });
        return;
    }
    if (!Array.isArray(protocols) || protocols.length === 0) {
        res.status(400).send({ code: 400, message: 'Protocols must not be empty. Provide at least one protocol' });
        return;
    }
    if (!Array.isArray(scan) || scan.length === 0) {
        res.status(400).send({ code: 400, message: 'Scan must not be empty. Provide at least one scan' });
        return;
    }
    if (protocols.some(protocol => !protocolFilters[protocol])) {
        res.status(400).json({ code: 400, message: 'Unknown protocol' });
        return;
    }
    try {
        const response = processProtocol(protocols, scan);
        if (!response) {
            res.status(400).json({ code: 400, message: 'No valid target found' });
            return;
        }
        await Radar.create({ protocols, scan });
        await Audit.create({
            input: { protocols, scan },
            output: response,
            createdAt: new Date().toISOString(),
        });
        res.status(200).json(response);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        res.status(500).json({ code: 500, message });
    }
};

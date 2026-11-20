import { type Request, type Response } from 'express';

import { proccessProtocol } from '../../common/protocols.ts';
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
    const body = req.body;
    const { protocols, scan } = body as any;

    if (!body) {
        res.status(400).send({ code: 400, message: 'Payload must not be empty' });
        return;
    }
    if (!protocols || protocols.length === 0) {
        res.status(400).send({ code: 400, message: 'Protocols must not be empty. Provide at least one protocol' });
        return;
    }
    if (!scan || scan.length === 0) {
        res.status(400).send({ code: 400, message: 'Scan must not be empty. Provide at least one scan' });
        return;
    }
    try {
        const response = proccessProtocol(protocols, scan);
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
    } catch (error: any) {
        res.status(500).json({ code: 500, message: error });
    }
};

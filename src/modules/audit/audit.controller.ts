import { type Request, type Response } from 'express';
import mongoose, { type HydratedDocument } from 'mongoose';
import type { IAudit } from '../../common/types/index.ts';
import type { AuditDTO } from './audit.dto.ts';
import { Audit } from './audit.model.ts';

const toAuditDTO = (audit: HydratedDocument<IAudit>): AuditDTO => ({
    id: audit.id,
    input: audit.input,
    output: audit.output,
    createdAt: audit.createdAt,
});

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unexpected error');

export const getAudit = async (_req: Request, res: Response) => {
    try {
        const audits = await Audit.find().sort({ createdAt: -1 });
        res.status(200).json(audits.map(toAuditDTO));
    } catch (error: unknown) {
        res.status(500).json({ code: 500, message: getErrorMessage(error) });
    }
};

export const getAuditById = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ code: 400, message: 'Invalid audit id' });
            return;
        }

        const audit = await Audit.findById(id);

        if (!audit) {
            res.status(404).json({ code: 404, message: 'Audit not found' });
            return;
        }

        res.status(200).json(toAuditDTO(audit));
    } catch (error: unknown) {
        res.status(500).json({ code: 500, message: getErrorMessage(error) });
    }
};

export const deleteAudit = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ code: 400, message: 'Invalid audit id' });
            return;
        }

        const audit = await Audit.findByIdAndDelete(id);

        if (!audit) {
            res.status(404).json({ code: 404, message: 'Audit not found' });
            return;
        }

        res.status(200).json(toAuditDTO(audit));
    } catch (error: unknown) {
        res.status(500).json({ code: 500, message: getErrorMessage(error) });
    }
};

export const createAudit = async (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Hello' });
};

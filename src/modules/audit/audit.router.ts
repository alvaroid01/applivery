import { Router } from 'express';
import { createAudit, deleteAudit, getAudit, getAuditById } from './audit.controller.ts';

export const auditRouter = Router();

auditRouter.get('/audit', getAudit);
auditRouter.get('/audit/:id', getAuditById);
auditRouter.delete('/audit/:id', deleteAudit);
auditRouter.post('/audit', createAudit);

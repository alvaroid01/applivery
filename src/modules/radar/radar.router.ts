import { Router } from 'express';
import { createRadar } from './radar.controller.ts';

export const radarRouter = Router();

radarRouter.post('/radar', createRadar);

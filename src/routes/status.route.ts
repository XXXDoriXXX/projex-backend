import { Router } from 'express';
import { getServerStatus } from '../controllers/status.controller.js';

const router = Router();

router.get('/', getServerStatus);

export default router;

import { Router } from 'express';
import { getServerStatus } from '../controllers/status.controller';

const router = Router();

router.get('/', getServerStatus);

export default router;

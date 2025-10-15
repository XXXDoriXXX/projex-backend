import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = container.resolve(UserController);

router.get('/:username', userController.getUserProfile);

export default router;
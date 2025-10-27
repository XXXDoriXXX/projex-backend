import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller';
import {optionalAuthenticate} from "../middleware/auth";

const router = Router();
const userController = container.resolve(UserController);

router.get('/username/:username', optionalAuthenticate,userController.getUserProfile);
router.get('/email/:email', userController.getUserByEmail);
export default router;
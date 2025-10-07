import {Router} from "express";
import {container} from "tsyringe";
import {authenticate} from "../middleware/auth";
import {authController} from "../controllers/auth.controller";

const authctrl = container.resolve(authController);

const router = Router();
router.get('/get', authenticate,authctrl.getUser);
router.post('/login', authctrl.login);
export default router;

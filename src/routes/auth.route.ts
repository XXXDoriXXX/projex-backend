import {Router} from "express";
import {container} from "tsyringe";
import {authenticate} from "../middleware/auth";
import {authController} from "../controllers/auth.controller";

const authctrl = container.resolve(authController);

const router = Router();
router.get('/me', authenticate,authctrl.getUser);
router.post('/login', authctrl.login);
router.post('/register', authctrl.register);
router.post('/send-verification-code', authenticate,authctrl.sendVerificationCode);
router.post('/verify-email', authenticate,authctrl.verifyEmail);
router.post('/send-reset-password', authenticate,authctrl.sendPasswordResetCode);
router.post('/reset-password', authenticate,authctrl.resetPassword);
router.post('/google', authctrl.googleAuth);
router.get('/github', authctrl.githubAuth);
export default router;

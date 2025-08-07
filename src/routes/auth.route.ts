import {Router} from 'express';
import {
    confirmResetPassword,
    getCurrentUser, githubLogin,
    googleLogin,
    login, sendResetPassword,
    sendVerificationCode,
    signUp,
    verifyEmail
} from "../controllers/auth.controller";
import {authenticate} from "../middleware/auth";
const router =  Router();

router.post('/google',googleLogin );
router.post('/register', signUp);
router.post('/login', login);
router.post('/verify-email/:token', authenticate,verifyEmail);
router.post('/send-verification-code', authenticate,sendVerificationCode);
router.post('/me', authenticate, getCurrentUser);
router.get('/github/callback', githubLogin);
router.get('/password/resetcode', authenticate,sendResetPassword);
router.post('/resetpassword',authenticate, confirmResetPassword);
export default router;


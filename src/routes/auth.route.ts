import {Router} from 'express';
import {
    getCurrentUser, githubLogin,
    googleLogin,
    login,
    sendVerificationCode,
    signUp,
    verifyEmail
} from "../controllers/auth.controller";
import {authenticate} from "../middleware/auth";
const router =  Router();

router.post('/google',googleLogin );
router.post('/register', signUp);
router.post('/login', login);
router.post('/verify-email/:token', verifyEmail);
router.post('/send-verification-code', authenticate,sendVerificationCode);
router.post('/me', authenticate, getCurrentUser);
router.get('/github/callback', githubLogin);
export default router;


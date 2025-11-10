import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller';
import { optionalAuthenticate, authenticate } from "../middleware/auth";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const userController = container.resolve(UserController);

router.get('/username/:username', optionalAuthenticate, userController.getUserProfile);
router.get('/email/:email', userController.getUserByEmail);

router.put('/profile', authenticate, userController.updateUserProfile);

router.post('/social', authenticate, userController.addSocialLink);

router.delete('/social/:socialMediaId', authenticate, userController.deleteSocialLink);

router.post('/avatar', authenticate, upload.single('avatar'), userController.updateUserAvatar);
export default router;

import 'reflect-metadata';
import { Router } from 'express';
import { container } from 'tsyringe';
import { authenticate } from '../middleware/auth';
import { HackathonController } from '../controllers/hackathon.controller';

const hackathonController = container.resolve(HackathonController);

const router = Router();

router.post('/', authenticate, hackathonController.createHackathon);
router.put('/:id', authenticate, hackathonController.updateHackathon);
router.delete('/:id', authenticate, hackathonController.deleteHackathon);
router.get('/', hackathonController.getAllHackathons);
router.get('/:id', hackathonController.getHackathonById);
router.patch('/:id/status', authenticate, hackathonController.updateHackathonStatus);
router.post('/:id/join', authenticate, hackathonController.joinHackathon);
router.delete('/:id/leave', authenticate, hackathonController.leaveHackathon);
router.post('/:id/submit', authenticate, hackathonController.submitProject);
router.delete('/project/:hpId', authenticate, hackathonController.removeProject);
router.post('/project/:hpId/rate', authenticate, hackathonController.rateProject);
router.get('/:id/leaderboard', hackathonController.getLeaderboard);
router.get('/categories/themes', hackathonController.getThemeCategories);
router.get('/categories/ratings', hackathonController.getRatingCategories);
router.get('/:id/my-projects', authenticate, hackathonController.getMyProjects);
export default router;
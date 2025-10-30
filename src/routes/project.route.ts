import 'reflect-metadata';

import { Router } from 'express';

import { validateProject } from '../middleware/project/validateProject';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { ProjectController } from '../controllers/project.controller';
import { container } from 'tsyringe';
import multer from "multer";
const projectController = container.resolve(ProjectController);
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', projectController.getAllProjects);
router.post('/create', validateProject, authenticate, projectController.createProject);
router.get('/user/:id', projectController.getUserProjects);
router.delete('/:id', authenticate, projectController.deleteProject);
router.put('/:id', validateProject, authenticate, projectController.updateProject);
router.get('/get/:id', optionalAuthenticate, projectController.getProjectById);
router.get('/get/:id/:token', optionalAuthenticate, projectController.getProjectById);

router.patch('/visible/:id', authenticate, projectController.changeProjectVisibility);
router.post('/like/:id', authenticate, projectController.likeProject);
router.delete('/like/:id', authenticate, projectController.unlikeProject);
router.post('/view/:id', optionalAuthenticate, projectController.recordProjectView);

router.get('/technology', projectController.getAllTechnologies);

router.post('/media/upload', authenticate,upload.single('file'), projectController.uploadMedia);
export default router;

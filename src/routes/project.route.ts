import {Router} from "express";

import {validateProject} from "../middleware/project/validateProject";
import {authenticate} from "../middleware/auth";
import {createProject, deleteProject} from "../controllers/project.controller";

const router =  Router();
router.post('/create',validateProject,authenticate, createProject);
router.delete('/:id',authenticate,deleteProject);
export default router;
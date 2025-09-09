import {Router} from "express";

import {validateProject} from "../middleware/project/validateProject";
import {authenticate} from "../middleware/auth";
import {createProject, deleteProject, updateProject} from "../controllers/project.controller";

const router =  Router();
router.post('/create',validateProject,authenticate, createProject);
router.delete('/:id',authenticate,deleteProject);
router.put('/:id',validateProject,authenticate,updateProject);
export default router;
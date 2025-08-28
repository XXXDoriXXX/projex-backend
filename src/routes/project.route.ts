import {Router} from "express";
import {createProject} from "../services/project.service";
import {validateProject} from "../middleware/project/validateProject";
import {authenticate} from "../middleware/auth";

const router =  Router();
router.post('/create',validateProject,authenticate, createProject);
export default router;
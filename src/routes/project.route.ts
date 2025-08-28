import {Router} from "express";
import {createProject} from "../services/project.service";

const router =  Router();
router.post('/create', createProject);
export default router;
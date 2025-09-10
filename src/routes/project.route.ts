import { Router } from "express";

import { validateProject } from "../middleware/project/validateProject.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import {
	changeProjectVisibility,
	createProject,
	deleteProject,
	getProjectById,
	getUserProjects,
	updateProject,
} from "../controllers/project.controller.js";

const router = Router();
router.post("/create", validateProject, authenticate, createProject);
router.delete("/:id", authenticate, deleteProject);
router.put("/:id", validateProject, authenticate, updateProject);
router.get("/:id", optionalAuthenticate, getProjectById);
router.get("/:id/:token", optionalAuthenticate, getProjectById);
router.get("/user/:id", getUserProjects);
router.patch("/visible/:id", authenticate, changeProjectVisibility);
export default router;

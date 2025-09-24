import { Router } from "express";

import { validateProject } from "../middleware/project/validateProject";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import {
	changeProjectVisibility,
	createProject,
	deleteProject,
	getProjectById,
	getUserProjects,
	updateProject,
	likeProject,
	unlikeProject,
	recordProjectView,
} from "../controllers/project.controller";

const router = Router();
router.post("/create", validateProject, authenticate, createProject);
router.get("/user/:id", getUserProjects);
router.delete("/:id", authenticate, deleteProject);
router.put("/:id", validateProject, authenticate, updateProject);
router.get("/get/:id", optionalAuthenticate, getProjectById);
router.get("/get/:id/:token", optionalAuthenticate, getProjectById);

router.patch("/visible/:id", authenticate, changeProjectVisibility);
router.post("/like/:id", authenticate, likeProject);
router.delete("/like/:id", authenticate, unlikeProject);
router.post("/view/:id", optionalAuthenticate, recordProjectView);
export default router;

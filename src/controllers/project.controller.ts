import { Request, Response } from "express";
import * as projectService from "../services/project.service";
import * as projectServiceLike from "../services/project.service.like";
import { AuthenticatedRequest } from "../middleware/auth";
import { CreateProjectData } from "../types/Project";
import { ProjectVisible } from "../types/ProjectVisible";
import { asyncHandler } from "../utils/asyncHandler";
import {
	ValidationError,
	NotFoundError,
	ForbiddenError,
} from "../errors/CustomErrors";

const isProjectVisible = (v: unknown): v is ProjectVisible =>
	v === "public" || v === "link" || v === "private";

export const uploadMedia = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		if (!req.body?.file) {
			throw new ValidationError("No file uploaded", "file");
		}
		// TODO: Додати S3 upload-логіку
		res.status(501).json({ success: false, message: "Not implemented" });
	},
);

export const createProject = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.userId;
		if (!userId) {
			throw new ForbiddenError("Authentication required");
		}

		const { title, description, githubUrl, demoUrl, media, technologies } =
			req.body ?? {};

		if (!title || typeof title !== "string") {
			throw new ValidationError(
				"Title is required and must be a string",
				"title",
			);
		}
		if (!description || typeof description !== "string") {
			throw new ValidationError(
				"Description is required and must be a string",
				"description",
			);
		}

		const projectData: CreateProjectData = {
			userId,
			title,
			description,
			githubUrl,
			demoUrl,
			media,
			technologies,
		};

		const project = await projectService.createProject(projectData);
		res
			.status(201)
			.json({ success: true, data: project, message: "Project created" });
	},
);

export const deleteProject = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.userId;
		if (!userId) {
			throw new ForbiddenError("Authentication required");
		}

		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const deleted = await projectService.deleteProject(projectId, userId);
		res
			.status(200)
			.json({ success: true, data: deleted, message: "Project deleted" });
	},
);

export const updateProject = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.userId;
		if (!userId) {
			throw new ForbiddenError("Authentication required");
		}

		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const { title, description, githubUrl, demoUrl, media, technologies } =
			req.body ?? {};
		if (title !== undefined && typeof title !== "string") {
			throw new ValidationError("Title must be a string", "title");
		}
		if (description !== undefined && typeof description !== "string") {
			throw new ValidationError("Description must be a string", "description");
		}

		const payload: CreateProjectData = {
			userId,
			title,
			description,
			githubUrl,
			demoUrl,
			media,
			technologies,
		} as CreateProjectData;

		const updated = await projectService.updateProject(projectId, payload);
		res
			.status(200)
			.json({ success: true, data: updated, message: "Project updated" });
	},
);

export const getProjectById = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const userId = req.user?.userId;
		const token = req.params.token;

		const project = await projectService.getProjectById(
			projectId,
			token,
			userId,
		);
		if (!project) {
			throw new NotFoundError("Project", projectId);
		}

		res.status(200).json({ success: true, data: project });
	},
);

export const getUserProjects = asyncHandler(
	async (req: Request, res: Response) => {
		const userId = req.params.id;
		if (!userId) {
			throw new ValidationError("User ID is required", "id");
		}

		const projects = await projectService.getUserProjects(userId);
		res.status(200).json({ success: true, data: projects });
	},
);

export const changeProjectVisibility = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.userId;
		if (!userId) {
			throw new ForbiddenError("Authentication required");
		}

		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const visible = req.body?.visible;
		if (!isProjectVisible(visible)) {
			throw new ValidationError("Invalid visibility option", "visible");
		}

		const updated = await projectService.changeProjectVisibility(
			projectId,
			userId,
			visible,
		);
		res
			.status(200)
			.json({ success: true, data: updated, message: "Visibility updated" });
	},
);

export const likeProject = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.userId;
		if (!userId) {
			throw new ForbiddenError("Authentication required");
		}

		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const likes = await projectServiceLike.likeProject(projectId, userId);
		res.status(200).json({ success: true, likes });
	},
);

export const unlikeProject = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.userId;
		if (!userId) {
			throw new ForbiddenError("Authentication required");
		}

		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const likes = await projectServiceLike.unlikeProject(projectId, userId);
		res.status(200).json({ success: true, likes });
	},
);

export const recordProjectView = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const projectId = req.params.id;
		if (!projectId) {
			throw new ValidationError("Project ID is required", "id");
		}

		const userId = req.user?.userId ?? undefined;

		const xff = req.headers["x-forwarded-for"] as string | undefined;
		const ipList = xff?.split(",").map((ip) => ip.trim()) || [];

		const ip = ipList[0] || req.ip;

		const view = await projectService.recordProjectView(projectId, {
			userId,
			ip,
		});

		res.status(200).json({
			success: true,
			data: {
				id: view.id,
				count: view.count,
				projectId: view.projectId,
				userId: view.userId ?? null,
			},
		});
	},
);

import prisma from "../prisma";
import { CreateProjectData } from "../types/Project";
import { ProjectVisible } from "../types/ProjectVisible";
import { projectFieldValid } from "../utils/projectFieldValid";
import crypto from "crypto";
import {
	ValidationError,
	NotFoundError,
	ForbiddenError,
	DatabaseError,
} from "../errors/CustomErrors";
import {ensureAccess} from "../utils/encruceAcces";
import {requireUserIdProjectId} from "../utils/requireUserIdProjectId";
import {ProjectRepository} from "../repositories/project.repository";
import {hashIp} from "../utils/hashIp";

type ProjectWithRelations = Awaited<ReturnType<typeof getProjectById>>;
const repo = new ProjectRepository(prisma);
export const getProjectById = async (
	id: string,
	token?: string,
	userId?: string,
): Promise<ProjectDto> => {
	if (!id) {
		throw new ValidationError("Project ID is required", "id");
	}
	try {
		const project = await repo.findById(id);
		if(!project){
			throw new NotFoundError(`Project`, id);
		}
		ensureAccess(project, token, userId);
		const viewsAgg = await repo.getViewsCount(id);
		const viewsTotal = viewsAgg?._sum?.count ?? 0;

		const {_count: internalCount, ...rest} = project as any;

		return{
			...rest,
			metrics:{
				likes: internalCount.likes,
				views: {
					rows: internalCount.views,
					total: viewsTotal,
				},
			}
		}
	} catch (err: any) {
		throw new DatabaseError(`Failed to fetch project. ${err.message}`, {
			projectId: id,
		});
	}
};

export const getUserProjects = async (userId: string) => {
	if (!userId) {
		throw new ValidationError(`User ID is required`, `${userId}`);
	}
	try {
		const projects = await repo.getUserProjects(userId);
		console.log(projects);
		if(projects.length === 0){
			throw new NotFoundError(`User dont have a projects`, `user id:${userId}`);
		}
		return projects;
	} catch (err: any) {
		throw new DatabaseError(`Failed to fetch user's projects. ${err.message}`, {
			userId,
		});
	}
};

export const deleteProject = async (id: string, userId: string) => {
	requireUserIdProjectId(id, userId);

	try {
		return await repo.deleteProject(id, userId);
	} catch (err: any) {
		if (err?.code === `P2025`) {
			throw new NotFoundError(`Project`, id);
		}
		throw new DatabaseError(`Failed to delete project. ${err.message}`, {
			id,
			userId,
		});
	}
};

export const updateProject = async (id: string, data: CreateProjectData) => {

	requireUserIdProjectId(id, data?.userId);

	const project =await  repo.isProjectExists(id);
	if (!project) {
		throw new NotFoundError(`Project`, id);
	}
	if (project.userId !== data.userId) {
		throw new ForbiddenError(
			`You do not have permission to update this project`,
		);
	}

	await projectFieldValid(data);

	let previewUrlValue: string | null = project.previewUrl;
	if (!previewUrlValue && data.media && data.media.length > 0) {
		previewUrlValue = data.media[0].url;
	}

	try {
		return await repo.updateProject(id, previewUrlValue, data);
	} catch (err: any) {
		if (err?.code === `P2002`) {
			throw new ValidationError(
				`Project with this title already exists`,
				`title`,
			);
		}
		throw new DatabaseError(`Failed to update project. ${err.message}`, { id });
	}
};

export const createProject = async (data: CreateProjectData) => {
	if (!data?.userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}

	await projectFieldValid(data);

	try {
		return await repo.createProject(data);
	} catch (err: any) {
		if (err?.code === `P2002`) {
			throw new ValidationError(
				`Project with this title already exists`,
				`title`,
			);
		}
		throw new DatabaseError(`Failed to create project. ${err.message}`);
	}
};


const setVisibility = async (id: string, token: string | null) => {
	try {
		return await repo.updateVisibility(id,token);
	} catch (_err) {
		throw new DatabaseError(`Failed to update project visibility`, { id });
	}
};

export const changeProjectVisibility = async (
	id: string,
	userId: string,
	visible: ProjectVisible,
) => {
	requireUserIdProjectId(id, userId);
	if (!visible) {
		throw new ValidationError(`Visibility option is required`, `visible`);
	}

	const project = await prisma.project.findUnique({ where: { id } });
	if (!project) {
		throw new NotFoundError(`Project`, id);
	}
	if (project.userId !== userId) {
		throw new ForbiddenError(
			`You do not have permission to update this project`,
		);
	}

	switch (visible) {
		case `link`: {
			const token = crypto.randomBytes(24).toString(`hex`);
			return setVisibility(id, token);
		}
		case `public`: {
			return setVisibility(id, null);
		}
		case `private`: {
			return setVisibility(id, `private`);
		}
		default: {
			throw new ValidationError(`Invalid visibility option`, `visible`);
		}
	}
};


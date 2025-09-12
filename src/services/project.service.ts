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

type ProjectWithRelations = Awaited<ReturnType<typeof getProjectById>>;

function ensureAccess(project: any, token?: string, userId?: string): void {
	if (!project) {
		throw new NotFoundError(`Project`);
	}

	if (project.privateLinkToken === `private`) {
		if (project.userId !== userId) {
			throw new ForbiddenError(`Access denied: not your project`);
		}
		return;
	}

	if (project.privateLinkToken) {
		if (project.userId === userId) {
			return;
		}
		if (project.privateLinkToken !== token) {
			throw new ForbiddenError(`Access denied: invalid token`);
		}
		return;
	}
}

export const getProjectById = async (
	id: string,
	token?: string,
	userId?: string,
) => {
	if (!id) {
		throw new ValidationError(`Project ID is required`, `id`);
	}

	try {
		const project = await prisma.project.findUnique({
			where: { id },
			include: {
				media: true,
				_count: { select: { likes: true, views: true } },
				technologies: true,
			},
		});

		ensureAccess(project, token, userId);
		return project;
	} catch (err: any) {
		throw new DatabaseError(`Failed to fetch project. ${err.message}`, {
			projectId: id,
		});
	}
};

export const getUserProjects = async (userId: string) => {
	if (!userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}

	try {
		return await prisma.project.findMany({
			where: { userId },
			include: {
				media: true,
				_count: { select: { likes: true, views: true } },
				technologies: true,
			},
		});
	} catch (err: any) {
		throw new DatabaseError(`Failed to fetch user's projects. ${err.message}`, {
			userId,
		});
	}
};

export const deleteProject = async (id: string, userId: string) => {
	if (!id) {
		throw new ValidationError(`Project ID is required`, `id`);
	}
	if (!userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}

	try {
		return await prisma.project.delete({
			where: { id_userId: { id, userId } },
		});
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
	if (!id) {
		throw new ValidationError(`Project ID is required`, `id`);
	}
	if (!data?.userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}

	// Перевіряємо власника та існування
	const project = await prisma.project.findUnique({ where: { id } });
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
		return await prisma.project.update({
			where: { id },
			data: {
				userId: data.userId,
				title: data.title,
				description: data.description,
				previewUrl: previewUrlValue,
				githubUrl: data.githubUrl ?? null,
				demoUrl: data.demoUrl ?? null,
				media: data.media
					? {
							deleteMany: {},
							create: data.media.map((m) => ({
								type: m.type,
								url: m.url,
							})),
						}
					: undefined,
				technologies: data.technologies
					? {
							set: data.technologies.map((techId) => ({ id: techId })),
						}
					: undefined,
			},
			include: {
				user: true,
				media: true,
				technologies: true,
			},
		});
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
		return await prisma.project.create({
			data: {
				userId: data.userId,
				title: data.title,
				description: data.description,
				githubUrl: data.githubUrl ?? null,
				demoUrl: data.demoUrl ?? null,
				media: data.media
					? {
							create: data.media.map((m) => ({
								type: m.type,
								url: m.url,
							})),
						}
					: undefined,
				technologies: data.technologies
					? {
							connect: data.technologies.map((id) => ({ id })),
						}
					: undefined,
			},
			include: {
				user: true,
				media: true,
				technologies: true,
			},
		});
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

export const getProjectStats = async (id: string) => {
	if (!id) {
		throw new ValidationError(`Project ID is required`, `id`);
	}

	try {
		const [likes, views] = await Promise.all([
			prisma.like.count({ where: { projectId: id } }),
			prisma.view.count({ where: { projectId: id } }),
		]);
		return { likes, views };
	} catch (_err) {
		throw new DatabaseError(`Failed to fetch project stats.`, {
			projectId: id,
		});
	}
};

export const likeProject = async (projectId: string, userId: string) => {
	if (!projectId) {
		throw new ValidationError(`Project ID is required`, `projectId`);
	}
	if (!userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}

	const existing = await prisma.like.findUnique({
		where: { userId_projectId: { userId, projectId } },
	});
	if (existing) {
		throw new ValidationError(`User has already liked this project`);
	}

	try {
		await prisma.like.create({ data: { projectId, userId } });
		const count = await prisma.like.count({ where: { projectId } });
		return count;
	} catch (_err) {
		throw new DatabaseError(`Failed to like project.`, { projectId, userId });
	}
};

export const unlikeProject = async (projectId: string, userId: string) => {
	if (!projectId) {
		throw new ValidationError(`Project ID is required`, `projectId`);
	}
	if (!userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}

	const existing = await prisma.like.findUnique({
		where: { userId_projectId: { userId, projectId } },
	});
	if (!existing) {
		throw new NotFoundError(`Like`);
	}

	try {
		await prisma.like.delete({
			where: { userId_projectId: { projectId, userId } },
		});
		const count = await prisma.like.count({ where: { projectId } });
		return count;
	} catch (_err) {
		throw new DatabaseError(`Failed to unlike project`, { projectId, userId });
	}
};

const setVisibility = async (id: string, token: string | null) => {
	try {
		return await prisma.project.update({
			where: { id },
			data: { privateLinkToken: token },
		});
	} catch (_err) {
		throw new DatabaseError(`Failed to update project visibility`, { id });
	}
};

export const changeProjectVisibility = async (
	id: string,
	userId: string,
	visible: ProjectVisible,
) => {
	if (!id) {
		throw new ValidationError(`Project ID is required`, `id`);
	}
	if (!userId) {
		throw new ValidationError(`User ID is required`, `userId`);
	}
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

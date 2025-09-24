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

type ProjectWithRelations = Awaited<ReturnType<typeof getProjectById>>;

export const getProjectById = async (
	id: string,
	token?: string,
	userId?: string,
): Promise<ProjectDto> => {
	if (!id) {
		throw new ValidationError("Project ID is required", "id");
	}

	try {
		const [project, viewsAgg] = await Promise.all([
			prisma.project.findUnique({
				where: { id },
				include: {
					media: true,
					technologies: true,
					_count: { select: { likes: true, views: true } },
				},
			}),
			prisma.view.aggregate({
				where: { projectId: id },
				_sum: { count: true },
			}),
		]);

		if (!project) {
			throw new NotFoundError("Project", id);
		}

		ensureAccess(project, token, userId);

		const viewsTotal = viewsAgg._sum.count ?? 0;

		const { _count: internalCount, ...rest } = project as any;

		const dto: ProjectDto = {
			...rest,
			metrics: {
				likes: internalCount.likes,
				views: {
					rows: internalCount.views,
					total: viewsTotal,
				},
			},
		};

		return dto;
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
	requireUserIdProjectId(id, userId);

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

	requireUserIdProjectId(id, data?.userId);

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
function hashIp(ip: string, salt: string): string {
	return crypto.createHash("sha256").update(`${ip}${salt}`).digest("hex");
}
export const recordProjectView = async (
	projectId: string,
	opts?: { userId?: string; ip?: string; ipHash?: string },
) => {
	console.log(opts)
	const userId = opts?.userId ?? null;

	if (!projectId) {
		throw new ValidationError("Project ID is required", "projectId");
	}

	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) {
		throw new NotFoundError("Project", projectId);
	}

	try {
		if (userId) {
			return await prisma.view.upsert({
				where: {
					project_user: { projectId, userId },
				},
				create: {
					projectId,
					userId,
					count: 1,
				},
				update: {
					count: { increment: 1 },
				},
			});
		}
		console.log(opts?.ip);
		const salt = process.env.IP_HASH_SALT;
		if (!opts?.ip && !opts?.ipHash) {
			throw new ValidationError("IP is required for anonymous view", "ip");
		}
		if (!salt && !opts?.ipHash) {
			throw new ValidationError("IP_HASH_SALT is not set", "IP_HASH_SALT");
		}

		const finalIpHash =
			opts?.ipHash ?? hashIp(opts!.ip as string, salt as string);

		return await prisma.view.upsert({
			where: {
				project_iphash: { projectId, ipHash: finalIpHash },
			},
			create: {
				projectId,
				ipHash: finalIpHash,
				count: 1,
			},
			update: {
				count: { increment: 1 },
			},
		});
	} catch (err: any) {
		throw new DatabaseError("Failed to record project view", {
			projectId,
			reason: err?.message,
		});
	}
};

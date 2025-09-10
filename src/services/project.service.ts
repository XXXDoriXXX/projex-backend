import prisma from "../prisma.js";
import { CreateProjectData } from "../types/Project.js";
import { projectFieldValid } from "./utils/projectFieldValid.js";
import { ProjectVisible } from "../types/ProjectVisible.js";

function canAccess(project: any, token?: string, userId?: string) {
	if (!project) throw new Error("Project not found");

	if (project.privateLinkToken === "private") {
		if (project.userId !== userId) {
			throw new Error("Access denied. not your project");
		}
		return true;
	}

	if (project.privateLinkToken) {
		if (project.userId === userId) {
			return true;
		}
		if (project.privateLinkToken !== token) {
			throw new Error("Access denied. invalid token");
		}
		return true;
	}

	return true;
}
export const getProjectById = async (
	id: string,
	token?: string,
	userId?: string,
) => {
	try {
		const project = await prisma.project.findUnique({
			where: { id },
			include: {
				media: true,
				_count: {
					select: { likes: true, views: true },
				},
				technologies: true,
			},
		});
		canAccess(project, token, userId);
		return project;
	} catch (error: any) {
		console.error("Error fetching project:", error);
		throw new Error(`${error}`);
	}
};
export const getUserProjects = async (userId: string) => {
	try {
		const projects = await prisma.project.findMany({
			where: { userId },
			include: {
				media: true,
				_count: {
					select: { likes: true, views: true },
				},
				technologies: true,
			},
		});
		return projects;
	} catch (error: any) {
		console.error("Error fetching user's projects:", error);
		throw new Error("Failed to fetch user's projects");
	}
};
export const deleteProject = async (id: string, userId: string) => {
	if (!id) throw new Error("Project ID is required");
	if (!userId) throw new Error("User ID is required");
	try {
		const deletedProject = await prisma.project.delete({
			where: {
				id_userId: {
					id,
					userId,
				},
			},
		});
		return deletedProject;
	} catch (error) {
		console.error("Error deleting project:", error);
		throw new Error("Failed to delete project");
	}
};
export const updateProject = async (id: string, data: CreateProjectData) => {
	const project = await prisma.project.findUnique({ where: { id } });
	if (!project) {
		throw new Error("Project not found");
	}
	if (project.userId !== data.userId) {
		throw new Error("You do not have permission to update this project");
	}
	await projectFieldValid(data);
	let previewUrlValue: string | null = project.previewUrl;
	if (!previewUrlValue && data.media && data.media.length > 0) {
		previewUrlValue = data.media[0].url;
	}
	try {
		const updatedProject = await prisma.project.update({
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
							create: data.media?.map((m) => ({
								type: m.type,
								url: m.url,
							})),
						}
					: undefined,
				technologies: data.technologies
					? {
							set: data.technologies?.map((id) => ({ id })) ?? [],
						}
					: undefined,
			},
			include: {
				user: true,
				media: true,
				technologies: true,
			},
		});
		return updatedProject;
	} catch (error: any) {
		console.error("Error updating project:", error);
		throw new Error("Failed to update project");
	}
};

export const createProject = async (data: CreateProjectData) => {
	await projectFieldValid(data);
	try {
		const newProject = await prisma.project.create({
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
		return newProject;
	} catch (error: any) {
		if (error.code === "P2002") {
			throw new Error("Project with this title already exists");
		}
		console.error("Error creating project:", error);
		throw new Error("Failed to create project");
	}
};
export const getProjectStats = async (id: string) => {
	try {
		const [likes, views] = await Promise.all([
			prisma.like.count({ where: { projectId: id } }),
			prisma.view.count({ where: { projectId: id } }),
		]);
		return { likes, views };
	} catch (error) {
		console.error("Error fetching project stats:", error);
		throw new Error("Failed to fetch project stats");
	}
};
export const likeProject = async (projectId: string, userId: string) => {
	if (!projectId) throw new Error("Project ID is required");
	if (!userId) throw new Error("User ID is required");
	const existing = await prisma.like.findUnique({
		where: {
			userId_projectId: { userId, projectId },
		},
	});
	if (existing) {
		throw new Error("User has already liked this project");
	}

	try {
		const like = await prisma.like.create({
			data: {
				projectId,
				userId,
			},
		});
		const count = await prisma.like.count({
			where: { projectId },
		});
		return count;
	} catch (error) {
		console.error("Error liking project:", error);
		throw new Error("Failed to like project");
	}
};
export const unlikeProject = async (projectId: string, userId: string) => {
	if (!projectId) throw new Error("Project ID is required");
	if (!userId) throw new Error("User ID is required");
	const existing = await prisma.like.findUnique({
		where: {
			userId_projectId: { userId, projectId },
		},
	});

	if (!existing) {
		throw new Error("Like not found");
	}

	try {
		const unlike = await prisma.like.delete({
			where: {
				userId_projectId: {
					projectId,
					userId,
				},
			},
		});
		const count = await prisma.like.count({
			where: { projectId },
		});
		return count;
	} catch (error) {
		console.error("Error unliking project:", error);
		throw new Error("Failed to unlike project");
	}
};
const changeVisibility = async (id: string, visible?: string) => {
	try {
		const updatedProject = await prisma.project.update({
			where: { id },
			data: {
				privateLinkToken: `${visible}`,
			},
		});
		return updatedProject;
	} catch (error: any) {
		console.error("Error updating project visibility:", error);
		throw new Error("Failed to update project visibility");
	}
};
export const changeProjectVisibility = async (
	id: string,
	userId: string,
	visible: ProjectVisible,
) => {
	const project = await prisma.project.findUnique({ where: { id } });
	if (!project) {
		throw new Error("Project not found");
	}
	if (project.userId !== userId) {
		throw new Error("You do not have permission to update this project");
	}
	if (!visible) {
		throw new Error("Visibility option is required");
	}
	try {
		let updatedProject;
		switch (visible) {
			case "link":
				const token = [...Array(30)]
					.map(() => Math.random().toString(36)[2])
					.join("");
				updatedProject = changeVisibility(id, token);
				break;
			case "public":
				updatedProject = changeVisibility(id);
				break;
			case "private":
				updatedProject = changeVisibility(id, "private");
				break;
			default:
				console.log("Error updating project:", id, userId, visible);
				throw new Error("Invalid visibility option");
		}
		return updatedProject;
	} catch (error: any) {
		console.error("Error updating project visibility:", error);
		throw new Error("Failed to update project visibility");
	}
};

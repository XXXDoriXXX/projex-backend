import prisma from "../prisma";
import {CreateProjectData} from "../types/Project";

export const getProjectById = async (id: string) => {
    try {
        const project = await prisma.project.findUnique({
        where: { id },
        include: {
            user: true,
            likes: true,
        },
        });
        return project;
    } catch (error) {
        console.error("Error fetching project:", error);
        throw new Error("Failed to fetch project");
    }
}
export const getUserProjects = async (userId: string) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                user: true,
                likes: true,
            },
        });
        return projects;
    } catch (error) {
        console.error("Error fetching user's projects:", error);
        throw new Error("Failed to fetch user's projects");
    }
}
export const deleteProject = async (id: string) => {
    try {
        const deletedProject = await prisma.project.delete({
            where: { id },
        });
        return deletedProject;
    } catch (error) {
        console.error("Error deleting project:", error);
        throw new Error("Failed to delete project");
    }
}
export const updateProject = async (id: string, data: any) => {
    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data,
        });
        return updatedProject;
    } catch (error) {
        console.error("Error updating project:", error);
        throw new Error("Failed to update project");
    }
}

export const createProject = async (data:CreateProjectData) => {
    try {
        const newProject = await prisma.project.create({
            data: {
                userId: data.userId,
                title: data.title,
                description: data.description,
                githubUrl: data.githubUrl??null,
                demoUrl: data.demoUrl??null,
                media: data.media?{
                    create:data.media.map(m=>({
                        type: m.type,
                        url: m.url,
                    })),
                }:undefined,
                technologies: data.technologies?{
                    connect: data.technologies.map((id)=>({id})),
                } : undefined,
            },
            include: {
                user: true,
                media: true,
                technologies: true,
            },
        });
        return newProject;
    } catch (error) {
        console.error("Error creating project:", error);
        throw new Error("Failed to create project");
    }
}
export const getProjectStats = async (id: string) => {
    try {
        const [likes, views] = await Promise.all([
            prisma.like.count({where: {projectId: id}}),
            prisma.view.count({where: {projectId: id}}),
        ]);
        return {likes, views};
    } catch (error) {
        console.error("Error fetching project stats:", error);
        throw new Error("Failed to fetch project stats");
    }
}
export const likeProject = async (projectId: string, userId: string) => {
    try {
        const like = await prisma.like.create({
            data: {
                projectId,
                userId,
            },
        });
        return like;
    } catch (error) {
        console.error("Error liking project:", error);
        throw new Error("Failed to like project");
    }
}
export const unlikeProject = async (projectId: string, userId: string) => {
    try {
        const unlike = await prisma.like.delete({
            where: {
                userId_projectId: {
                    projectId,
                    userId,
                },
            },
        });
        return unlike;
    } catch (error) {
        console.error("Error unliking project:", error);
        throw new Error("Failed to unlike project");
    }
}
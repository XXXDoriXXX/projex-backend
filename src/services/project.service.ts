import prisma from "../prisma";
import {CreateProjectData} from "../types/Project";
const isValidUrl = (str: string) => {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};
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



export const createProject = async (data: CreateProjectData) => {
    // title
    if (!data.title || typeof data.title !== "string") {
        throw new Error("Title is required and must be a string");
    }
    if (data.title.length < 3) {
        throw new Error("Title must be at least 3 characters");
    }
    if (data.title.length > 50) {
        throw new Error("Title length exceeds 50 characters");
    }
    if (!/^[a-zA-Z0-9 _\-]+$/.test(data.title)) {
        throw new Error("Title contains invalid characters");
    }

    // desc
    if (!data.description || typeof data.description !== "string") {
        throw new Error("Description is required and must be a string");
    }
    if (data.description.length < 10) {
        throw new Error("Description must be at least 10 characters");
    }
    if (data.description.length > 500) {
        throw new Error("Description length exceeds 500 characters");
    }

    // github
    if (data.githubUrl) {
        if (typeof data.githubUrl !== "string") throw new Error("GitHub URL must be a string");
        if (data.githubUrl.length > 150) throw new Error("GitHub URL length exceeds 150 characters");
        if (!isValidUrl(data.githubUrl)) throw new Error("GitHub URL is invalid");
        if (!data.githubUrl.startsWith("https://github.com/")) throw new Error("GitHub URL must be a GitHub link");
    }

    // demo
    if (data.demoUrl) {
        if (typeof data.demoUrl !== "string") throw new Error("Demo URL must be a string");
        if (data.demoUrl.length > 150) throw new Error("Demo URL length exceeds 150 characters");
        if (!isValidUrl(data.demoUrl)) throw new Error("Demo URL is invalid");
    }

    // media
    if (data.media) {
        if (!Array.isArray(data.media)) throw new Error("Media must be an array");
        if (data.media.length > 10) throw new Error("Maximum 10 media items allowed");
        const mediaTypes = ["image", "video"];
        const urls = new Set<string>();
        for (const m of data.media) {
            if (!mediaTypes.includes(m.type)) throw new Error("Invalid media type");
            if (!isValidUrl(m.url)) throw new Error("Media URL is invalid");
            if (urls.has(m.url)) throw new Error("Duplicate media URLs not allowed");
            urls.add(m.url);
        }
    }

    // tech
    if (data.technologies) {
        if (!Array.isArray(data.technologies)) throw new Error("Technologies must be an array");
        if (data.technologies.length > 15) throw new Error("Maximum 15 technologies allowed");
        if (new Set(data.technologies).size !== data.technologies.length)
            throw new Error("Duplicate technology IDs not allowed");
        for (const id of data.technologies) {
            if (typeof id !== "string" || id.length === 0) throw new Error("Technology ID must be a non-empty string");
        }
    }

    // user
    if (!data.userId || typeof data.userId !== "string") {
        throw new Error("User ID is required");
    }

    // unique title user
    const existing = await prisma.project.findFirst({
        where: { userId: data.userId, title: data.title },
    });
    if (existing) throw new Error("Project title must be unique per user");

    // create
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
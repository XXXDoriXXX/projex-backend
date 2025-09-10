import {CreateProjectData} from "../../types/Project";
import prisma from "../../prisma";
import {isValidUrl} from "./urlValid";

export const projectFieldValid =async (data:CreateProjectData)=>{
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
}
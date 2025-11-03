import { CreateProjectData } from '../types/project/Project';

import { isValidUrl } from './urlValid';
import { prisma } from '../prisma';
import {ValidationError} from "../errors/CustomErrors";

export const projectFieldValid = async (data: CreateProjectData) => {
    if (!data.title || typeof data.title !== 'string') {
        throw new ValidationError('Title is required and must be a string');
    }
    if (data.title.length < 3) {
        throw new ValidationError('Title must be at least 3 characters');
    }
    if (data.title.length > 50) {
        throw new ValidationError('Title length exceeds 50 characters');
    }
    if (!/^[a-zA-Z0-9 _\-]+$/.test(data.title)) {
        throw new ValidationError('Title contains invalid characters');
    }

    // desc
    if (!data.description || typeof data.description !== 'string') {
        throw new ValidationError('Description is required and must be a string');
    }
    if (data.description.length < 10) {
        throw new ValidationError('Description must be at least 10 characters');
    }
    if (data.description.length > 5000) {
        throw new ValidationError('Description length exceeds 500 characters');
    }

    // github
    if (data.githubUrl) {
        if (typeof data.githubUrl !== 'string') throw new ValidationError('GitHub URL must be a string');
        if (data.githubUrl.length > 150) throw new ValidationError('GitHub URL length exceeds 150 characters');
        if (!isValidUrl(data.githubUrl)) throw new ValidationError('GitHub URL is invalid');
        if (!data.githubUrl.startsWith('https://github.com/')) throw new ValidationError('GitHub URL must be a GitHub link');
    }

    // demo
    if (data.demoUrl) {
        if (typeof data.demoUrl !== 'string') throw new ValidationError('Demo URL must be a string');
        if (data.demoUrl.length > 150) throw new ValidationError('Demo URL length exceeds 150 characters');
        if (!isValidUrl(data.demoUrl)) throw new ValidationError('Demo URL is invalid');
    }

    // media
    if (data.mediaIds) {
        if (!Array.isArray(data.mediaIds)) throw new ValidationError('Media must be an array');
        if (data.mediaIds.length > 10) throw new ValidationError('Maximum 10 media items allowed');
    }

    // tech
    if (data.technologies) {
        if (!Array.isArray(data.technologies)) throw new ValidationError('Technologies must be an array');
        if (data.technologies.length > 15) throw new ValidationError('Maximum 15 technologies allowed');
        if (new Set(data.technologies).size !== data.technologies.length) throw new ValidationError('Duplicate technology IDs not allowed');
        for (const id of data.technologies) {
            if (typeof id !== 'string' || id.length === 0) throw new ValidationError('Technology ID must be a non-empty string');
        }
    }

    // user
    if (!data.userId || typeof data.userId !== 'string') {
        throw new ValidationError('User ID is required');
    }

    // unique title user
    const existing = await prisma.project.findFirst({
        where: { userId: data.userId, title: data.title },
    });
   // if (existing) throw new ValidationError('Project title must be unique per user');
};

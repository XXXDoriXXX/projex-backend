import 'reflect-metadata';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateProjectData } from '../types/project/Project';
import { ProjectVisible } from '../types/project/ProjectVisible';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors/CustomErrors';
import { type IProjectService } from '../services/project.service';

import { inject, injectable } from 'tsyringe';
import { type IProjectServiceLike } from '../services/project.service.like';
import { type IProjectServiceView } from '../services/project.service.view';
import {type IProjectServiceMedia} from "../services/project.service.media";

const isProjectVisible = (v: unknown): v is ProjectVisible => v === 'public' || v === 'link' || v === 'private';

@injectable()
export class ProjectController {
    constructor(
        @inject('IProjectService') private projectService: IProjectService,
        @inject('IProjectServiceView') private projectServiceView: IProjectServiceView,
        @inject('IProjectServiceLike') private projectServiceLike: IProjectServiceLike,
        @inject('IProjectServiceMedia') private projectServiceMedia: IProjectServiceMedia,
    ) {}
    public uploadMedia = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const file = req.file;
        if (!file) {
            throw new ValidationError(`File upload is required ${file}`, 'file');
        }

        const media = await this.projectServiceMedia.uploadMedia(userId, file);
        res.status(201).json({
            success: true,
            message: 'Media uploaded and is pending attachment',
            data: {
                id: media.id,
                url: media.url,
                type: media.type,
            },
        });
    });
    public deleteMedia = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const mediaId = req.params.id;
        if (!mediaId) {
            throw new ValidationError('Media ID is required', 'id');
        }

        await this.projectServiceMedia.deleteMedia(mediaId, userId);
        res.status(200).json({ success: true, message: 'Media deleted' });
    });

    public createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const { title, description, githubUrl, demoUrl, media, technologies } = req.body ?? {};
        if (!title || typeof title !== 'string') {
            throw new ValidationError('Title is required and must be a string', 'title');
        }
        if (!description || typeof description !== 'string') {
            throw new ValidationError('Description is required and must be a string', 'description');
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

        const project = await this.projectService.createProject(projectData);
        res.status(201).json({ success: true, data: project, message: 'Project created' });
    });

    public deleteProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const deleted = await this.projectService.deleteProject(projectId, userId);
        res.status(200).json({ success: true, data: deleted, message: 'Project deleted' });
    });

    public updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const { title, description, githubUrl, demoUrl, media, technologies } = req.body ?? {};
        if (title !== undefined && typeof title !== 'string') {
            throw new ValidationError('Title must be a string', 'title');
        }
        if (description !== undefined && typeof description !== 'string') {
            throw new ValidationError('Description must be a string', 'description');
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

        const updated = await this.projectService.updateProject(projectId, payload);
        res.status(200).json({ success: true, data: updated, message: 'Project updated' });
    });

    public getProjectById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const userId = req.user?.userId;
        const token = req.params.token;
        const project = await this.projectService.getProjectById(projectId, token, userId);
        if (!project) {
            throw new NotFoundError('Project', projectId);
        }

        res.status(200).json({ success: true, data: project });
    });

    public getUserProjects = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.id;
        if (!userId) {
            throw new ValidationError('User ID is required', 'id');
        }

        const projects = await this.projectService.getUserProjects(userId);
        res.status(200).json({ success: true, data: projects });
    });

    public changeProjectVisibility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const visible = req.body?.visible;
        if (!isProjectVisible(visible)) {
            throw new ValidationError('Invalid visibility option', 'visible');
        }

        const updated = await this.projectService.changeProjectVisibility(projectId, userId, visible);
        res.status(200).json({ success: true, data: updated, message: 'Visibility updated' });
    });

    public likeProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const likes = await this.projectServiceLike.likeProject(projectId, userId);
        res.status(200).json({ success: true, likes });
    });

    public unlikeProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const likes = await this.projectServiceLike.unlikeProject(projectId, userId);
        res.status(200).json({ success: true, likes });
    });

    public recordProjectView = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const projectId = req.params.id;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'id');
        }

        const userId = req.user?.userId ?? undefined;
        const xff = req.headers['x-forwarded-for'] as string | undefined;
        const ipList = xff?.split(',').map((ip) => ip.trim()) || [];
        const ip = ipList[0] || req.ip;

        const view = await this.projectServiceView.recordProjectView(projectId, { userId, ip });
        res.status(200).json({
            success: true,
            data: {
                id: view.id,
                count: view.count,
                projectId: view.projectId,
                userId: view.userId ?? null,
            },
        });
    });
    public getAllTechnologies = asyncHandler(async (_req: Request, res: Response) => {
        const technologies = await this.projectService.getAllTechnologies();
        res.status(200).json({ success: true, data: technologies });
    });
}

// src/controllers/hackathon.controller.ts

import 'reflect-metadata';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { type IHackathonService } from '../services/hackathon.service.interface';
import {
    CreateHackathonDto,
    GetHackathonsQueryDto,
    RateProjectDto,
    UpdateHackathonDto
} from '../types/hackathon/hackathon.types';
import { ValidationError, ForbiddenError } from '../errors/CustomErrors';
import { HackathonStatus } from '@prisma/client';

@injectable()
export class HackathonController {
    constructor(@inject('IHackathonService') private hackathonService: IHackathonService) {}


    public createHackathon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const dto: CreateHackathonDto = req.body;
        const hackathon = await this.hackathonService.createHackathon(userId, dto);
        res.status(201).json({ success: true, data: hackathon, message: 'Hackathon created' });
    });

    public updateHackathonStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
       const userId = req.user?.userId;
       const { id } = req.params;
         const { status } = req.body;
         const updatedHackathon = await this.hackathonService.updateHackathonStatus(id, userId!, status);
         res.status(200).json({ success: true, data: updatedHackathon, message:' Hackathon status updated' });
    });

    public updateHackathon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { id } = req.params;
        const dto: UpdateHackathonDto = req.body;
        const updatedHackathon = await this.hackathonService.updateHackathon(id, userId, dto);
        res.status(200).json({ success: true, data: updatedHackathon, message: 'Hackathon updated' });
    });

    public deleteHackathon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { id } = req.params;
        await this.hackathonService.deleteHackathon(id, userId);
        res.status(200).json({ success: true, message: 'Hackathon deleted' });
    });

    public getHackathonById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const hackathon = await this.hackathonService.getHackathonById(id);
        res.status(200).json({ success: true, data: hackathon });
    });

    public getAllHackathons = asyncHandler(async (req: Request, res: Response) => {

        const { status, limit, cursor, sortOrder, search, themes } = req.query;
        let validatedStatus: HackathonStatus | 'ALL' | undefined;

        if (status) {
            if (status === 'ALL') {
                validatedStatus = 'ALL';
            } else if (Object.values(HackathonStatus).includes(status as HackathonStatus)) {
                validatedStatus = status as HackathonStatus;
            } else {
                throw new ValidationError('Invalid status filter', 'status');
            }
        }

        if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
            throw new ValidationError("Invalid sortOrder. Must be 'asc' or 'desc'", 'sortOrder');
        }

        const themeIds = (themes as string | undefined)?.split(',').filter(id => id.length > 0);

        const queryDto: GetHackathonsQueryDto = {
            status: validatedStatus as HackathonStatus |"ALL"| undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            cursor: cursor as string | undefined,
            sortOrder: sortOrder as 'asc' | 'desc' | undefined,
            search: search as string | undefined,
            themeIds: themeIds,
        };

        if (limit && (isNaN(queryDto.limit!) || queryDto.limit! < 1)) {
            throw new ValidationError('Invalid limit. Must be a positive number', 'limit');
        }

        const result = await this.hackathonService.getAllHackathons(queryDto);

        res.status(200).json({ success: true, ...result });
    });

    public joinHackathon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { id } = req.params;
        const participant = await this.hackathonService.joinHackathon(id, userId);
        res.status(201).json({ success: true, data: participant, message: 'Joined hackathon' });
    });

    public leaveHackathon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { id } = req.params;
        await this.hackathonService.leaveHackathon(id, userId);
        res.status(200).json({ success: true, message: 'Left hackathon' });
    });


    public submitProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { id } = req.params;
        const { projectId } = req.body;
        if (!projectId) {
            throw new ValidationError('Project ID is required', 'projectId');
        }
        const submission = await this.hackathonService.submitProject(id, userId, projectId);
        res.status(201).json({ success: true, data: submission, message: 'Project submitted' });
    });

    public removeProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { hpId } = req.params;
        await this.hackathonService.removeProject(hpId, userId);
        res.status(200).json({ success: true, message: 'Project submission removed' });
    });



    public rateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const raterId = req.user?.userId;
        if (!raterId) {
            throw new ForbiddenError('Authentication required');
        }
        const { hpId } = req.params;
        const dto: RateProjectDto = req.body;

        const rating = await this.hackathonService.rateProject(hpId, raterId, dto);
        res.status(201).json({ success: true, data: rating, message: 'Project rated' });
    });

    public getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const leaderboard = await this.hackathonService.getLeaderboard(id);
        res.status(200).json({ success: true, data: leaderboard });
    });



    public getThemeCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await this.hackathonService.getThemeCategories();
        res.status(200).json({ success: true, data: categories });
    });

    public getRatingCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await this.hackathonService.getRatingCategories();
        res.status(200).json({ success: true, data: categories });
    });

    public getMyProjects = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }

        const { id } = req.params;

        const projects = await this.hackathonService.getUserProjectsInHackathon(id, userId);
        res.status(200).json({ success: true, data: projects });
    });
    public getMyRatingsInHackathon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ForbiddenError('Authentication required');
        }
        const { id: hackathonId } = req.params;

        const ratings = await this.hackathonService.getMyRatingsInHackathon(hackathonId, userId);
        res.status(200).json({ success: true, data: ratings });
    });
    public getProjectRatings = asyncHandler(async (req: Request, res: Response) => {
        const { hpId } = req.params;
        const ratings = await this.hackathonService.getProjectRatings(hpId);
        res.status(200).json({ success: true, data: ratings });
    });
}
// src/services/hackathon.service.ts

import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { type IHackathonRepository } from '../repositories/hackathon.repository.interface';
import { IHackathonService } from './hackathon.service.interface';
import {
    CreateHackathonDto,
    UpdateHackathonDto,
    RateProjectDto,
    HackathonWithDetails,
    LeaderboardEntry,
} from '../types/hackathon/hackathon.types';
import {
    Hackathon,
    HackathonParticipant,
    HackathonProject,
    HackathonProjectRating,
    HackathonRatingCategory,
    HackathonStatus,
    HackathonThemeCategory,
    Prisma,
    HackathonRaterType,
} from '@prisma/client';
import { DatabaseError, ForbiddenError, NotFoundError, ValidationError } from '../errors/CustomErrors';
import { type IProjectRepository } from '../repositories/project.repository'; // Потрібен для перевірки прав на проект

@injectable()
export class HackathonService implements IHackathonService {
    constructor(
        @inject('IHackathonRepository') private hackathonRepo: IHackathonRepository,
        @inject('IProjectRepository') private projectRepo: IProjectRepository,
    ) {}


    async createHackathon(authorId: string, dto: CreateHackathonDto): Promise<Hackathon> {
        this.validateHackathonDates(dto.startDate, dto.endDate);

        const data: Prisma.HackathonCreateInput = {
            title: dto.title,
            description: dto.description,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            allowParticipantRating: dto.allowParticipantRating,
            allowPublicRating: dto.allowPublicRating,
            author: { connect: { id: authorId } },
            judges: dto.judgeIds ? { connect: dto.judgeIds.map((id) => ({ id })) } : undefined,
        };

        try {

            const [themes, ratingCategories] = await this.handleCategoryCreation(
                dto.newThemes,
                dto.themeIds,
                dto.newRatingCategories,
                dto.ratingCategoryIds,
            );

            data.themes = themes ? { connect: themes.map((t) => ({ id: t.id })) } : undefined;
            data.ratingCategories = ratingCategories
                ? { connect: ratingCategories.map((rc) => ({ id: rc.id })) }
                : undefined;

            return await this.hackathonRepo.create(data);
        } catch (err: any) {
            if (err.code === 'P2002') {
                throw new ValidationError('Hackathon with this title already exists', 'title');
            }
            throw new DatabaseError(`Failed to create hackathon: ${err.message}`);
        }
    }

    async updateHackathon(hackathonId: string, userId: string, dto: UpdateHackathonDto): Promise<Hackathon> {
        const hackathon = await this.getHackathonAndCheckOwnership(hackathonId, userId);

        if (dto.startDate || dto.endDate) {
            this.validateHackathonDates(
                dto.startDate || hackathon.startDate.toISOString(),
                dto.endDate || hackathon.endDate.toISOString(),
            );
        }

        const data: Prisma.HackathonUpdateInput = {
            title: dto.title,
            description: dto.description,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            allowParticipantRating: dto.allowParticipantRating,
            allowPublicRating: dto.allowPublicRating,
            judges: dto.judgeIds ? { set: dto.judgeIds.map((id) => ({ id })) } : undefined,
        };

        try {

            const [themes, ratingCategories] = await this.handleCategoryCreation(
                dto.newThemes,
                dto.themeIds,
                dto.newRatingCategories,
                dto.ratingCategoryIds,
            );

            data.themes = themes ? { set: themes.map((t) => ({ id: t.id })) } : undefined;
            data.ratingCategories = ratingCategories
                ? { set: ratingCategories.map((rc) => ({ id: rc.id })) }
                : undefined;

            return await this.hackathonRepo.update(hackathonId, data);
        } catch (err: any) {
            if (err.code === 'P2002') {
                throw new ValidationError('Hackathon with this title already exists', 'title');
            }
            throw new DatabaseError(`Failed to update hackathon: ${err.message}`);
        }
    }

    async deleteHackathon(hackathonId: string, userId: string): Promise<void> {

        try {
            await this.hackathonRepo.delete(hackathonId, userId);
        } catch (err: any) {
            if (err.code === 'P2025') {
                throw new NotFoundError('Hackathon', hackathonId);
            }
            throw new DatabaseError(`Failed to delete hackathon: ${err.message}`);
        }
    }

    async getHackathonById(hackathonId: string): Promise<HackathonWithDetails> {
        const hackathon = await this.hackathonRepo.findById(hackathonId);
        if (!hackathon) {
            throw new NotFoundError('Hackathon', hackathonId);
        }
        return hackathon;
    }

    async getAllHackathons(status?: HackathonStatus): Promise<Hackathon[]> {
        return this.hackathonRepo.findMany(status);
    }



    async joinHackathon(hackathonId: string, userId: string): Promise<HackathonParticipant> {
        const hackathon = await this.getHackathonById(hackathonId);
        if (hackathon.status !== 'OPEN') {
            throw new ForbiddenError('This hackathon is not open for registration.');
        }

        const existingParticipant = await this.hackathonRepo.findParticipant(hackathonId, userId);
        if (existingParticipant) {
            throw new ValidationError('User is already a participant', 'userId');
        }

        return this.hackathonRepo.addParticipant(hackathonId, userId);
    }

    async leaveHackathon(hackathonId: string, userId: string): Promise<void> {
        const participant = await this.hackathonRepo.findParticipant(hackathonId, userId);
        if (!participant) {
            throw new NotFoundError('Participant record not found');
        }
        await this.hackathonRepo.removeParticipant(participant.id);
    }


    async submitProject(hackathonId: string, userId: string, projectId: string): Promise<HackathonProject> {
        const hackathon = await this.getHackathonById(hackathonId);
        if (hackathon.status !== 'OPEN') {
            throw new ForbiddenError('This hackathon is not open for project submissions.');
        }

        if (!hackathon.participants.some((p) => p.userId === userId)) {
            throw new ForbiddenError('You must be a participant to submit a project.');
        }

        const project = await this.projectRepo.isProjectExists(projectId);
        if (!project) {
            throw new NotFoundError('Project', projectId);
        }
        const isAuthor = project.userId === userId;
        // (Припускаємо, що isProjectExists повертає subauthors, якщо ні - треба змінити логіку)
        // const isSubauthor = project.subauthors?.some(sa => sa.id === userId);
        if (!isAuthor /* && !isSubauthor */) {
            throw new ForbiddenError('You must be the author of the project to submit it.');
        }

        const existingSubmission = await this.hackathonRepo.findSubmittedProject(hackathonId, projectId);
        if (existingSubmission) {
            throw new ValidationError('This project has already been submitted', 'projectId');
        }

        return this.hackathonRepo.addProject(hackathonId, projectId);
    }

    async removeProject(hpId: string, userId: string): Promise<void> {
        const hp = await this.hackathonRepo.findHackathonProjectById(hpId);
        if (!hp) {
            throw new NotFoundError('HackathonProject submission', hpId);
        }


        if (hp.project.userId !== userId) {
            throw new ForbiddenError('Only the project author can remove this submission.');
        }

        await this.hackathonRepo.removeProject(hpId);
    }



    async rateProject(hpId: string, raterId: string, dto: RateProjectDto): Promise<HackathonProjectRating> {
        const { categoryId, rating, comment } = dto;

        if (rating < 1 || rating > 10) {
            throw new ValidationError('Rating must be between 1 and 10', 'rating');
        }

        const hp = await this.hackathonRepo.findHackathonProjectById(hpId);
        if (!hp) {
            throw new NotFoundError('HackathonProject submission', hpId);
        }

        const hackathon = hp.hackathon;
        const project = hp.project;


        let raterType: HackathonRaterType;
        const isJudge = hackathon.authorId === raterId || hackathon.judges.some((j) => j.id === raterId);
        const isParticipant = hackathon.participants.some((p) => p.userId === raterId);
        const isOwner = project.userId === raterId || project.subauthors.some(sa => sa.id === raterId);

        if (isJudge) {
            raterType = HackathonRaterType.JUDGE;
        } else if (isParticipant) {
            if (!hackathon.allowParticipantRating) {
                throw new ForbiddenError('Participant rating is not allowed for this hackathon.');
            }
            if (isOwner) {
                throw new ForbiddenError('Participants cannot rate their own projects.');
            }
            raterType = HackathonRaterType.PARTICIPANT;
        } else {
            if (!hackathon.allowPublicRating) {
                throw new ForbiddenError('Public rating is not allowed for this hackathon.');
            }
            raterType = HackathonRaterType.PUBLIC;
        }

        if (!hackathon.ratingCategories.some((rc) => rc.id === categoryId)) {
            throw new ValidationError('This rating category is not valid for this hackathon', 'categoryId');
        }

        return this.hackathonRepo.rateProject(hpId, raterId, raterType, { categoryId, rating, comment });
    }

    async getLeaderboard(hackathonId: string, raterType?: string): Promise<LeaderboardEntry[]> {

        const hackathon = await this.hackathonRepo.findById(hackathonId);
        if (!hackathon) {
            throw new NotFoundError('Hackathon', hackathonId);
        }

        let validRaterType: HackathonRaterType | undefined;
        if (raterType) {
            if (!Object.values(HackathonRaterType).includes(raterType as HackathonRaterType)) {
                throw new ValidationError('Invalid rater type specified', 'type');
            }
            validRaterType = raterType as HackathonRaterType;
        }

        return this.hackathonRepo.getLeaderboard(hackathonId, validRaterType);
    }



    async getThemeCategories(): Promise<HackathonThemeCategory[]> {
        return this.hackathonRepo.getThemeCategories();
    }

    async getRatingCategories(): Promise<HackathonRatingCategory[]> {
        return this.hackathonRepo.getRatingCategories();
    }



    private validateHackathonDates(startDateStr: string, endDateStr: string): void {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new ValidationError('Invalid date format', 'startDate/endDate');
        }
        if (endDate <= startDate) {
            throw new ValidationError('End date must be after start date', 'endDate');
        }
    }

    private async getHackathonAndCheckOwnership(hackathonId: string, userId: string): Promise<Hackathon> {
        const hackathon = await this.hackathonRepo.findById(hackathonId);
        if (!hackathon) {
            throw new NotFoundError('Hackathon', hackathonId);
        }
        if (hackathon.authorId !== userId) {
            throw new ForbiddenError('You do not have permission to modify this hackathon.');
        }
        return hackathon;
    }

    private async handleCategoryCreation(
        newThemes: string[] = [],
        themeIds: string[] = [],
        newRatingCategories: { name: string; order: number }[] = [],
        ratingCategoryIds: string[] = [],
    ): Promise<[HackathonThemeCategory[] | undefined, HackathonRatingCategory[] | undefined]> {

        let allThemes: HackathonThemeCategory[] = [];
        let allRatingCategories: HackathonRatingCategory[] = [];

        if (newThemes.length > 0) {
            const createdThemes = await this.hackathonRepo.findOrCreateThemes(newThemes);
            allThemes.push(...createdThemes);
        }
        if (themeIds.length > 0) {
            // (В ідеалі, тут має бути перевірка, чи ці ID існують)
            allThemes.push(...themeIds.map(id => ({ id } as HackathonThemeCategory)));
        }


        if (newRatingCategories.length > 0) {
            const createdCats = await this.hackathonRepo.findOrCreateRatingCategories(newRatingCategories);
            allRatingCategories.push(...createdCats);
        }
        if (ratingCategoryIds.length > 0) {
            // (Так само, потрібна перевірка ID)
            allRatingCategories.push(...ratingCategoryIds.map(id => ({ id } as HackathonRatingCategory)));
        }

        return [
            allThemes.length > 0 ? allThemes : undefined,
            allRatingCategories.length > 0 ? allRatingCategories : undefined
        ];
    }
}
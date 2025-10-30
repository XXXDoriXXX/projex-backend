// src/repositories/hackathon.repository.ts

import { injectable } from 'tsyringe';
import { prisma } from '../prisma';
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
import {
    HackathonWithDetails,
    HackathonProjectWithDetails,
    LeaderboardEntry,
    RateProjectDto,
    HackathonProjectForAggregation,
    HackathonWithDetailsFromRepo,
    hackathonDetailsInclude,
    safeUserSelect, PaginatedHackathonsResponse,
} from '../types/hackathon/hackathon.types';
import { IHackathonRepository } from './hackathon.repository.interface';
import {ValidationError} from "../errors/CustomErrors";

type Decoded = { id: string; startTs: number };
@injectable()
export class HackathonRepository implements IHackathonRepository {

    private encodeCursor(item: { id: string; startDate: Date }) {
        return Buffer.from(JSON.stringify({
            id: item.id,
            startTs: item.startDate.getTime(),
        })).toString('base64');
    }

    private decodeCursor(cursor: string): { id: string; startDate: Date } {
        const { id, startTs } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as Decoded;
        return { id, startDate: new Date(startTs) };
    }
    async create(data: Prisma.HackathonCreateInput): Promise<Hackathon> {
        return prisma.hackathon.create({
            data,
        });
    }

    async update(hackathonId: string, data: Prisma.HackathonUpdateInput): Promise<Hackathon> {
        return prisma.hackathon.update({
            where: { id: hackathonId },
            data,
        });
    }

    async delete(hackathonId: string, authorId: string): Promise<void> {
        await prisma.hackathon.delete({
            where: { id: hackathonId, authorId },
        });
    }
    async deleteById(hackathonId: string): Promise<void> {
        await prisma.hackathon.delete({
            where: { id: hackathonId },
        });
    }

    async findById(hackathonId: string): Promise<HackathonWithDetailsFromRepo | null> {
        return prisma.hackathon.findUnique({
            where: { id: hackathonId },
            include: hackathonDetailsInclude,
        });
    }

    async findMany(options: {
        status?: HackathonStatus | 'ALL';
        limit: number;
        cursor?: string;
        sortOrder: 'asc' | 'desc';
        search?: string;
        themeIds?: string[];
    }): Promise<PaginatedHackathonsResponse> {

        const { status, limit, cursor, sortOrder, search, themeIds } = options;

        const take = limit + 1;
        const isDesc = sortOrder === 'desc';
        const whereConditions: Prisma.HackathonWhereInput[] = [];

        if (status && status !== 'ALL') {
            whereConditions.push({ status });
        }

        if (search) {
            whereConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (themeIds && themeIds.length > 0) {
            whereConditions.push({
                themes: {
                    some: {
                        id: { in: themeIds },
                    },
                },
            });
        }

        const orderBy = [
            { startDate: sortOrder },
            { id: sortOrder },
        ];

        if (cursor) {
            const decodedCursor = this.decodeCursor(cursor);
            const operator = isDesc ? 'lt' : 'gt';

            whereConditions.push({
                OR: [
                    {
                        startDate: { [operator]: decodedCursor.startDate },
                    },
                    {
                        startDate: decodedCursor.startDate,
                        id: { [operator]: decodedCursor.id },
                    },
                ],
            });
        }

        const items = await prisma.hackathon.findMany({
            take,
            where: {
                AND: whereConditions,
            },
            orderBy: orderBy as any,
        });

        let nextCursor: string | null = null;
        if (items.length > limit) {
            const nextItem = items.pop();
            if (nextItem) {
                nextCursor = this.encodeCursor(nextItem);
            }
        }

        return {
            data: items,
            nextCursor,
        };
    }

    async findParticipant(hackathonId: string, userId: string): Promise<HackathonParticipant | null> {
        return prisma.hackathonParticipant.findUnique({
            where: {
                userId_hackathonId: { userId, hackathonId },
            },
        });
    }

    async addParticipant(hackathonId: string, userId: string): Promise<HackathonParticipant> {
        return prisma.hackathonParticipant.create({
            data: {
                hackathonId,
                userId,
            },
        });
    }

    async removeParticipant(participantId: string): Promise<void> {
        await prisma.hackathonParticipant.delete({
            where: { id: participantId },
        });
    }

    async findHackathonProjectById(hpId: string): Promise<HackathonProjectWithDetails | null> {
        return prisma.hackathonProject.findUnique({
            where: { id: hpId },
            include: {
                project: {
                    include: {
                        user: safeUserSelect,
                        subauthors: safeUserSelect,
                    },
                },
                hackathon: {
                    include: {
                        author: safeUserSelect,
                        judges: safeUserSelect,
                        participants: {
                            include: {
                                user: safeUserSelect
                            }
                        },
                        ratingCategories: true,
                    },
                },
            },
        });
    }

    async findSubmittedProject(hackathonId: string, projectId: string): Promise<HackathonProject | null> {
        return prisma.hackathonProject.findUnique({
            where: {
                hackathonId_projectId: { hackathonId, projectId }
            }
        });
    }

    async addProject(hackathonId: string, projectId: string): Promise<HackathonProject> {
        return prisma.hackathonProject.create({
            data: {
                hackathonId,
                projectId,
            },
        });
    }

    async removeProject(hpId: string): Promise<void> {
        await prisma.hackathonProject.delete({
            where: { id: hpId },
        });
    }

    async rateProject(
        hpId: string,
        raterId: string,
        raterType: HackathonRaterType,
        dto: RateProjectDto,
    ): Promise<HackathonProjectRating> {
        const { categoryId, rating, comment } = dto;

        return prisma.hackathonProjectRating.upsert({
            where: {
                hackathonProjectId_raterId_categoryId_raterType: {
                    hackathonProjectId: hpId,
                    raterId,
                    categoryId,
                    raterType,
                },
            },
            update: {
                rating,
                comment,
            },
            create: {
                hackathonProjectId: hpId,
                raterId,
                categoryId,
                rating,
                comment,
                raterType,
            },
        });
    }

    async getLeaderboard(
        hackathonId: string,
        raterType?: HackathonRaterType,
    ): Promise<LeaderboardEntry[]> {

        const whereClause: Prisma.HackathonProjectRatingWhereInput = {
            project: {
                hackathonId: hackathonId,
            },
            raterType: raterType,
        };

        const results = await prisma.hackathonProjectRating.groupBy({
            by: ['hackathonProjectId'],
            where: whereClause,
            _sum: {
                rating: true,
            },
            orderBy: {
                _sum: {
                    rating: 'desc',
                },
            },
        });

        const projectIds = results.map((r) => r.hackathonProjectId);
        const projects = await prisma.hackathonProject.findMany({
            where: {
                id: { in: projectIds },
            },
            include: {
                project: {
                    select: {
                        title: true,
                        id: true,
                    },
                },
            },
        });

        const projectMap = new Map(projects.map((p) => [p.id, p.project.title]));

        return results.map((r) => ({
            projectId: r.hackathonProjectId,
            projectTitle: projectMap.get(r.hackathonProjectId) || 'Unknown Project',
            totalScore: r._sum.rating || 0,
        }));
    }


    async findOrCreateThemes(names: string[]): Promise<HackathonThemeCategory[]> {
        const operations = names.map((name) =>
            prisma.hackathonThemeCategory.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        );
        return prisma.$transaction(operations);
    }


    async findOrCreateRatingCategories(
        categories: { name: string; order: number }[],
    ): Promise<HackathonRatingCategory[]> {
        const operations = categories.map((cat) =>
            prisma.hackathonRatingCategory.upsert({
                where: { name_order: { name: cat.name, order: cat.order } },
                update: {},
                create: { name: cat.name, order: cat.order },
            }),
        );
        return prisma.$transaction(operations);
    }

    async getThemeCategories(): Promise<HackathonThemeCategory[]> {
        return prisma.hackathonThemeCategory.findMany({ orderBy: { name: 'asc' } });
    }

    async getRatingCategories(): Promise<HackathonRatingCategory[]> {
        return prisma.hackathonRatingCategory.findMany({ orderBy: { order: 'asc' } });
    }

    async findUserProjectsInHackathon(hackathonId: string, userId: string): Promise<HackathonProjectForAggregation[]> {
        return prisma.hackathonProject.findMany({
            where: {
                hackathonId: hackathonId,
                project: {
                    userId: userId,
                },
            },

            include: {
                project: {
                    include: {
                        user: safeUserSelect,
                        subauthors: safeUserSelect,
                        technologies: true,
                        _count: {
                            select: { likes: true }
                        }
                    }
                }
            },
        });
    }
}
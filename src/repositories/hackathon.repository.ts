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
    HackathonRaterType, ProjectStatus, Project,
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
    ): Promise<any[]> {

        const rawAggregations = await prisma.hackathonProjectRating.groupBy({
            by: ['hackathonProjectId', 'categoryId', 'raterType'],
            where: {
                project: {
                    hackathonId: hackathonId,
                },
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
            _sum: {
                rating: true,
            },
        });

        if (rawAggregations.length === 0) {
            return [];
        }
        const projectIds = [...new Set(rawAggregations.map((r) => r.hackathonProjectId))];
        const categoryIds = [...new Set(rawAggregations.map((r) => r.categoryId))];

        const projects = await prisma.hackathonProject.findMany({
            where: {
                id: { in: projectIds },
            },
            select: {
                id: true,
                project: {
                    select: {
                        title: true,
                    },
                },
            },
        });

        const categories = await prisma.hackathonRatingCategory.findMany({
            where: {
                id: { in: categoryIds },
            },
            select: {
                id: true,
                name: true,
            },
        });

        const projectMap = new Map(projects.map((p) => [p.id, p.project.title]));
        const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

        const projectsData = new Map<string, any>();

        for (const agg of rawAggregations) {
            const projectId = agg.hackathonProjectId;

            if (!projectsData.has(projectId)) {
                projectsData.set(projectId, {
                    projectId: projectId,
                    projectTitle: projectMap.get(projectId) || 'Unknown Project',
                    totalScore: 0,
                    categoryScores: new Map<string, any>(),

                    _totalRatingSum: 0,
                    _totalRatingCount: 0,
                });
            }

            const projectEntry = projectsData.get(projectId)!;
            const categoryId = agg.categoryId;

            if (!projectEntry.categoryScores.has(categoryId)) {
                projectEntry.categoryScores.set(categoryId, {
                    categoryId: categoryId,
                    categoryName: categoryMap.get(categoryId) || 'Unknown Category',
                    averageScore: 0,
                    scoresByVoterType: [],

                    _categoryRatingSum: 0,
                    _categoryRatingCount: 0,
                });
            }

            const categoryEntry = projectEntry.categoryScores.get(categoryId)!;

            const averageScore = agg._avg.rating || 0;
            const voteCount = agg._count.rating || 0;
            const ratingSum = agg._sum.rating || 0;

            categoryEntry.scoresByVoterType.push({
                type: agg.raterType,
                averageScore: parseFloat(averageScore.toFixed(2)),
                voteCount: voteCount,
            });

            categoryEntry._categoryRatingSum += ratingSum;
            categoryEntry._categoryRatingCount += voteCount;
            projectEntry._totalRatingSum += ratingSum;
            projectEntry._totalRatingCount += voteCount;
        }

        const finalLeaderboard = [];

        for (const projectEntry of projectsData.values()) {
            const categoryScores = [];

            for (const categoryEntry of projectEntry.categoryScores.values()) {

                categoryEntry.averageScore = categoryEntry._categoryRatingCount > 0
                    ? parseFloat((categoryEntry._categoryRatingSum / categoryEntry._categoryRatingCount).toFixed(2))
                    : 0;

                categoryEntry.scoresByVoterType.sort((a: any, b: any) => a.type.localeCompare(b.type));

                delete categoryEntry._categoryRatingSum;
                delete categoryEntry._categoryRatingCount;

                categoryScores.push(categoryEntry);
            }

            projectEntry.totalScore = projectEntry._totalRatingCount > 0
                ? parseFloat((projectEntry._totalRatingSum / projectEntry._totalRatingCount).toFixed(2))
                : 0;

            categoryScores.sort((a: any, b: any) => a.categoryName.localeCompare(b.categoryName));
            projectEntry.categoryScores = categoryScores;

            delete projectEntry._totalRatingSum;
            delete projectEntry._totalRatingCount;

            finalLeaderboard.push(projectEntry);
        }

        finalLeaderboard.sort((a, b) => b.totalScore - a.totalScore);

        return finalLeaderboard;
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
    async updateStatus(id: string, status: HackathonStatus): Promise<Hackathon> {
        return prisma.hackathon.update({
            where: { id },
            data: { status: status },
        });
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
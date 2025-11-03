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
const W_JUDGE = 0.5;
const W_PARTICIPANT = 0.3;
const W_PUBLIC = 0.2;

const m_JUDGE = 3;
const m_PARTICIPANT = 5;
const m_PUBLIC = 10;

const C_DEFAULT = 6.0;

const BAYESIAN_PARAMS = {
    [HackathonRaterType.JUDGE]: { m: m_JUDGE, W: W_JUDGE },
    [HackathonRaterType.PARTICIPANT]: { m: m_PARTICIPANT, W: W_PARTICIPANT },
    [HackathonRaterType.PUBLIC]: { m: m_PUBLIC, W: W_PUBLIC },
};
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
            include: {
                author: safeUserSelect
            }
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

        const hackathonAvg = await prisma.hackathonProjectRating.aggregate({
            where: {
                project: {
                    hackathonId: hackathonId,
                },
            },
            _avg: {
                rating: true,
            },
        });
        const C = hackathonAvg._avg.rating || C_DEFAULT;

        const rawAggregations = await prisma.hackathonProjectRating.groupBy({
            by: ['hackathonProjectId', 'categoryId', 'raterType'],
            where: {
                project: {
                    hackathonId: hackathonId,
                },
            },
            _sum: {
                rating: true,
            },
            _count: {
                rating: true,
            },
            _avg: {
                rating: true
            }
        });

        if (rawAggregations.length === 0) {
            return [];
        }

        const projectIds = [...new Set(rawAggregations.map((r) => r.hackathonProjectId))];
        const categoryIds = [...new Set(rawAggregations.map((r) => r.categoryId))];

        const [projects, categories] = await Promise.all([
            prisma.hackathonProject.findMany({
                where: { id: { in: projectIds } },
                select: { id: true, project: { select: { title: true } } },
            }),
            prisma.hackathonRatingCategory.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, name: true },
            })
        ]);

        const projectMap = new Map(projects.map((p) => [p.id, p.project.title]));
        const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

        const categoryAggregates = new Map<string, any>();

        for (const agg of rawAggregations) {
            const key = `${agg.hackathonProjectId}__${agg.categoryId}`;
            if (!categoryAggregates.has(key)) {
                categoryAggregates.set(key, {
                    projectId: agg.hackathonProjectId,
                    categoryId: agg.categoryId,
                    raterData: {}
                });
            }

            categoryAggregates.get(key)!.raterData[agg.raterType] = {
                v: agg._count.rating || 0,
                sum: agg._sum.rating || 0,
                R: agg._avg.rating || 0
            };
        }

        const projectsData = new Map<string, {
            projectId: string,
            projectTitle: string,
            totalScore: number,
            categoryScores: any[]
        }>();

        for (const [key, agg] of categoryAggregates.entries()) {
            const { projectId, categoryId, raterData } = agg;

            let finalCategoryScore = 0;
            const scoresByVoterType = [];

            for (const type of Object.values(HackathonRaterType)) {
                const data = raterData[type] || { v: 0, sum: 0, R: 0 };
                const { m, W } = BAYESIAN_PARAMS[type];
                const trustedAvg = ((data.sum) + (m * C)) / (data.v + m);

                finalCategoryScore += (trustedAvg * W);

                if (data.v > 0) {
                    scoresByVoterType.push({
                        type: type,
                        averageScore: parseFloat(data.R.toFixed(2)),
                        voteCount: data.v
                    });
                }
            }

            if (!projectsData.has(projectId)) {
                projectsData.set(projectId, {
                    projectId: projectId,
                    projectTitle: projectMap.get(projectId) || 'Unknown Project',
                    totalScore: 0,
                    categoryScores: [],
                });
            }

            const projectEntry = projectsData.get(projectId)!;
            projectEntry.totalScore += finalCategoryScore;
            projectEntry.categoryScores.push({
                categoryId: categoryId,
                categoryName: categoryMap.get(categoryId) || 'Unknown Category',
                averageScore: parseFloat(finalCategoryScore.toFixed(2)),
                scoresByVoterType: scoresByVoterType.sort((a, b) => a.type.localeCompare(b.type))
            });
        }
        const finalLeaderboard = Array.from(projectsData.values());
        for (const project of finalLeaderboard) {
            project.totalScore = parseFloat(project.totalScore.toFixed(2));
            project.categoryScores.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
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
    async findUserRatingsInHackathon(hackathonId: string, userId: string): Promise<(HackathonProjectRating & {
        category: HackathonRatingCategory;
        project: (HackathonProject & {
            project: { id: string; title: string; };
        });
    })[]> {
        return prisma.hackathonProjectRating.findMany({
            where: {
                raterId: userId,
                project: {
                    hackathonId: hackathonId
                }
            },
            include: {
                category: true,
                project: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        }) as any;
    }
    async findRatingsForProject(hpId: string): Promise<(HackathonProjectRating & {
        category: HackathonRatingCategory;
        rater: { id: string; username: string; avatarUrl: string | null; };
    })[]> {
        return prisma.hackathonProjectRating.findMany({
            where: {
                hackathonProjectId: hpId
            },
            include: {
                category: true,
                rater: safeUserSelect
            },
            orderBy: {
                createdAt: 'desc'
            }
        }) as any;
    }
}
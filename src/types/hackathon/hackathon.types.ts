// src/types/hackathon/hackathon.types.ts

import {
    Hackathon,
    User,
    HackathonThemeCategory,
    HackathonRatingCategory,
    HackathonParticipant,
    HackathonProject,
    Project,
    Prisma,
    HackathonStatus,
    HackathonRaterType, ProjectStatus, Technology,
} from '@prisma/client';

export interface CreateHackathonDto {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    themeIds?: string[];
    ratingCategoryIds?: string[];
    judgeIds?: string[];
    newThemes?: string[];
    newRatingCategories?: { name: string; order: number }[];
    allowParticipantRating: boolean;
    allowPublicRating: boolean;
}
export interface HackathonProjectSummary {
    hpId: string;
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    status: ProjectStatus;
    likesCount: number;
    viewsCount: number;
    technologies: Technology[];
    createdAt: Date;
}
export type UpdateHackathonDto = Partial<CreateHackathonDto>;
export interface SubmitProjectDto {
    projectId: string;
}
export interface RateProjectDto {
    categoryId: string;
    rating: number;
    comment?: string;
}

export const safeUserSelect = {
    select: {
        id: true,
        username: true,
        avatarUrl: true
    }
};

export const hackathonWithDetailsValidator = Prisma.validator<Prisma.HackathonDefaultArgs>()({
    include: {
        author: safeUserSelect,
        judges: safeUserSelect,
        themes: true,
        ratingCategories: true,
        participants: {
            include: {
                user: safeUserSelect,
            },
        },
        projects: {
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        previewUrl: true,
                        githubUrl: true,
                        demoUrl: true,
                        status: true,
                        createdAt: true,
                        technologies: true,
                        _count: {
                            select: { likes: true }
                        }
                    }
                }
            }
        },
    },
});


export const hackathonDetailsInclude = {
    author: safeUserSelect,
    judges: safeUserSelect,
    themes: true,
    ratingCategories: true,
    participants: { include: { user: safeUserSelect } },
    projects: {
        include: {
            project: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    previewUrl: true,
                    githubUrl: true,
                    demoUrl: true,
                    status: true,
                    createdAt: true,
                    technologies: true,
                    _count: {
                        select: { likes: true }
                    }
                }
            }
        }
    },
};
export type HackathonWithDetailsFromRepo = Prisma.HackathonGetPayload<{
    include: typeof hackathonDetailsInclude
}>;
export interface HackathonWithDetails extends Omit<HackathonWithDetailsFromRepo, 'projects'> {
    projects: HackathonProjectSummary[];
}


const hackathonProjectWithDetails = Prisma.validator<Prisma.HackathonProjectDefaultArgs>()({
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

export type HackathonProjectWithDetails = Prisma.HackathonProjectGetPayload<
    typeof hackathonProjectWithDetails
>;

const hackathonProjectForAggregation = Prisma.validator<Prisma.HackathonProjectDefaultArgs>()({
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
    }
});
export type HackathonProjectForAggregation = Prisma.HackathonProjectGetPayload<typeof hackathonProjectForAggregation>;

export interface LeaderboardEntry {
    projectId: string;
    projectTitle: string;
    totalScore: number;
}
export interface GetHackathonsQueryDto {
    limit?: number;
    cursor?: string;
    status?: HackathonStatus | 'ALL';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    themeIds?: string[];
}
export interface PaginatedHackathonsResponse {
    data: HackathonProjectWithDetails[];
    nextCursor: string | null;
}
export interface AggregatedLeaderboardData {
    projectTotalScores: {
        hackathonProjectId: string;
        _sum: { rating: number | null };
    }[];
    detailedRatings: {
        hackathonProjectId: string;
        hackathonRatingCategoryId: string;
        raterType: HackathonRaterType;
        _avg: { rating: number | null };
        _count: { rating: number | null };
    }[];
    projects: {
        id: string;
        project: { id: string; title: string };
    }[];
    categories: {
        id: string;
        name: string;
    }[];
}

export interface LeaderboardResponse {
    projectId: string;
    projectTitle: string;
    totalScore: number;
    categoryScores: CategoryScore[];
}

export interface CategoryScore {
    categoryId: string;
    categoryName: string;
    averageScore: number;
    scoresByVoterType: ScoreByVoterType[];
}

export interface ScoreByVoterType {
    type: HackathonRaterType;
    averageScore: number;
    voteCount: number;
}
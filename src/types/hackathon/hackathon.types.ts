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
    HackathonRaterType,
} from '@prisma/client';

// DTO для створення хакатону
export interface CreateHackathonDto {
    title: string;
    description: string;
    startDate: string; // ISO Date string
    endDate: string; // ISO Date string

    // ID існуючих
    themeIds?: string[];
    ratingCategoryIds?: string[];
    judgeIds?: string[];

    // Створення нових
    newThemes?: string[];
    newRatingCategories?: { name: string; order: number }[];

    // Налаштування
    allowParticipantRating: boolean;
    allowPublicRating: boolean;
}

// DTO для оновлення (часткове)
export type UpdateHackathonDto = Partial<CreateHackathonDto>;

// DTO для подачі проекту
export interface SubmitProjectDto {
    projectId: string;
}

// DTO для оцінювання
export interface RateProjectDto {
    categoryId: string;
    rating: number; // Наприклад, 1-10
    comment?: string;
}

// =================================================================
// ТИПИ ДЛЯ PRISMA (для чистоти коду в сервісах)
// =================================================================

// Визначаємо, що ми хочемо отримувати при запиті "деталей"
const hackathonWithDetails = Prisma.validator<Prisma.HackathonDefaultArgs>()({
    include: {
        author: true,
        judges: true,
        themes: true,
        ratingCategories: true,
        participants: {
            include: {
                user: true, // Включаємо юзера, що приєднався
            },
        },
        projects: {
            include: {
                project: true, // Включаємо сам проект
            },
        },
    },
});

// Тип для детального хакатону
export type HackathonWithDetails = Prisma.HackathonGetPayload<typeof hackathonWithDetails>;

// Тип для проекту, поданого на хакатон
const hackathonProjectWithDetails = Prisma.validator<Prisma.HackathonProjectDefaultArgs>()({
    include: {
        project: {
            include: {
                user: true, // Автор проекту
                subauthors: true, // Співавтори
            },
        },
        hackathon: {
            include: {
                author: true,
                judges: true,
                participants: true,
                ratingCategories: true,
            },
        },
    },
});

export type HackathonProjectWithDetails = Prisma.HackathonProjectGetPayload<
    typeof hackathonProjectWithDetails
>;

// Тип для результатів лідерборду
export interface LeaderboardEntry {
    projectId: string;
    projectTitle: string;
    totalScore: number;
    // Можна додати деталі проекту, якщо потрібно
}
// src/repositories/hackathon.repository.interface.ts

import {
    Hackathon,
    HackathonParticipant,
    HackathonProject,
    HackathonProjectRating, HackathonRaterType,
    HackathonRatingCategory,
    HackathonStatus,
    HackathonThemeCategory,
    Prisma,
} from '@prisma/client';
import {
    HackathonWithDetails,
    HackathonProjectWithDetails,
    LeaderboardEntry,
    RateProjectDto,
} from '../types/hackathon/hackathon.types';

export interface IHackathonRepository {
    create(data: Prisma.HackathonCreateInput): Promise<Hackathon>;
    update(hackathonId: string, data: Prisma.HackathonUpdateInput): Promise<Hackathon>;
    delete(hackathonId: string, authorId: string): Promise<void>;
    deleteById(hackathonId: string): Promise<void>
    findById(hackathonId: string): Promise<HackathonWithDetails | null>;
    findMany(status?: HackathonStatus): Promise<Hackathon[]>;

    findParticipant(hackathonId: string, userId: string): Promise<HackathonParticipant | null>;
    addParticipant(hackathonId: string, userId: string): Promise<HackathonParticipant>;
    removeParticipant(participantId: string): Promise<void>;

    findHackathonProjectById(hpId: string): Promise<HackathonProjectWithDetails | null>;
    findSubmittedProject(hackathonId: string, projectId: string): Promise<HackathonProject | null>;
    addProject(hackathonId: string, projectId: string): Promise<HackathonProject>;
    removeProject(hpId: string): Promise<void>;

    rateProject(
        hpId: string,
        raterId: string,
        raterType: HackathonRaterType,
        dto: RateProjectDto,
    ): Promise<HackathonProjectRating>;
    getLeaderboard(hackathonId: string, raterType?: HackathonRaterType): Promise<LeaderboardEntry[]>;

    findOrCreateThemes(names: string[]): Promise<HackathonThemeCategory[]>;
    findOrCreateRatingCategories(
        categories: { name: string; order: number }[],
    ): Promise<HackathonRatingCategory[]>;

    getThemeCategories(): Promise<HackathonThemeCategory[]>;
    getRatingCategories(): Promise<HackathonRatingCategory[]>;
}
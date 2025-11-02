
import {
    Hackathon,
    HackathonParticipant,
    HackathonProject,
    HackathonProjectRating,
    HackathonRatingCategory,
    HackathonStatus,
    HackathonThemeCategory,
} from '@prisma/client';
import {
    CreateHackathonDto,
    UpdateHackathonDto,
    RateProjectDto,
    HackathonWithDetails,
    LeaderboardEntry, PaginatedHackathonsResponse, GetHackathonsQueryDto, HackathonProjectSummary,
} from '../types/hackathon/hackathon.types';

export interface IHackathonService {
    createHackathon(authorId: string, dto: CreateHackathonDto): Promise<Hackathon>;
    updateHackathonStatus(hackathonId: string,userid:string, status: HackathonStatus): Promise<Hackathon>;
    updateHackathon(hackathonId: string, userId: string, dto: UpdateHackathonDto): Promise<Hackathon>;
    deleteHackathon(hackathonId: string, userId: string): Promise<void>;
    getHackathonById(hackathonId: string): Promise<HackathonWithDetails>;
    getAllHackathons(query: GetHackathonsQueryDto): Promise<PaginatedHackathonsResponse>;

    joinHackathon(hackathonId: string, userId: string): Promise<HackathonParticipant>;
    leaveHackathon(hackathonId: string, userId: string): Promise<void>;

    submitProject(hackathonId: string, userId: string, projectId: string): Promise<HackathonProject>;
    removeProject(hpId: string, userId: string): Promise<void>;

    rateProject(hpId: string, raterId: string, dto: RateProjectDto): Promise<HackathonProjectRating>;
    getLeaderboard(hackathonId: string, raterType?: string): Promise<LeaderboardEntry[]>;

    getThemeCategories(): Promise<HackathonThemeCategory[]>;
    getRatingCategories(): Promise<HackathonRatingCategory[]>;

    getUserProjectsInHackathon(hackathonId: string, userId: string): Promise<HackathonProjectSummary[]>;
}
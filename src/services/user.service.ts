import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { type IUserRepository } from '../repositories/user.repository';
import { NotFoundError } from '../errors/CustomErrors';
import {Project, SocialMedia} from "@prisma/client";
export interface PublicProject {
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    createdAt: Date;
}
export interface IUserProfile {
    id: string;
    username: string;
    avatarUrl?: string | null;
    email?: string | null;
    bio?: string | null;
    projects: Project[];
    socialLinks: SocialMedia[];
    followersCount: number;
    followingCount: number;
    projectsCount: number;
    createdAt: Date;
}

export interface IUserService {
    getUserProfileByUsername(username: string): Promise<{
        id: any;
        username: any;
        avatarUrl: any;
        bio: any;
        email: any;
        projects: PublicProject[];
        socialLinks: SocialMedia[];
        followersCount: number;
        followingCount: number;
        projectsCount: number;
        createdAt: any
    }>;
}

@injectable()
export class UserService implements IUserService {
    constructor(@inject('IUserRepository') private readonly userRepo: IUserRepository) {}

    async getUserProfileByUsername(username: string): Promise<{
        id: any;
        username: any;
        avatarUrl: any;
        bio: any;
        email: any;
        projects: PublicProject[];
        socialLinks: SocialMedia[];
        followersCount: number;
        followingCount: number;
        projectsCount: number;
        createdAt: any
    }> {
        const user = await this.userRepo.findByUsername(username);

        if (!user || !user.isActive) {
            throw new NotFoundError('User', username);
        }

        const { password, emailVerificationToken, passwordResetToken, ...publicData } = user;

        return {
            id: publicData.id,
            username: publicData.username,
            avatarUrl: publicData.avatarUrl,
            bio: publicData.bio,
            email: publicData.email,
            projects: publicData.projects,
            socialLinks: publicData.socialLinks,
            followersCount: publicData._count.followers,
            followingCount: publicData._count.following,
            projectsCount: publicData._count.projects,
            createdAt: publicData.createdAt,
        };
    }
}
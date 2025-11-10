import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { type IUserRepository } from '../repositories/user.repository';
import {AppError, ForbiddenError, NotFoundError, ValidationError} from '../errors/CustomErrors';
import {Prisma, Project, ProjectStatus, SocialMedia, Technology, User} from "@prisma/client";
import {type IProjectRepository} from "../repositories/project.repository";
import sharp from "sharp";
import type {IAzureBlobService} from "./azure.blob.service";
import {IAuthRepository} from "../repositories/auth.repository";

export interface PublicProject {
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    status: string;
    likesCount?: number;
    viewsCount?: number;
    technologies?: Technology[];
    createdAt: Date;
}

export interface RawUserWithProjects extends User {
    projects: {
        id: string;
        title: string;
        description: string;
        previewUrl: string | null;
        githubUrl: string | null;
        demoUrl: string | null;
        createdAt: Date;
        status: ProjectStatus;
        technologies: { id: string; name: string }[];
        _count: { likes: number };
    }[];
    socialLinks: SocialMedia[];
    _count?: {
        followers: number;
        following: number;
        projects: number;
        Hackathon: number;
        HackathonParticipant: number;
        subauthoredProjects: number;
    };
}
export type UserUpdatePayload = {
    username?: string;
    bio?: string;
    avatarUrl?: string;
};

export type SocialLinkPayload = {
    platform: string;
    url: string;
    handle?: string | null;
};
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
    getUserProfileByUsername(username: string, userid?:string): Promise<{
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
        authoredHackathonsCount: number;
        participatedHackathonsCount: number;
        subauthoredProjectsCount: number;
    }>;
    updateUserProfile(userId: string, data: UserUpdatePayload): Promise<User>;
    addSocialMediaLink(userId: string, link: SocialLinkPayload): Promise<SocialMedia>;
    deleteSocialMediaLink(userId: string, socialMediaId: string): Promise<void>;
    updateUserAvatar(
        userId: string,
        file: { buffer: Buffer; mimetype: string; originalname: string }
    ): Promise<string>;
}
const MAX_AVATAR_SIZE_MB = 5;
const AVATAR_SIZE_PIXELS = 300;
@injectable()
export class UserService implements IUserService {
    constructor(
        @inject('IUserRepository') private readonly userRepo: IUserRepository,
        @inject('IProjectRepository') private readonly projectRepo: IProjectRepository,
       @inject('IAzureBlobService') private azureService: IAzureBlobService,
        @inject('IAuthRepository') private authRepo: IAuthRepository,
    ) {}

    async getUserProfileByUsername(username: string, userid?:string): Promise<{
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
        createdAt: any;
        authoredHackathonsCount: number;
        participatedHackathonsCount: number;
        subauthoredProjectsCount: number;
    }> {
        let user;


        if(!userid){
            user = await this.userRepo.findByUsername(username);
        }
        else{
            user = await this.userRepo.findByUsernameAuthor(username);
        }


        if (!user || !user.isActive) {
            throw new NotFoundError('User', username);
        }

        const { password, emailVerificationToken, passwordResetToken, ...publicData } = user;
        const projectIds = publicData.projects.map(p => p.id);
        const viewsMap = new Map<string, number>();

        for (const projectId of projectIds) {
            const viewsAggregation = await this.projectRepo.getViewsCount(projectId);
            viewsMap.set(projectId, viewsAggregation._sum.count || 0);
        }

        const publicProjects: PublicProject[] = publicData.projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            previewUrl: project.previewUrl,
            githubUrl: project.githubUrl,
            demoUrl: project.demoUrl,
            createdAt: project.createdAt,
            likesCount: project._count.likes,
            viewsCount: viewsMap.get(project.id) || 0,
            technologies: project.technologies,
            status: project.status,
        }));

        return {
            id: publicData.id,
            username: publicData.username,
            avatarUrl: publicData.avatarUrl,
            bio: publicData.bio,
            email: publicData.email,
            projects: publicProjects,
            socialLinks: publicData.socialLinks,
            followersCount: publicData._count?.followers ?? 0,
            followingCount: publicData._count?.following ?? 0,
            projectsCount: publicData._count?.projects ?? 0,
            createdAt: publicData.createdAt,
            authoredHackathonsCount: publicData._count?.Hackathon ?? 0,
            participatedHackathonsCount: publicData._count?.HackathonParticipant ?? 0,
            subauthoredProjectsCount: publicData._count?.subauthoredProjects ?? 0,
        };
    }
    async updateUserProfile(userId: string, data: UserUpdatePayload): Promise<User> {
        if (data.username) {
            const existingUser = await this.userRepo.findByUsername(data.username);
            if (existingUser && existingUser.id !== userId) {
                throw new ForbiddenError('Username already taken');
            }
        }

        const updateData: Prisma.UserUpdateInput = {
            username: data.username,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
        };

        return this.userRepo.updateUser(userId, updateData);
    }

    async addSocialMediaLink(userId: string, link: SocialLinkPayload): Promise<SocialMedia> {
        return this.userRepo.addSocialLink(userId, link.platform, link.url, link.handle ?? null);
    }

    async deleteSocialMediaLink(userId: string, socialMediaId: string): Promise<void> {
        const link = await this.userRepo.getSocialLinkById(socialMediaId);
        if (!link) {
            throw new NotFoundError('Social link not found');
        }
        if (link.userId !== userId) {
            throw new ForbiddenError('You can only delete your own social links');
        }

        await this.userRepo.removeSocialLink(socialMediaId);
    }
    async updateUserAvatar(
        userId: string,
        file: { buffer: Buffer; mimetype: string; originalname: string }
    ): Promise<string> {
        const fileSizeInMB = file.buffer.length / (1024 * 1024);

        if (!file.mimetype.startsWith('image/')) {
            throw new ValidationError('Unsupported file type. Only images are allowed for avatar.', 'file');
        }
        if (fileSizeInMB > MAX_AVATAR_SIZE_MB) {
            throw new ValidationError(`Image file is too large. Max size is ${MAX_AVATAR_SIZE_MB}MB.`, 'file');
        }

        let processedBuffer: Buffer;
        try {
            processedBuffer = await sharp(file.buffer)
                .resize(AVATAR_SIZE_PIXELS, AVATAR_SIZE_PIXELS, {
                    fit: sharp.fit.cover,
                    position: sharp.strategy.attention,
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80, progressive: true })
                .toBuffer();
        } catch (error:any) {
            console.error('[AuthService] Sharp processing failed:', error);
            throw new AppError('Failed to process avatar image.');
        }

        const filename = `avatars/${userId}-${Date.now()}.jpg`;
        const newUrl = await this.azureService.upload(filename, processedBuffer, 'image/jpeg');

        const user = await this.authRepo.getUserById(userId);
        if (!user) throw new NotFoundError('User not found');

        if (user.avatarUrl && user.avatarUrl.includes('avatars/')) {
            try {
                const oldFilename = user.avatarUrl.split('?')[0].split('/').pop();
                if(oldFilename) {
                    await this.azureService.delete(`avatars/${oldFilename}`);
                }
            } catch (error) {
                console.warn(`[AuthService] Failed to delete old avatar: ${user.avatarUrl}`, error);
            }
        }

        await this.authRepo.updateUser(userId, { avatarUrl: newUrl });

        return newUrl;
    }
}
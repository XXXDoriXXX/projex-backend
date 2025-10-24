import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { type IUserRepository } from '../repositories/user.repository';
import { NotFoundError } from '../errors/CustomErrors';
import {Project, SocialMedia} from "@prisma/client";
import {type IProjectRepository} from "../repositories/project.repository";
export interface PublicProject {
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    status: string;
    _count: {
        likes: number
    };
    viewsCount: number;
    technologies?: string[];
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
    }>;
}

@injectable()
export class UserService implements IUserService {
    constructor(
        @inject('IUserRepository') private readonly userRepo: IUserRepository,
        @inject('IProjectRepository') private readonly projectRepo: IProjectRepository
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
        createdAt: any
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
            followersCount: publicData._count.followers,
            followingCount: publicData._count.following,
            projectsCount: publicData._count.projects,
            createdAt: publicData.createdAt,
        };
    }
}
import { prisma } from '../prisma';
import { Prisma, SocialMedia, User } from '@prisma/client';
import { injectable } from 'tsyringe';
import {PublicProject, RawUserWithProjects} from '../services/user.service';




export type UserWithProfile = User & {
    projects: PublicProject[];
    socialLinks: SocialMedia[];
    _count?: {
        followers: number;
        following: number;
        projects: number;
    };
};

export interface IUserRepository {
    findByUsername(username: string): Promise<RawUserWithProjects | null>;
    updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    findByUsernameAuthor(username: string): Promise<RawUserWithProjects | null>;
    addSocialLink(userId: string, platform: string, url: string, handle: string | null): Promise<SocialMedia>;
    removeSocialLink(socialMediaId: string): Promise<SocialMedia>;
    getSocialLinkById(id: string): Promise<SocialMedia | null>;
}

@injectable()
export class UserRepository implements IUserRepository {
    async findByUsername(username: string): Promise<RawUserWithProjects | null> {
        return prisma.user.findUnique({
            where: { username },
            include: {
                projects: {
                    where: {
                        status: 'PUBLISHED',
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        previewUrl: true,
                        githubUrl: true,
                        demoUrl: true,
                        createdAt: true,
                        status: true,
                        technologies: true,
                        _count: {
                            select: {
                                likes: true,
                            },
                        },
                    },
                },
                socialLinks: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        projects: true,
                        Hackathon: true,
                        HackathonParticipant: true,
                        subauthoredProjects: true,
                    },
                }
            },
        });
    }
    async findByUsernameAuthor(username: string): Promise<RawUserWithProjects | null> {
        return prisma.user.findUnique({
            where: { username },
            include: {
                projects: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        previewUrl: true,
                        githubUrl: true,
                        demoUrl: true,
                        createdAt: true,
                        technologies: true,
                        status: true,
                        _count: {
                            select: {
                                likes: true,
                            },
                        },
                    },
                },
                socialLinks: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        projects: true,

                        Hackathon: true,
                        HackathonParticipant: true,
                        subauthoredProjects: true,
                    },
                }
            },
        });
    }

    async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return prisma.user.update({
            where: { id },
            data,
        });
    }
    async addSocialLink(userId: string, platform: string, url: string, handle: string | null): Promise<SocialMedia> {
        return prisma.socialMedia.create({
            data: {
                userId,
                platform,
                url,
                handle,
                verified: false,
            },
        });
    }

    async removeSocialLink(socialMediaId: string): Promise<SocialMedia> {
        return prisma.socialMedia.delete({
            where: { id: socialMediaId },
        });
    }

    async getSocialLinkById(id: string): Promise<SocialMedia | null> {
        return prisma.socialMedia.findUnique({
            where: { id },
        });
    }
}
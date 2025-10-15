import { prisma } from '../prisma';
import { Prisma, SocialMedia, User } from '@prisma/client';
import { injectable } from 'tsyringe';
import { PublicProject } from '../services/user.service';




export type UserWithProfile = User & {
    projects: PublicProject[];
    socialLinks: SocialMedia[];
    _count: {
        followers: number;
        following: number;
        projects: number;
    };
};

export interface IUserRepository {
    findByUsername(username: string): Promise<UserWithProfile | null>;
    updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}

@injectable()
export class UserRepository implements IUserRepository {
    async findByUsername(username: string): Promise<UserWithProfile | null> {
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
                    },
                },
                socialLinks: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        projects: true,
                    },
                },
            },
        });
    }

    async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return prisma.user.update({
            where: { id },
            data,
        });
    }
}
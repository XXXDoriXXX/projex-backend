import {prisma} from "../prisma";
import {Prisma, User} from "@prisma/client";
import {injectable} from "tsyringe";
import {UserProfile} from "../types/user/UserProfile";
export interface IAuthRepository {
    createUser(username:string,email: string, passwordHash: string, avatarurl:string|undefined): Promise<User>;
    getUserByEmail(email:string): Promise<User | null>;
    getUserById(id:string): Promise<User | null>;
    updateUser(id: string, data: Prisma.UserUpdateInput): Promise<UserProfile>;
    deleteUser(id: string): Promise<User>;
    addVerificationCode(email:string, code:string): Promise<User>;
    addResetCode(email:string, code:string): Promise<User>;
    getByEmailVerificationToken(token: string): Promise<User | null>;
}
@injectable()
export class AuthRepository implements IAuthRepository {
    async createUser(username:string,email: string, passwordHash: string): Promise<User> {
        return prisma.user.create({
            data: {
                username,
                email,
                password: passwordHash,
            },
        });
    }
    async addVerificationCode(email:string, code:string): Promise<User> {
        return prisma.user.update({
            where: { email },
            data: {
                emailVerificationToken: code,
                emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
    }
    async addResetCode(email:string, code:string): Promise<User> {
        return prisma.user.update({
            where: { email },
            data: {
                passwordResetToken: code,
                passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
    }
    async getUserByEmail(email:string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }
    async getUserById(id:string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
            include:{
                projects:true,

            }
        });
    }
    async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<UserProfile> {
        const user = await prisma.user.update({ where: { id }, data });
        return user as UserProfile;
    }

    async deleteUser(id: string): Promise<User> {
        return prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getByEmailVerificationToken(token: string): Promise<User | null> {
        return prisma.user.findFirst({ where: { emailVerificationToken: token } });
    }

}

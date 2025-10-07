import {prisma} from "../prisma";
import {User} from "@prisma/client";
import {injectable} from "tsyringe";
import {UpdateUserData} from "../types/user/UserProfile";
export interface IAuthRepository {
    createUser(username:string,email: string, passwordHash: string): Promise<User>;
    getUserByEmail(email:string): Promise<User | null>;
    getUserById(id:string): Promise<User | null>;
    updateUser(id: string, data: UpdateUserData): Promise<User>;
    deleteUser(id: string): Promise<User>;
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
    async updateUser(id: string, data: UpdateUserData): Promise<User> {
        return prisma.user.update({ where: { id }, data });
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

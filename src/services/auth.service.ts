import prisma from "../prisma";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library';
const JWT_SECRET = process.env.JWT_SECRET || 'MewMewMew';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },select:{id: true, username: true}
    })
}
// export const getUserByUsername = async (username: string) => {
//     return prisma.user.findUnique({
//         where: { username },select:{id: true, username: true}
//     })
// }
// export const getFullUserByUsername = async (username: string) => {
//     return prisma.user.findUnique({ where: { username } });
// };
export const createUser = async (username: string, password: string, email:string) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        },
    });
}
export const getUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },select:{id: true, username: true}
    })
}
export const getFullUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email }
    });
}
export const verifyGoogleToken = async (token: string) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Invalid Google token');

    return {
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
    };
};
export const generateToken = (user: { id: string; username: string }) => {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};
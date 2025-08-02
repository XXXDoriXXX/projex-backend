import prisma from "../prisma";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { Resend } from 'resend';
import { OAuth2Client } from 'google-auth-library';
const JWT_SECRET = process.env.JWT_SECRET || 'MewMewMew';
const resend = new Resend(process.env.RESEND_API_KEY || '');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },select:{id: true, username: true, email: true},
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
export const generateVerificationCode = async (email:string) => {

    const user= await getUserByEmail(email);
    if (!user) throw new Error('User not found');
    try{
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Generated verification code for ${email}: ${code}`);
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                emailVerificationToken: code,
                emailVerificationExpires: new Date(Date.now() + 3600000),
            },
        });

        console.log("Updated user:", updatedUser);

        return code;

    }
    catch (error) {
        console.log(error);
        throw new Error('Error generating verification code');
    }

}
export const verifyVerificationCode = async (token: string) => {
    const user = await prisma.user.findUnique({
        where: { emailVerificationToken: token },
    });

    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        throw new Error("Invalid or expired verification code");
    }

    return await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
        },
    });
};

export const sendEmail = async (email: string) => {
    const user = await getUserByEmail(email);
    if (!user) throw new Error('User not found');
    const code = await generateVerificationCode(email);
    await resend.emails.send({
        from: 'no-reply@projex.foo',
        to: email,
        subject: 'Confirm your email for Projex',
        html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e5e5e5;">
      <h2 style="color: #333;">Hey there 👋</h2>
      <p style="font-size: 16px; color: #555;">Thanks for signing up for <strong>Projex</strong>! To keep your account secure, we just need to confirm your email address.</p>
      <p style="font-size: 16px; color: #555;">Here’s your 6-digit verification code:</p>
      <p style="font-size: 24px; font-weight: bold; color: #111; text-align: center; letter-spacing: 4px; margin: 20px 0;">${code}</p>
      <p style="font-size: 14px; color: #777;">This code will expire in 10 minutes. If you didn’t request this, you can ignore this email.</p>
      <p style="font-size: 14px; color: #999;">– The Projex Team</p>
    </div>
  `
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
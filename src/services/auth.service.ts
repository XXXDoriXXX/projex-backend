import prisma from "../prisma";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { Resend } from 'resend';
import { OAuth2Client } from 'google-auth-library';
import axios from "axios";



const JWT_SECRET = process.env.JWT_SECRET || 'MewMewMew';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
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
        where: { email },select:{id: true, username: true, email:true}
    })
}
export const getFullUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email }
    });
}
const generateCodce = async () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export const generatePasswordResetCode = async (email: string) => {
    const user = await getUserByEmail(email);
    if (!user) throw new Error('User not found');
    try {
        const code = await generateCodce();
        console.log(`Generated password reset code for ${email}: ${code}`);
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                passwordResetToken: code,
                passwordResetExpires:new Date(Date.now() + 10 * 60 * 1000)
            },
        });

        console.log("Updated user:", updatedUser);

        return code;

    } catch (error) {
        console.log(error);
        throw new Error('Error generating password reset code');
    }
}
export const generateVerificationCode = async (email:string) => {

    const user= await getUserByEmail(email);
    if (!user) throw new Error('User not found');
    try{
        const code =await generateCodce();
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
export const getGithubAccessToken = async (code: string) => {
    const tokenRes = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
        },
        {
            headers: { Accept: 'application/json' },
        }
    );

    const access_token = tokenRes.data.access_token;
    if (!access_token) throw new Error('Access token not received');
    return access_token;
}
export const getGithubUserInfo = async (token: string) => {
    const userRes = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` },
    });
    return userRes.data;
}
export const getGithubEmail = async (token: string) => {
    const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${token}` },
    });
    const emails = emailRes.data;
    const primaryEmail = emails.find((email: any) => email.primary && email.verified);
    if (!primaryEmail) throw new Error('Primary email not found');
    return primaryEmail.email;
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
export async function sendResetPasswordEmail(email: string) {
    const user = await getUserByEmail(email);
    if (!user) throw new Error('User not found');

    const code = await generatePasswordResetCode(email);

    await resend.emails.send({
        from: 'no-reply@projex.foo',
        to: email,
        subject: 'Reset your password – Projex',
        html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
            <h2 style="color: #2d2d2d;">🔐 Reset your password</h2>
            <p style="font-size: 16px; color: #4a4a4a;">Hi <strong>${user.username}</strong>,</p>
            <p style="font-size: 16px; color: #4a4a4a;">We received a request to reset the password for your Projex account.</p>
            <p style="margin: 24px 0; text-align: center;">
                <span style="display: inline-block; font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #111;">${code}</span>
            </p>
            <p style="font-size: 14px; color: #666;">This code will expire in <strong>10 minutes</strong>. If you didn’t request a password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="font-size: 14px; color: #999;">– The Projex Team</p>
        </div>
        `
    });
}
export const verifyResetPasswordToken = async (token: string) => {
    const user = await prisma.user.findUnique({
        where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new Error("Invalid or expired reset password token");
    }

    return user;
}
export const updateUserPassword = async (userId: string, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });
}
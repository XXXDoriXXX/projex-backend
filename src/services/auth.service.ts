import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { type IAuthRepository } from '../repositories/auth.repository';
import { type IEmailProvider } from '../modules/email.provider';
import { type ITokenProvider } from '../modules/token.provider';
import { User } from '@prisma/client';
import { ForbiddenError, NotFoundError } from 'routing-controllers';
import { generateToken } from '../utils/generateToken';
import { ValidationError } from '../errors/CustomErrors';
import { type IGoogleOAuthProvider } from '../modules/oauth.provider';
import { type IOAuthService } from './oauth.service';

const MINUTES = (m: number) => m * 60 * 1000;
export interface IAuthService {
    getUserById(id: string): Promise<User>;
}
@injectable()
export class AuthService implements IAuthService {
    constructor(
        @inject('IAuthRepository') private readonly authRepo: IAuthRepository,
        @inject('IEmailProvider') private readonly email: IEmailProvider,
        @inject('ITokenProvider') private readonly tokens: ITokenProvider,
        @inject('IOAuthService') private readonly auth: IOAuthService,
    ) {}
    private validatePassword(password: string): void {
        const minLength = 8;
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

        if (password.length < minLength) {
            throw new ValidationError('Password must be at least 8 characters long');
        }
        if (!regex.test(password)) {
            throw new ValidationError('Password must include uppercase, lowercase, number, and special character');
        }
    }

    private generate6Code() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async getUserById(id: string): Promise<User> {
        const user = await this.authRepo.getUserById(id);
        if (!user) throw new NotFoundError('User not found');
        return user;
    }
    async login(email: string, password: string) {
        const user = await this.authRepo.getUserByEmail(email);
        if (!user) throw new ForbiddenError('User not found');
        if (!user.isActive) throw new ForbiddenError('User is deactivated');
        if (!user.password) throw new ForbiddenError('Passwords do not match');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new ForbiddenError('Invalid email or password');

        const token = generateToken(user.id, user.username);

        return { token, user: { id: user.id, username: user.username, email: user.email, avatarUrl:user.avatarUrl } };
    }
    async register(username: string, email: string, password: string) {
        const existingUser = await this.authRepo.getUserByEmail(email);
        if (existingUser) {
            throw new ForbiddenError('Email already in use');
        }
        const EmailZ = z.string().email();

        if (!EmailZ.safeParse(email).success) {
            throw new ValidationError('Invalid email');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await this.authRepo.createUser(username, email, passwordHash, '');

        const token = generateToken(newUser.id, newUser.username);

        return { token, user: { id: newUser.id, username: newUser.username, email: newUser.email } };
    }
    async verifyEmail(userId: string, code: string): Promise<boolean> {
        const user = await this.authRepo.getUserById(userId);
        if (!user) throw new NotFoundError('User not found');
        if (user.isVerified) throw new ValidationError('User already verified');
        if (user.emailVerificationToken !== code) throw new Error('Invalid verification code');
        if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
            throw new ValidationError('Verification code expired');
        }
        const updateData = {
            isVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
        };
        await this.authRepo.updateUser(user.id, updateData);
        await this.email.sendVerificationConfirmation(user.email, user.username);
        return true;
    }
    async sendVerificationEmail(userId: string): Promise<void> {
        const user = await this.authRepo.getUserById(userId);

        if (!user) throw new NotFoundError('User not found');
        if (user.isVerified) throw new ValidationError('User already verified');
        const code = this.generate6Code();
        await this.authRepo.addVerificationCode(user.email, code);
        await this.email.sendVerification(user.email, code, user.username);
    }
    async sendResetPasswordEmail(userId: string, password: string): Promise<void> {
        const user = await this.authRepo.getUserById(userId);
        if (!user) throw new NotFoundError('User not found');
        if (!user.isActive) throw new ForbiddenError('User is deactivated');
        if (!user.password) throw new ForbiddenError('Passwords do not match');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new ForbiddenError('Passwords do not match');
        const code = this.generate6Code();
        await this.authRepo.addResetCode(user.email, code);
        await this.email.sendPasswordReset(user.email, code, user.username);
    }
    async resetPassword(userId: string, code: string, newPassword: string): Promise<void> {
        const user = await this.authRepo.getUserById(userId);
        if (!user) throw new NotFoundError('User not found');
        if (!user.isActive) throw new ForbiddenError('User is deactivated');
        if (user.passwordResetToken !== code) throw new ValidationError('Invalid reset code');
        if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
            throw new ValidationError('Reset code expired');
        }
        this.validatePassword(newPassword);
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const updateData = {
            password: passwordHash,
            passwordResetToken: null,
            passwordResetExpires: null,
        };
        await this.authRepo.updateUser(user.id, updateData);
        await this.email.sendPasswordChangeConfirmation(user.email, user.username);
    }
    async googleAuth(googleToken: string): Promise<{
        token: undefined | string;
        user: { id: any; username: any; email: any };
    }> {
        const userInfo = await this.auth.verify('google', googleToken);
        if (!userInfo || !userInfo.email) {
            throw new ValidationError('Invalid Google token');
        }
        let user = await this.authRepo.getUserByEmail(userInfo.email);
        const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        if (!user) {
            user = await this.authRepo.createUser(userInfo.name || userInfo.email.split('@')[0], userInfo.email, passwordHash, userInfo.avatar);
        }
        const token = generateToken(user.id, user.username);
        return { token, user: { id: user.id, username: user.username, email: user.email } };
    }
    async githubAuth(githubToken: string): Promise<{
        token: undefined | string;
        user: { id: any; username: any; email: any };
    }> {
        const userInfo = await this.auth.verify('github', githubToken);
        if (!userInfo || !userInfo.email) {
            throw new ValidationError('Invalid GitHub token');
        }
        let user = await this.authRepo.getUserByEmail(userInfo.email);
        const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        if (!user) {
            user = await this.authRepo.createUser(userInfo.name || userInfo.email.split('@')[0], userInfo.email, passwordHash, userInfo.avatar);
        }
        const token = generateToken(user.id, user.username);
        return { token, user: { id: user.id, username: user.username, email: user.email } };
    }
}

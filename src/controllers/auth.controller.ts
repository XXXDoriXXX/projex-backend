import {container, inject, injectable} from "tsyringe";
import {AuthService} from "../services/auth.service";
import {asyncHandler} from "../utils/asyncHandler";
import {Request, Response} from "express";
import {AuthenticatedRequest} from "../middleware/auth";
import {ValidationError} from "../errors/CustomErrors";
import {ForbiddenError} from "routing-controllers";
import {UserProfile} from "../types/user/UserProfile";

@injectable()
export class authController {
    constructor(@inject("IAuthService") private readonly authService: AuthService) {}
    public getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (typeof userId === "string") {
            const user = await this.authService.getUserById(userId);
            const userProfile: UserProfile = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio ?? undefined,
                    avatarUrl: user.avatarUrl ?? undefined,
                    isVerified: user.isVerified,
                };
            res.status(200).json({ success: true, data: userProfile, message: 'User fetched' });
        }
    });
    public login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
          throw new ValidationError("Email and password are required", "email/password");
        }
            const result = await this.authService.login(email, password);

            res.status(200).json({ success: true, ...result, message: 'Login successful' });
    })
    public register = asyncHandler(async (req: Request, res: Response) => {
        const { username, email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string" || typeof username !== "string") {
            throw new ValidationError("Username, email and password are required", "username/email/password");
        }
            const result = await this.authService.register(username, email, password);
            res.status(201).json({ success: true, ...result, message: 'Registration successful' });
    })
    public verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { code } = req.body;
        if (typeof userId !== "string" || typeof code !== "string") {
            throw new ValidationError("Email and code are required", "email/code");
        }
            const isVerified = await this.authService.verifyEmail(userId, code);
            if (isVerified) {
                res.status(200).json({ success: true, message: 'Email verified successfully' });
            } else {
                throw new ForbiddenError('Invalid verification code');
            }
    })
    public sendVerificationCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (typeof userId !== "string") {
            throw new ValidationError("User ID is required", "userId");
        }

            await this.authService.sendVerificationEmail(userId);
            res.status(200).json({ success: true, message: 'Verification code sent successfully' });
    });
    public sendPasswordResetCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (typeof userId !== "string") {
            throw new ValidationError("User ID is required", "userId");
        }
        const { password } = req.body;
            await this.authService.sendResetPasswordEmail(userId,password);
            res.status(200).json({ success: true, message: 'Password reset code sent successfully' });
    });
    public resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { code, newPassword } = req.body;
        if (typeof userId !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
            throw new ValidationError("User ID, code and new password are required", "userId/code/newPassword");
        }
            await this.authService.resetPassword(userId, code, newPassword);
            res.status(200).json({ success: true, message: 'Password reset successfully' });
    });
    public googleAuth = asyncHandler(async (req: Request, res: Response) => {
        const { idToken } = req.body;
        if (typeof idToken !== "string") {
            throw new ValidationError("Token is required", "token");
        }
            const result = await this.authService.googleAuth(idToken);
            res.status(200).json({ success: true, ...result, message: 'Login successful' });
    });
    public githubAuth = asyncHandler(async (req: Request, res: Response) => {
        const code = req.query.code as string;
        if (typeof code !== "string") {
            throw new ValidationError("Code is required", "code");
        }
            const result = await this.authService.githubAuth(code);
            res.status(200).json({ success: true, ...result, message: 'Login successful' });
    });
}



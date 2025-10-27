import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { asyncHandler } from '../utils/asyncHandler';
import {type IUserService } from '../services/user.service';
import { ValidationError } from '../errors/CustomErrors';
import {type IAuthService} from "../services/auth.service";
import {AuthenticatedRequest} from "../middleware/auth";

@injectable()
export class UserController {
    constructor(@inject('IUserService') private readonly userService: IUserService,
                @inject('IAuthService') private readonly authService: IAuthService) {}

    public getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { username } = req.params;
        const userId = req.user?.userId;

        if (!username || typeof username !== 'string') {
            throw new ValidationError('Username is required', 'username');
        }

        const userProfile = await this.userService.getUserProfileByUsername(username,userId);

        res.status(200).json({ success: true, data: userProfile, message: 'User profile fetched successfully' });
    });
    public getUserByEmail = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.params;

        if (!email || typeof email !== 'string') {
            throw new ValidationError('Email is required', 'email');
        }

        const user = await this.authService.getUserByEmail(email);

        res.status(200).json({ success: true, data: user, message: 'User fetched successfully' });
    });
}
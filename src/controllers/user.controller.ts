import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { asyncHandler } from '../utils/asyncHandler';
import {type IUserService } from '../services/user.service';
import { ValidationError } from '../errors/CustomErrors';

@injectable()
export class UserController {
    constructor(@inject('IUserService') private readonly userService: IUserService) {}

    public getUserProfile = asyncHandler(async (req: Request, res: Response) => {
        const { username } = req.params;

        if (!username || typeof username !== 'string') {
            throw new ValidationError('Username is required', 'username');
        }

        const userProfile = await this.userService.getUserProfileByUsername(username);

        res.status(200).json({ success: true, data: userProfile, message: 'User profile fetched successfully' });
    });
}
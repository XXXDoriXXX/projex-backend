import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { asyncHandler } from '../utils/asyncHandler';
import {type IUserService, SocialLinkPayload, UserUpdatePayload} from '../services/user.service';
import { ValidationError } from '../errors/CustomErrors';
import {type IAuthService} from "../services/auth.service";
import {AuthenticatedRequest} from "../middleware/auth";
import {ForbiddenError} from "routing-controllers";

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
    public updateUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { username, bio, avatarUrl } = req.body;

        if (!userId) {
            throw new ValidationError('Authentication required');
        }

        const updateData: UserUpdatePayload = { username, bio, avatarUrl };

        if (!username && !bio && !avatarUrl) {
            throw new ValidationError('No fields provided for update');
        }

        const updatedUser = await this.userService.updateUserProfile(userId, updateData);

        res.status(200).json({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                avatarUrl: updatedUser.avatarUrl,
                bio: updatedUser.bio
            },
            message: 'User profile updated successfully'
        });
    });
    public updateUserAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const file = req.file

        if (!userId) {
            throw new ValidationError('Authentication required');
        }
        if (!file) {
            throw new ValidationError('Avatar file is required', 'file');
        }

        const newAvatarUrl = await this.userService.updateUserAvatar(userId, {
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
        });

        res.status(200).json({
            success: true,
            data: { avatarUrl: newAvatarUrl },
            message: 'User avatar updated successfully'
        });
    });
    public addSocialLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { platform, url, handle } = req.body;

        if (!userId) {
            throw new ValidationError('Authentication required');
        }
        if (!platform || !url) {
            throw new ValidationError('Platform and URL are required');
        }

        const socialLinkPayload: SocialLinkPayload = { platform, url, handle };
        const newLink = await this.userService.addSocialMediaLink(userId, socialLinkPayload);

        res.status(201).json({ success: true, data: newLink, message: 'Social link added successfully' });
    });

    public deleteSocialLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { socialMediaId } = req.params;

        if (!userId) {
            throw new ValidationError('Authentication required');
        }
        if (!socialMediaId) {
            throw new ValidationError('Social media ID is required');
        }

        await this.userService.deleteSocialMediaLink(userId, socialMediaId);

        res.status(200).json({ success: true, message: 'Social link deleted successfully' });
    });
    public followUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const followerId = req.user?.userId;
        const { userId: followingId } = req.params;

        if (!followerId) throw new ForbiddenError('Authentication required');
        if (!followingId) throw new ValidationError('User ID to follow is required');

        await this.userService.followUser(followerId, followingId);

        res.status(200).json({ success: true, message: 'Successfully followed user' });
    });

    public unfollowUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const followerId = req.user?.userId;
        const { userId: followingId } = req.params;

        if (!followerId) throw new ForbiddenError('Authentication required');
        if (!followingId) throw new ValidationError('User ID to unfollow is required');

        await this.userService.unfollowUser(followerId, followingId);

        res.status(200).json({ success: true, message: 'Successfully unfollowed user' });
    });

    public getFollowers = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        if (!userId) throw new ValidationError('User ID is required');

        const followers = await this.userService.getFollowersList(userId);

        res.status(200).json({ success: true, data: followers, message: 'Followers list fetched successfully' });
    });

    public getFollowing = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        if (!userId) throw new ValidationError('User ID is required');

        const following = await this.userService.getFollowingList(userId);

        res.status(200).json({ success: true, data: following, message: 'Following list fetched successfully' });
    });
    public isUserFollowed = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const followerId = req.user?.userId;
        const { userId: followingId } = req.params;

        if (!followerId) throw new ForbiddenError('Authentication required');
        if (!followingId) throw new ValidationError('User ID to check is required');

        const isFollowed = await this.userService.isUserFollowing(followerId, followingId);

        res.status(200).json({ success: true, data: { isFollowed }, message: 'Follow status fetched successfully' });
    });
}
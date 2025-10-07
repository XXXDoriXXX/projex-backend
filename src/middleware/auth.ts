import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {prisma} from "../prisma";
import {asyncHandler} from "../utils/asyncHandler";
import {ForbiddenError} from "../errors/CustomErrors";
import {NotFoundError} from "routing-controllers";

export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, email: true },
    });
};
const JWT_SECRET = process.env.JWT_SECRET || 'MeowMeowMeow';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
    };
}

interface TokenPayload extends jwt.JwtPayload {
    userId: string;
    username: string;
}

function extractBearerToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
}

export const optionalAuthenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        if (!decoded?.userId || !decoded?.username) return next();

        const user = await getUserById(decoded.userId);
        if (!user) return next();

        req.user = { userId: decoded.userId, username: decoded.username };
        return next();
    } catch {
        return next();
    }
};

export const authenticate = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        throw new ForbiddenError('Authentication required');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        if (!decoded?.userId || !decoded?.username) {
            throw new ForbiddenError('Invalid token payload');
        }

        const user = await getUserById(decoded.userId);
        if (!user) {
            throw new NotFoundError('User does not exist');
        }

        req.user = { userId: decoded.userId, username: decoded.username };
        return next();
    } catch {
        throw new ForbiddenError('Authentication failed');
    }
});

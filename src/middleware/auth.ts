import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/auth.service";

const JWT_SECRET = process.env.JWT_SECRET || "MeowMeowMeow";

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
	const [scheme, token] = authHeader.split(" ");
	if (scheme !== "Bearer" || !token) return null;
	return token;
}

export const optionalAuthenticate = async (
	req: AuthenticatedRequest,
	_res: Response,
	next: NextFunction,
) => {
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

export const authenticate = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	const token = extractBearerToken(req.headers.authorization);
	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

		if (!decoded?.userId || !decoded?.username) {
			return res.status(403).json({ message: "Invalid token payload" });
		}

		const user = await getUserById(decoded.userId);
		if (!user) {
			return res.status(403).json({ message: "User does not exist" });
		}

		req.user = { userId: decoded.userId, username: decoded.username };
		return next();
	} catch {
		return res.status(403).json({ message: "Forbidden" });
	}
};

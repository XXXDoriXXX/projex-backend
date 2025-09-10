import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middleware/auth.js";

/*TODO refactor like project controller*/
export const getCurrentUser = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const userId = req.user?.userId;
	console.log("Current user ID:", userId);
	if (!userId) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const user = await authService.getUserById(userId);
		const avatarUrl = await authService.getUserAvatar(userId);
		if (!avatarUrl) {
			return res.status(200).json(user);
		}
		const userWithAvatar = {
			...user,
			avatarUrl: avatarUrl.avatarUrl,
		};
		return res.status(200).json(userWithAvatar);
	} catch (err) {
		console.error("Error getting user:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};
export const signUp = async (req: Request, res: Response) => {
	const { username, password, email } = req.body;
	if (!username || !password || !email) {
		return res
			.status(400)
			.send({ message: "Username and password are required" });
	}
	if (email && !/\S+@\S+\.\S+/.test(email)) {
		return res.status(400).send({ message: "Invalid email format" });
	}
	if (password.length < 6) {
		return res
			.status(400)
			.send({ message: "Password must be at least 6 characters long" });
	}
	const existingUser = await authService.getUserByEmail(email);
	if (existingUser) {
		return res.status(409).send({ message: "Email already exists" });
	}
	if (await authService.getUserByEmail(email)) {
		return res.status(409).send({ message: "Username already exists" });
	}
	try {
		const user = await authService.createUser(username, password, email);
		const token = authService.generateToken(user);
		await authService.sendEmail(email);

		return res
			.status(200)
			.send({ message: "User created successfully", token });
	} catch (err) {
		console.error("Error creating user:", err);
		return res.status(500).send({ message: "Internal Server Error" });
	}
};
export const sendVerificationCode = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const userId = req.user?.userId;
	console.log("Current user ID:", userId);
	if (!userId) {
		return res.status(401).json({ message: "Unauthorized" });
	}
	try {
		const user = await authService.getUserById(userId);
		console.log("Current user email:", user?.email);
		if (!user) {
			return res.status(404).send({ message: "User not found" });
		}
		await authService.sendEmail(user.email);
		return res
			.status(200)
			.send({ message: "Verification code sent successfully" });
	} catch (err) {
		console.error("Error sending verification code:", err);
		return res.status(500).send({ message: "Internal Server Error" });
	}
};
export const verifyEmail = async (req: AuthenticatedRequest, res: Response) => {
	const { token } = req.params;
	console.log("TOKEN:", token);
	if (!token) {
		return res.status(400).send({ message: "Token is required" });
	}
	try {
		await authService.verifyVerificationCode(token);
		return res.status(200).send({ message: "Email verified successfully" });
	} catch (err) {
		console.error("Error verifying email:", err);
		return res.status(500).send({ message: err });
	}
};
export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res
			.status(400)
			.send({ message: "Username and password are required" });
	}
	try {
		const user = await authService.getUserByEmail(email);
		if (!user) {
			return res.status(404).send({ message: "User not found" });
		}
		const dbUser = await authService.getFullUserByEmail(email);

		if (
			!dbUser ||
			!dbUser.password ||
			!(await bcrypt.compare(password, dbUser.password))
		) {
			return res.status(401).send({ message: "Invalid password" });
		}
		const token = authService.generateToken(dbUser);
		return res.status(200).send({ message: "Login successful", token });
	} catch (err) {
		console.error("Error during login:", err);
		return res.status(500).send({ message: "Internal Server Error" });
	}
};
export const githubLogin = async (req: Request, res: Response) => {
	const code = req.query.code as string;
	if (!code) {
		return res.status(400).json({ message: "Missing GitHub code" });
	}

	try {
		const accessToken = await authService.getGithubAccessToken(code);

		const githubUser = await authService.getGithubUserInfo(accessToken);
		const githubEmail = await authService.getGithubEmail(accessToken);

		const { login: username, avatar_url: avatar, id: githubId } = githubUser;

		if (!username || !avatar || !githubId || !githubEmail) {
			return res.status(400).json({ message: "Incomplete GitHub user data" });
		}

		let user = await prisma.user.findFirst({
			where: {
				OR: [{ githubId: githubId.toString() }, { email: githubEmail }],
			},
		});

		if (!user) {
			user = await prisma.user.create({
				data: {
					email: githubEmail,
					username,
					avatarUrl: avatar,
					isVerified: true,
					githubId: githubId.toString(),
				},
			});
		}
		if (user.githubId !== githubId.toString()) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: { githubId: githubId.toString() },
			});
		}

		const token = authService.generateToken({
			id: user.id,
			username: user.username,
		});

		return res.status(200).json({ message: "Login successful", token });
	} catch (err) {
		console.error("GitHub login error:", err);
		return res.status(401).json({ message: "GitHub login failed" });
	}
};

export const googleLogin = async (req: Request, res: Response) => {
	const { idToken } = req.body;
	if (!idToken) {
		return res.status(400).json({ message: "Missing Google token" });
	}

	try {
		const { email, name, avatar } =
			await authService.verifyGoogleToken(idToken);

		let user = await prisma.user.findUnique({ where: { email } });

		if (!user) {
			user = await prisma.user.create({
				data: {
					email,
					username: email.split("@")[0],
					avatarUrl: avatar,
					isVerified: true,
				},
			});
		}

		const token = authService.generateToken({
			id: user.id,
			username: user.username,
		});

		return res.status(200).json({ message: "Login successful", token });
	} catch (err) {
		console.error("Google login error:", err);
		return res.status(401).json({ message: "Invalid Google token" });
	}
};
export const confirmResetPassword = async (req: Request, res: Response) => {
	const { token, newPassword } = req.body;
	if (!token || !newPassword) {
		return res
			.status(400)
			.send({ message: "Token and new password are required" });
	}
	if (newPassword.length < 6) {
		return res
			.status(400)
			.send({ message: "Password must be at least 6 characters long" });
	}
	try {
		const user = await authService.verifyResetPasswordToken(token);
		if (!user) {
			return res.status(400).send({ message: "Invalid or expired token" });
		}
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await authService.updateUserPassword(user.id, hashedPassword);
		return res.status(200).send({ message: "Password reset successfully" });
	} catch (err) {
		console.error("Error resetting password:", err);
		return res.status(500).send({ message: "Internal Server Error" });
	}
};
export const sendResetPassword = async (req: Request, res: Response) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).send({ message: "Email is required" });
	}
	try {
		const user = await authService.getUserByEmail(email);
		if (!user) {
			return res.status(404).send({ message: "User not found" });
		}
		await authService.sendResetPasswordEmail(user.email);
		return res
			.status(200)
			.send({ message: "Reset password email sent successfully" });
	} catch (err) {
		console.error("Error sending reset password email:", err);
		return res.status(500).send({ message: "Internal Server Error" });
	}
};

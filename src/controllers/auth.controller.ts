import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {AuthenticatedRequest} from "../middleware/auth";
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    console.log('Current user ID:', userId);
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await authService.getUserById(userId);
        return res.status(200).json(user);
    } catch (err) {
        console.error('Error getting user:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const signUp = async (req: Request, res: Response) => {
    const {username, password, email} = req.body;
    if (!username || !password || !email) {
        return res.status(400).send({message: 'Username and password are required'});
    }
    if(email && !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).send({message: 'Invalid email format'});
    }
    if (password.length < 6) {
        return res.status(400).send({message: 'Password must be at least 6 characters long'});
    }
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
        return res.status(409).send({message: 'Email already exists'});
    }
    if(await authService.getUserByEmail(email)) {
        return res.status(409).send({message: 'Username already exists'});
    }
    try{
        await authService.createUser(username, password, email);
        return res.status(200).send({message: 'User created successfully'});}

    catch(err) {
        console.error('Error creating user:', err);
        return res.status(500).send({message: 'Internal Server Error'});
    }
}

export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).send({message: 'Username and password are required'});
    }
    try {
        const user= await authService.getUserByEmail(email);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const dbUser = await authService.getFullUserByEmail(email);

        if (!dbUser || !dbUser.password || !(await bcrypt.compare(password, dbUser.password))) {
            return res.status(401).send({ message: 'Invalid password' });
        }
        const token = authService.generateToken(dbUser);
        return res.status(200).send({message: 'Login successful', token});
    }
    catch (err) {
        console.error('Error during login:', err);
        return res.status(500).send({message: 'Internal Server Error'});
    }
}
export const googleLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ message: 'Missing Google token' });
    }

    try {
        const { email, name, avatar } = await authService.verifyGoogleToken(idToken);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    username: email.split('@')[0],
                    avatarUrl: avatar,
                    isVerified: true,
                },
            });
        }

        const token = authService.generateToken({ id: user.id, username: user.username });

        return res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Google login error:', err);
        return res.status(401).json({ message: 'Invalid Google token' });
    }
};

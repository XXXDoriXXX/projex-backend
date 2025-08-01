import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET =process.env.JWT_SECRET || 'MeowMeowMeow';
export interface AuthenticatedRequest extends Request {
    user?:any;
}
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if(err){
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.user = decoded;

        const start = Date.now();
        try{
        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusColor =
                res.statusCode >= 500 ? '\x1b[31m' : // red
                res.statusCode >= 400 ? '\x1b[33m' : // yellow
                '\x1b[32m'; // green

            const logMessage = [
                `\x1b[90m[${new Date().toISOString()}]\x1b[0m`, // gray
                `\x1b[36m${req.method}\x1b[0m`, // cyan
                `\x1b[35m${req.originalUrl}\x1b[0m`, // magenta
                `${statusColor}${res.statusCode}\x1b[0m`, // status color
                `\x1b[34m${duration}ms\x1b[0m`, // blue
                `\x1b[37m| User: ${req.user.username}\x1b[0m` // white
            ].join(' ');

            console.log(logMessage);
        });

        next();}
        catch(err) {
            console.error('Error in response handler:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
}
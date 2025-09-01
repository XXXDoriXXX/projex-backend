import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateProject = [
    body('title').notEmpty().withMessage('Title required'),
    body('description').notEmpty().withMessage('Description required'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({  message: 'Title and description are required'});
        }
        next();
    },
];
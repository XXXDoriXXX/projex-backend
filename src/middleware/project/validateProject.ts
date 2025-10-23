import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import {ValidationError} from "../../errors/CustomErrors";

export const validateProject = [
    body('title').notEmpty().withMessage('Title required'),
    body('description').notEmpty().withMessage('Description required'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
           throw new ValidationError(`title and description are required`);
        }
        next();
    },
];

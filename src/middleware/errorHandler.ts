import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors/BaseError';
import { logger } from './logger';

interface ErrorResponse {
    success: false;
    error: {
        type: string;
        message: string;
        statusCode: number;
        errorCode?: string;
        requestId?: string;
        timestamp: string;
        path: string;
        method: string;
    };
    stack?: string;
    context?: Record<string, any>;
}

export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = (req as any).requestId;

    let statusCode = 500;
    let payload: ErrorResponse;

    if (error instanceof BaseError) {
        statusCode = error.statusCode;

        payload = {
            success: false,
            error: {
                type: error.name,
                message: error.message,
                statusCode: error.statusCode,
                errorCode: (error as any).errorCode,
                requestId,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method,
            },
            ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
            ...(process.env.NODE_ENV === 'development' && (error as any).context ? { context: (error as any).context as Record<string, any> } : {}),
        };

        if (statusCode >= 500) {
            logger.error(error.message, {
                requestId,
                method: req.method,
                url: req.originalUrl,
                status: statusCode,
                stack: error.stack,
            });
        } else {
            logger.warn(error.message, {
                requestId,
                method: req.method,
                url: req.originalUrl,
                status: statusCode,
            });
        }
    } else {
        payload = {
            success: false,
            error: {
                type: error.name || 'InternalServerError',
                message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
                statusCode: 500,
                requestId,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method,
            },
            ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {}),
        };

        logger.error(error.message, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: 500,
            stack: error.stack,
        });
    }

    res.status(statusCode).json(payload);
};

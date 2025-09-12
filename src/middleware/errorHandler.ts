import { Request, Response, NextFunction } from "express";
import { BaseError } from "../errors/BaseError";
import { logger } from "./logger";

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

export const errorHandler = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const requestId =
		(req.headers["x-request-id"] as string) ||
		Math.random().toString(36).substring(7);

	let statusCode: number = 500;
	let errorResponse: ErrorResponse;

	if (error instanceof BaseError) {
		statusCode = error.statusCode;
		errorResponse = {
			success: false,
			error: {
				type: error.name,
				message: error.message,
				statusCode: error.statusCode,
				errorCode: error.errorCode,
				requestId,
				timestamp: new Date().toISOString(),
				path: req.path,
				method: req.method,
			},
		};
		if (process.env.NODE_ENV === "development") {
			if (error.context) {
				errorResponse.context = error.context;
			}
			errorResponse.stack = error.stack;
		}
		if (statusCode >= 500) {
			logger.error("Server Error", {
				error: error.message,
				stack: error.stack,
				requestId,
				path: req.path,
				method: req.method,
				context: error.context,
			});
		} else {
			logger.warn("Client Error", {
				error: error.message,
				requestId,
				path: req.path,
				method: req.method,
			});
		}
	} else {
		errorResponse = {
			success: false,
			error: {
				type: "InternalServerError",
				message:
					process.env.NODE_ENV === "production"
						? "Internal Server Error"
						: error.message,
				statusCode: 500,
				requestId,
				timestamp: new Date().toISOString(),
				path: req.path,
				method: req.method,
			},
		};
		if (process.env.NODE_ENV === "development") {
			errorResponse.stack = error.stack;
		}
		logger.error("Unexpected Error", {
			error: error.message,
			stack: error.stack,
			requestId,
			path: req.path,
			method: req.method,
		});
	}
	res.status(statusCode).json(errorResponse);
};

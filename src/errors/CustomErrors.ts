import { BaseError } from "./BaseError";

export class ValidationError extends BaseError {
	readonly statusCode = 400;
	readonly isOperational = true;

	constructor(
		message: string,
		public readonly field?: string,
		public readonly context?: Record<string, any>,
	) {
		super(message, "VALIDATION_ERROR", context);
	}

	toJson() {
		return {
			type: this.name,
			message: this.message,
			statusCode: this.statusCode,
			field: this.field,
			errorCode: this.errorCode,
			...(this.context && { context: this.context }),
		};
	}
}
export class NotFoundError extends BaseError {
	readonly statusCode = 404;
	readonly isOperational = true;

	constructor(resouce: string, id?: string) {
		super(
			`${resouce}${id ? ` with id ${id}` : ""} not found`,
			"RESOURCE_NOT_FOUND",
			{ resouce, id },
		);
	}
	toJson() {
		return {
			type: this.name,
			message: this.message,
			statusCode: this.statusCode,
			errorCode: this.errorCode,
			...(this.context && { context: this.context }),
		};
	}
}
export class UnauthorizedError extends BaseError {
	readonly statusCode = 401;
	readonly isOperational = true;

	constructor(message: string = "Unauthorized access") {
		super(message, "UNAUTHORIZED");
	}

	toJson() {
		return {
			type: this.name,
			message: this.message,
			statusCode: this.statusCode,
			errorCode: this.errorCode,
		};
	}
}
export class ForbiddenError extends BaseError {
	readonly statusCode = 403;
	readonly isOperational = true;

	constructor(message: string = "Forbidden") {
		super(message, "FORBIDDEN");
	}

	toJson() {
		return {
			type: this.name,
			message: this.message,
			statusCode: this.statusCode,
			errorCode: this.errorCode,
		};
	}
}
export class DatabaseError extends BaseError {
	readonly statusCode = 500;
	readonly isOperational = true;

	constructor(message: string, context?: Record<string, any>) {
		super(message, "DATABASE_ERROR", context);
	}

	toJson() {
		return {
			type: this.name,
			message: "Database error operation failed",
			statusCode: this.statusCode,
			errorCode: this.errorCode,
			...(this.context && { context: this.context }),
		};
	}
}

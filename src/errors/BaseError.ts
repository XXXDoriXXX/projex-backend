export abstract class BaseError extends Error {
	abstract readonly statusCode: number;
	abstract readonly isOperational: boolean;

	constructor(
		message: string,
		public readonly errorCode?: string,
		public readonly context?: Record<string, any>,
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
	abstract toJson(): object;
}

import winston from "winston";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

const baseFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
	winston.format.errors({ stack: true }),
);

const consoleFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.printf((info) => {
		const {
			timestamp,
			level,
			message,
			stack,
			requestId,
			method,
			url,
			status,
			durationMs,
			user,
		} = info as any;
		const lvl = level.toUpperCase().padEnd(7);
		const req = requestId ? `rid=${requestId}` : "";
		const http = method && url ? `${method} ${url}` : "";
		const stat = typeof status === "number" ? `status=${status}` : "";
		const dur =
			typeof durationMs === "number" ? `duration=${durationMs}ms` : "";
		const usr = user ? `user=${user}` : "";
		const meta = [req, http, stat, dur, usr].filter(Boolean).join(" ");
		const line = meta ? `${message}  (${meta})` : message;
		return `[${timestamp}] ${lvl} ${line}${stack ? `\n${stack}` : ""}`;
	}),
);

const jsonFormat = winston.format.combine(
	winston.format.printf((info) => {
		const { timestamp, level, message, stack, ...rest } = info as any;
		return JSON.stringify({
			ts: timestamp,
			lvl: level,
			msg: message,
			stack,
			...rest,
		});
	}),
);

export const logger = winston.createLogger({
	level,
	format: baseFormat,
	transports: [
		new winston.transports.Console({
			format: isProd ? jsonFormat : consoleFormat,
		}),
		new winston.transports.File({
			filename: "logs/error.log",
			level: "error",
			format: jsonFormat,
			silent: !isProd,
		}),
		new winston.transports.File({
			filename: "logs/combined.log",
			format: jsonFormat,
			silent: !isProd,
		}),
	],
});

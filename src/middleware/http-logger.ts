import morgan from "morgan";
import { logger } from "./logger.js";

morgan.token("user", (req: any) => req.user?.username || "-");
morgan.token("rid", (req: any) => req.requestId || "-");

export const httpLogger = morgan((tokens, req, res) => {
	const method = tokens.method(req, res);
	const url = tokens.url(req, res);
	const status = Number(tokens.status(req, res)) || 0;
	const durationMs = Number(tokens["response-time"](req, res)) || 0;
	const length = tokens.res(req, res, "content-length") || "-";
	const user = tokens["user"](req, res);
	const requestId = tokens["rid"](req, res);

	logger.info(`${method} ${url}`, {
		status,
		durationMs,
		length,
		user,
		requestId,
		method,
		url,
	});

	return undefined as any;
});

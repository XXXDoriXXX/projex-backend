import express from "express";
import helmet from "helmet";
import cors from "cors";
import statusRoute from "./routes/status.route";
import morgan from "morgan";
import winston from "winston";
import fs from "fs";
import authRoute from "./routes/auth.route";
import { logger } from "./middleware/logger";
import projectRoute from "./routes/project.route";
import {NotFoundError} from "./errors/CustomErrors";
import {errorHandler} from "./middleware/errorHandler";
const app = express();
const accessLogStream = fs.createWriteStream("access.log", { flags: "a" });
app.use(
	morgan("combined", {
		stream: {
			write: (message) => logger.info(message.trim()),
		},
	}),
)
app.use((req, res, next) => {
	req.headers['x-request-id'] = req.headers['x-request-id'] ||
		Math.random().toString(36).substring(7);
	next();
});;
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		logger.error(`${err.message}\n${err.stack}`);
		res.status(500).json({ error: "Internal Server Error" });
	},
);
app.use(cors({
	origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000','http://localhost:5173' ],
	credentials: true,
	allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: '10mb' }));
app.use(helmet());

app.use("/api/status", statusRoute);
app.use("/api/auth", authRoute);
app.use("/api/project", projectRoute);
app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.use(errorHandler);
export default app;

import express from "express";
import cors from "cors";
import statusRoute from "./routes/status.route";
import morgan from "morgan";
import winston from "winston";
import fs from "fs";
import authRoute from "./routes/auth.route";
import {logger} from "./middleware/logger";
import projectRoute from "./routes/project.route";
const app = express();
const accessLogStream = fs.createWriteStream("access.log", { flags: "a" });
app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`${err.message}\n${err.stack}`);
  res.status(500).json({ error: "Internal Server Error" });
});
app.use(cors({
  origin: '*',
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());


app.use("/api/status", statusRoute);
app.use("/api/auth", authRoute);
app.use("/api/project", projectRoute);
app.get("/", (req, res) => {
  res.send("Hello World!");
});


export default app;
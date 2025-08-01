import express from "express";
import cors from "cors";
import statusRoute from "./routes/status.route";
import morgan from "morgan";
import authRoute from "./routes/auth.route";
const app = express();
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

app.use("/api/status", statusRoute);
app.use("/api/auth", authRoute);
app.get("/", (req, res) => {
  res.send("Hello World!");
});


export default app;
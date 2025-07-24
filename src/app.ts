import express from "express";
import cors from "cors";
import statusRoute from "./routes/status.route";
import morgan from "morgan";
const app = express();
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

app.use("/api/status", statusRoute);
app.get("/", (req, res) => {
  res.send("Hello World!");
});


export default app;
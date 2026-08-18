import express from "express";
import userRouter from "./routes/user.route.ts";
import { errorHandler } from "./middlewares/errorHandler.middleware.ts";

const app = express();

app.use(express.json());
app.use("/api", userRouter);
app.use(errorHandler);

export default app;

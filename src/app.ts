import express from "express";
import userRouter from "./routes/user.route.ts";
import { validateCreateUser } from "./middlewares/validateUser.middleware.ts";
const app = express();
app.use(express.json());

app.use("/api", userRouter);
export default app;

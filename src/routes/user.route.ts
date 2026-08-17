import { Router } from "express";
import { createUser } from "../controllers/user.controller.ts";
import { validateCreateUser } from "../middlewares/validateUser.middleware.ts";

const router = Router();

router.post("/user", validateCreateUser, createUser);

export default router;

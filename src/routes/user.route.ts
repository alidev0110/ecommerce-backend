import { Router } from "express";
import { createUser, loginUser } from "../controllers/user.controller.ts";
import {
  validateCreateUser,
  validateLoginUser,
} from "../middlewares/validateUser.middleware.ts";
import {
  loginLimiter,
  registerLimiter,
} from "../middlewares/rateLimiter.middleware.ts";

const router = Router();

router.post("/auth/register", registerLimiter, validateCreateUser, createUser);
router.post("/auth/login", loginLimiter, validateLoginUser, loginUser);

export default router;

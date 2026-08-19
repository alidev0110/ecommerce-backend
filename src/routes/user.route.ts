import { Router } from "express";
import {
  createUser,
  loginUser,
  getMe,
  refreshAccessToken,
} from "../controllers/user.controller.ts";
import {
  validateCreateUser,
  validateLoginUser,
} from "../middlewares/validateUser.middleware.ts";
import {
  loginLimiter,
  registerLimiter,
} from "../middlewares/rateLimiter.middleware.ts";
import { auth } from "../middlewares/auth.middleware.ts";

const router = Router();

router.post("/auth/register", registerLimiter, validateCreateUser, createUser);
router.post("/auth/login", loginLimiter, validateLoginUser, loginUser);
router.get("/auth/me", auth, getMe);
router.post("/auth/refresh", refreshAccessToken);

export default router;

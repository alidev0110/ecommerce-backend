import { Router } from "express";
import { createUser, loginUser } from "../controllers/user.controller.ts";
import {
  validateCreateUser,
  validateLoginUser,
} from "../middlewares/validateUser.middleware.ts";

const router = Router();

router.post("/auth/register", validateCreateUser, createUser);
router.post("/auth/login", validateLoginUser, loginUser);

export default router;
import rateLimit from "express-rate-limit";
import { LOGIN_RATE_LIMIT, REGISTER_RATE_LIMIT } from "../config/constants.ts";

const loginLimiter = rateLimit({
  ...LOGIN_RATE_LIMIT,
  max: 5,
  message: { message: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  ...REGISTER_RATE_LIMIT,
  max: 3,
  message: { message: "Too many register attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export { loginLimiter, registerLimiter };

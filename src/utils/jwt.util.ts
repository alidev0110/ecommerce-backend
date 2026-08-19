import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from "../config/constants.ts";

const JWT_SECRET = process.env.JWT_SECRET as string;

const generateAccessToken = (userId: number, role: "ADMIN" | "USER") => {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY_DAYS,
  });
};

export { generateAccessToken, generateRefreshToken };

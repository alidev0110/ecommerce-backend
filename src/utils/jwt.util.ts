import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from "../config/constants.ts";

const JWT_SECRET = process.env.JWT_SECRET as string;

const generateAccessToken = (userId: number, role: "ADMIN" | "USER") => {
  return jwt.sign({ id: userId, role, type: "access" }, JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (userId: number) => {
  return jwt.sign({ id: userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export { generateAccessToken, generateRefreshToken };

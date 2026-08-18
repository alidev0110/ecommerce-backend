import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

const generateAccessToken = (userId: number, role: "ADMIN" | "USER") => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export { generateAccessToken, generateRefreshToken };

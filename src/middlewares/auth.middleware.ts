import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import jwt, { type JwtPayload } from "jsonwebtoken";

const auth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("No token provided", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    console.log("---------------" + decoded);
    req.user = decoded;
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }

  next();
};

export { auth };

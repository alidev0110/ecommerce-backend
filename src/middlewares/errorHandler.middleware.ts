import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.ts";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  res.status(500).json({ message: "Internal Server Error" });
};

export { errorHandler };

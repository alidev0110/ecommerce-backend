import type { Request, Response, NextFunction } from "express";
import {
  createUserSchema,
  loginUserSchema,
} from "../validators/user.validator.ts";
import { AppError } from "../errors/AppError.ts";

const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400);
  }

  next();
};

const validateLoginUser = (req: Request, res: Response, next: NextFunction) => {
  const result = loginUserSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400);
  }

  next();
};

export { validateCreateUser, validateLoginUser };

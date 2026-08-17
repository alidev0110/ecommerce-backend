import type { Request, Response, NextFunction } from "express";
import { createUserSchema } from "../validators/user.validator.ts";
import { AppError } from "../errors/AppError.ts";

const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = createUserSchema.safeParse(req.body);

  //   if (!result.success) {
  //      res.status(400).json({
  //       message: "Validation failed",
  //       errors: result.error.issues,
  //     });

  //     return ;

  throw new AppError("Validation failed", 400);

  next();
};

export { validateCreateUser };

import type { NextFunction, Request, Response } from "express";
import { createUser as createUserService } from "../services/user.service.ts";
import { loginUser as loginUserService } from "../services/user.service.ts";
import type {
  CreateUserInput,
  LoginUserInput,
} from "../validators/user.validator.ts";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone }: CreateUserInput = req.body;

    const newUser = await createUserService({ name, email, password, phone });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: LoginUserInput = req.body;
    const { accessToken, refreshToken } = await loginUserService({
      email,
      password,
    });

    res.status(200).json({
      message: "User login successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export { createUser, loginUser };

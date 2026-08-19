import type { NextFunction, Request, Response } from "express";
import { createUser as createUserService } from "../services/user.service.ts";
import { loginUser as loginUserService } from "../services/user.service.ts";
import { getMe as getMeService } from "../services/user.service.ts";
import { refreshAccessToken as refreshAccessTokenService } from "../services/user.service.ts";
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

const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req?.user?.userId;
    const user = await getMeService(id);
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    const { accessToken } = await refreshAccessTokenService(refreshToken);
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export { createUser, loginUser, getMe, refreshAccessToken };

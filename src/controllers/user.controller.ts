import type { Request, Response } from "express";
import { createUser as createUserService } from "../services/user.service.ts";
import type { CreateUserInput } from "../validators/user.validator.ts";

const createUser = async (req: Request, res: Response) => {
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
};

export { createUser };

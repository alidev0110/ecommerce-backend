import { prisma } from "../config/db.ts";
import bcrypt from "bcrypt";
import { type CreateUserInput } from "../validators/user.validator.ts";
import { AppError } from "../errors/AppError.ts";

const createUser = async ({
  name,
  email,
  password,
  phone,
}: CreateUserInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password_hash: hashedPassword,
      phone: phone ?? null,
    },
  });

  return newUser;
};

export { createUser };

import { prisma } from "../config/db.ts";
import bcrypt from "bcrypt";
import {
  type CreateUserInput,
  type LoginUserInput,
} from "../validators/user.validator.ts";
import { AppError } from "../errors/AppError.ts";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.ts";

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

const loginUser = async ({ email, password }: LoginUserInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, existingUser.password_hash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(existingUser.id, existingUser.role);
  const refreshToken = generateRefreshToken(existingUser.id);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  
  await prisma.refreshToken.create({
    data: {
      token_hash: hashedRefreshToken,
      user_id: existingUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
};

export { createUser, loginUser };

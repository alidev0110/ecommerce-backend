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
import jwt, { type JwtPayload } from "jsonwebtoken";
import { findMatchingRefreshToken } from "../utils/matchToken.util.ts";
import { BCRYPT_SALT_ROUNDS } from "../config/constants.ts";

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

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

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
  const hashedRefreshToken = await bcrypt.hash(
    refreshToken,
    BCRYPT_SALT_ROUNDS,
  );

  await prisma.refreshToken.create({
    data: {
      token_hash: hashedRefreshToken,
      user_id: existingUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
};

const getMe = async (id: number) => {
  if (!id) {
    throw new AppError("Not authenticated", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const refreshAccessToken = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_SECRET as string,
  ) as JwtPayload;
  const userId = decoded.userId;

  if (decoded.type !== "refresh") {
    throw new AppError("Invalid token type", 401);
  }

  let matchedToken = await findMatchingRefreshToken(userId, refreshToken);

  if (!matchedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (matchedToken.revoked) {
    throw new AppError("Refresh token has been revoked", 401);
  }

  if (matchedToken.expires_at < new Date()) {
    throw new AppError("Refresh token expired", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const newAccessToken = generateAccessToken(user.id, user.role);

  return { accessToken: newAccessToken };
};

const logoutUser = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_SECRET as string,
  ) as JwtPayload;
  const userId = decoded.user_id;

  const matchedToken = await findMatchingRefreshToken(userId, refreshToken);

  if (!matchedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  await prisma.refreshToken.update({
    where: { id: matchedToken.id },
    data: { revoked: true },
  });

  return { message: "Logged out successfully" };
};

export { createUser, loginUser, getMe, refreshAccessToken, logoutUser };

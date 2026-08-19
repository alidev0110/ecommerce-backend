import { prisma } from "../config/db.ts";
import bcrypt from "bcrypt";

const findMatchingRefreshToken = async (userId: number, rawToken: string) => {
  const refreshTokens = await prisma.refreshToken.findMany({
    where: { user_id: userId },
  });

  for (const token of refreshTokens) {
    const isMatch = await bcrypt.compare(rawToken, token.token_hash);
    if (isMatch) {
      return token;
    }
  }

  return null;
};

export { findMatchingRefreshToken };

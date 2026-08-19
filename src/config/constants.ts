export const BCRYPT_SALT_ROUNDS = 10;
export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };
export const REGISTER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

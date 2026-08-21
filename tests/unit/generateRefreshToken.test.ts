import jwt, { type JwtPayload } from "jsonwebtoken";
import { generateRefreshToken } from "../../src/utils/jwt.util.ts";
const jwt_secret_test = "test-secret-key";

describe("generateRefreshToken", () => {
  let decoded: JwtPayload;

  beforeEach(() => {
    const token = generateRefreshToken(1);
    decoded = jwt.verify(token, jwt_secret_test as string) as JwtPayload;
  });

  test("should include the correct user id", () => {
    expect(decoded.id).toBe(1);
  });

  test("should include type as refresh", () => {
    expect(decoded.type).toBe("refresh");
  });

  test("should not include a role", () => {
    expect(decoded.role).toBeUndefined();
  });
});

import jwt, { type JwtPayload } from "jsonwebtoken";
import { generateAccessToken } from "../../src/utils/jwt.util.ts";
const jwt_secret_test = "test-secret-key";

describe("generateAccessToken", () => {
  let decoded: JwtPayload;

  beforeEach(() => {
    const token = generateAccessToken(1, "ADMIN");
    decoded = jwt.verify(token, jwt_secret_test as string) as JwtPayload;
  });

  test("should include the correct user id", () => {
    expect(decoded.id).toBe(1);
  });

  test("should include type as access", () => {
    expect(decoded.type).toBe("access");
  });

  test("should include the correct role", () => {
    expect(decoded.role).toBe("ADMIN");
  });
});

import { loginUserSchema } from "../../src/validators/user.validator.ts";

describe("login validation", () => {
  const validData = {
    email: "ali@email.com",
    password: "224312@n3b",
  };
  describe(" valid inputs", () => {
    test("should pass validation with correct data", () => {
      const result = loginUserSchema.safeParse(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test("should normalize email to lowercase and trim spaces", () => {
      const result = loginUserSchema.safeParse({
        ...validData,
        email: "  ALI@Example.COM  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.email).toBe("ali@example.com");
      }
    });
  });
  describe("invalid inputs", () => {
    test("should fail if email is empty", () => {
      const result = loginUserSchema.safeParse({ ...validData, email: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });

    test("should fail if email is wrong", () => {
      const result = loginUserSchema.safeParse({
        ...validData,
        email: "aliahmed@emailcom",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });

    test("should fail if password less than 8 charachter", () => {
      const result = loginUserSchema.safeParse({
        ...validData,
        password: "22n3b",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["password"]);
      }
    });

    test("should fail if password input empty", () => {
      const result = loginUserSchema.safeParse({ ...validData, password: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["password"]);
      }
    });

    test("should fail if add a third field + email and password", () => {
      const result = loginUserSchema.safeParse({ ...validData, role: "USER" });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].code).toBe("unrecognized_keys");
      }
    });
  });
});

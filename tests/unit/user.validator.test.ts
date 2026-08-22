import { loginUserSchema } from "../../src/validators/user.validator.ts";
import { createUserSchema } from "../../src/validators/user.validator.ts";

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
        expect(result.error.issues[0]?.path).toEqual(["email"]);
      }
    });

    test("should fail if email is wrong", () => {
      const result = loginUserSchema.safeParse({
        ...validData,
        email: "aliahmed@emailcom",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["email"]);
      }
    });

    test("should fail if password less than 8 charachter", () => {
      const result = loginUserSchema.safeParse({
        ...validData,
        password: "22n3b",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if password input empty", () => {
      const result = loginUserSchema.safeParse({ ...validData, password: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if add a third field + email and password", () => {
      const result = loginUserSchema.safeParse({ ...validData, role: "USER" });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("unrecognized_keys");
      }
    });
  });
});

describe("register validation", () => {
  const validData = {
    name: "Ali Ahmed",
    email: "ali@email.com",
    password: "SecurePass123@",
    phone: "01012345678",
  };

  describe("valid inputs", () => {
    test("should pass validation with correct data", () => {
      const result = createUserSchema.safeParse(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test("should pass validation without phone since it is optional", () => {
      const { phone, ...dataWithoutPhone } = validData;
      const result = createUserSchema.safeParse(dataWithoutPhone);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeUndefined();
      }
    });

    test("should normalize email to lowercase and trim spaces", () => {
      const result = createUserSchema.safeParse({
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
    test("should fail if name is empty", () => {
      const result = createUserSchema.safeParse({ ...validData, name: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    test("should fail if name is shorter than 2 characters", () => {
      const result = createUserSchema.safeParse({ ...validData, name: "A" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    test("should fail if name is longer than 20 characters", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        name: "A".repeat(21),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["name"]);
      }
    });

    test("should fail if email is empty", () => {
      const result = createUserSchema.safeParse({ ...validData, email: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["email"]);
      }
    });

    test("should fail if email format is wrong", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        email: "aliahmed@emailcom",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["email"]);
      }
    });

    test("should fail if password is empty", () => {
      const result = createUserSchema.safeParse({ ...validData, password: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if password is shorter than 8 characters", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        password: "Ab1@",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if password has no uppercase letter", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        password: "securepass123@",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if password has no number", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        password: "SecurePass@@",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if password has no special character", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        password: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["password"]);
      }
    });

    test("should fail if phone is shorter than 8 characters", () => {
      const result = createUserSchema.safeParse({ ...validData, phone: "123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["phone"]);
      }
    });

    test("should reject unknown fields", () => {
      const result = createUserSchema.safeParse({
        ...validData,
        role: "ADMIN",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("unrecognized_keys");
      }
    });
  });
});

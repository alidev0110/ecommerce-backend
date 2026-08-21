import { z } from "zod";

const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be more than 2 letters")
    .max(20, "Name must be less than 20 letters"),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    ),
  phone: z.string().min(8, "Phone number seems too short").optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

const loginUserSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginUserInput = z.infer<typeof loginUserSchema>;

export {
  createUserSchema,
  loginUserSchema,
  type CreateUserInput,
  type LoginUserInput,
};

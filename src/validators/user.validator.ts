import { z } from "zod";

const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be more than 2 letters")
    .max(20, "Name must be less than 20 letters"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(8, "Phone number seems too short").optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export { createUserSchema, type CreateUserInput };

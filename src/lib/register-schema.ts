import { z } from "zod"
import { PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE } from "@/lib/password-policy.ts"
import { usernameStrictSchema } from "@/lib/username-policy.ts"
import { createZodResolver } from "@/lib/create-zod-resolver.ts"

export const registerSchema = z.object({
  username: usernameStrictSchema,
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(6, PASSWORD_REQUIREMENT_MESSAGE)
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

export const registerResolver = createZodResolver(registerSchema)

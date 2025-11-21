import { z } from "zod"
import { PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE } from "@/lib/password-policy.ts"
import { createZodResolver } from "@/lib/create-zod-resolver.ts"

export const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z.string().trim().optional(),
})

export const addressSchema = z.object({
  street: z.string().trim().min(1, "Street is required."),
  number: z
    .string()
    .trim()
    .min(1, "Street number is required.")
    .regex(/^\d+$/, "Street number must be numeric.")
    .refine((value) => Number(value) > 0, "Street number must be greater than 0."),
  city: z.string().trim().min(1, "City is required."),
  zipcode: z
    .string()
    .trim()
    .min(1, "ZIP code is required.")
    .regex(/^[0-9]{3,10}$/, "ZIP code must be 3 to 10 digits."),
  latitude: z
    .string()
    .trim()
    .min(1, "Latitude is required.")
    .refine(
      (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && parsed >= -90 && parsed <= 90
      },
      { message: "Latitude must be a valid coordinate between -90 and 90." },
    ),
  longitude: z
    .string()
    .trim()
    .min(1, "Longitude is required.")
    .refine(
      (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && parsed >= -180 && parsed <= 180
      },
      { message: "Longitude must be a valid coordinate between -180 and 180." },
    ),
})

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, PASSWORD_REQUIREMENT_MESSAGE)
      .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  })

export type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>
export type AddressFormValues = z.infer<typeof addressSchema>
export type PasswordFormValues = z.infer<typeof passwordSchema>

export const profileResolver = createZodResolver(profileDetailsSchema)
export const addressResolver = createZodResolver(addressSchema)
export const passwordResolver = createZodResolver(passwordSchema)

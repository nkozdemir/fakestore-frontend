import { z } from "zod"

export const USERNAME_REQUIRED_MESSAGE = "Username is required"
export const USERNAME_ALLOWED_PATTERN = /^[A-Za-z0-9]+$/
export const USERNAME_ALLOWED_MESSAGE = "Username can only contain letters and numbers"
export const USERNAME_MIN_LENGTH = 4
export const USERNAME_MIN_LENGTH_MESSAGE = `Username must be at least ${USERNAME_MIN_LENGTH} characters`

const baseUsernameSchema = z.string().trim()

export const usernameRequiredSchema = baseUsernameSchema.min(1, USERNAME_REQUIRED_MESSAGE)

export const usernameStrictSchema = usernameRequiredSchema
  .regex(USERNAME_ALLOWED_PATTERN, USERNAME_ALLOWED_MESSAGE)
  .min(USERNAME_MIN_LENGTH, USERNAME_MIN_LENGTH_MESSAGE)

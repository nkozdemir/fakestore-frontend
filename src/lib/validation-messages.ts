import { PASSWORD_REQUIREMENT_MESSAGE } from "@/lib/password-policy.ts"
import {
  USERNAME_ALLOWED_MESSAGE,
  USERNAME_MIN_LENGTH,
  USERNAME_MIN_LENGTH_MESSAGE,
  USERNAME_REQUIRED_MESSAGE,
} from "@/lib/username-policy.ts"

type TranslationFn = (
  key: string,
  options?: {
    defaultValue?: string
    values?: Record<string, string | number>
  },
) => string

type ValidationEntry = {
  key: string
  values?: Record<string, string | number>
}

const validationMessageMap: Record<string, ValidationEntry> = {
  [USERNAME_REQUIRED_MESSAGE]: { key: "validation.usernameRequired" },
  [USERNAME_ALLOWED_MESSAGE]: { key: "validation.usernamePattern" },
  [USERNAME_MIN_LENGTH_MESSAGE]: {
    key: "validation.usernameMinLength",
    values: { min: USERNAME_MIN_LENGTH },
  },
  "Password is required": { key: "validation.passwordRequired" },
  [PASSWORD_REQUIREMENT_MESSAGE]: { key: "validation.passwordRequirement" },
  "Email is required": { key: "validation.emailRequired" },
  "Email is required.": { key: "validation.emailRequired" },
  "Enter a valid email address": { key: "validation.emailInvalid" },
  "Enter a valid email address.": { key: "validation.emailInvalid" },
  "First name is required": { key: "validation.firstNameRequired" },
  "First name is required.": { key: "validation.firstNameRequired" },
  "Last name is required": { key: "validation.lastNameRequired" },
  "Last name is required.": { key: "validation.lastNameRequired" },
  "Street is required.": { key: "validation.streetRequired" },
  "Street number is required.": { key: "validation.streetNumberRequired" },
  "Street number must be numeric.": { key: "validation.streetNumberNumeric" },
  "Street number must be greater than 0.": {
    key: "validation.streetNumberPositive",
  },
  "City is required.": { key: "validation.cityRequired" },
  "ZIP code is required.": { key: "validation.zipRequired" },
  "Latitude is required.": { key: "validation.latitudeRequired" },
  "Longitude is required.": { key: "validation.longitudeRequired" },
  "Please confirm your new password.": {
    key: "validation.confirmPasswordRequired",
  },
  "Passwords must match.": { key: "validation.passwordsMustMatch" },
}

export function translateValidationMessage(t: TranslationFn, message?: string): string | undefined {
  if (!message) {
    return undefined
  }

  const entry = validationMessageMap[message]

  if (!entry) {
    return t(message, { defaultValue: message })
  }

  return t(entry.key, {
    defaultValue: message,
    values: entry.values,
  })
}

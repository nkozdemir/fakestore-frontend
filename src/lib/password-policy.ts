export const PASSWORD_REQUIREMENT_MESSAGE =
  "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/

type PasswordCheckDefinition = {
  id: string
  label: string
  validate: (value: string) => boolean
}

const PASSWORD_CHECK_DEFINITIONS: PasswordCheckDefinition[] = [
  {
    id: "length",
    label: "At least 6 characters",
    validate: (value) => value.length >= 6,
  },
  {
    id: "uppercase",
    label: "Contains an uppercase letter (A-Z)",
    validate: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Contains a lowercase letter (a-z)",
    validate: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Contains a number (0-9)",
    validate: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "Contains a special character (!@#$%^&*)",
    validate: (value) => /[^A-Za-z0-9]/.test(value),
  },
]

export type PasswordCheckResult = {
  id: string
  label: string
  met: boolean
}

export function evaluatePasswordChecks(password: string): PasswordCheckResult[] {
  const normalized = password ?? ""

  return PASSWORD_CHECK_DEFINITIONS.map(({ id, label, validate }) => ({
    id,
    label,
    met: validate(normalized),
  }))
}

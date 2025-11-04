import type { Resolver, FieldErrors } from "react-hook-form"
import type { z } from "zod"

export function createZodResolver<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
): Resolver<z.infer<TSchema>> {
  return async (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      }
    }

    const fieldErrors = result.error.flatten()
    const errors: FieldErrors<z.infer<TSchema>> = {}

    Object.entries(fieldErrors.fieldErrors).forEach(([key, messages]) => {
      if (messages?.length) {
        errors[key as keyof z.infer<TSchema>] = {
          type: "manual",
          message: messages[0],
        }
      }
    })

    if (fieldErrors.formErrors.length) {
      errors.root = {
        type: "manual",
        message: fieldErrors.formErrors[0],
      }
    }

    return {
      values: {},
      errors,
    }
  }
}

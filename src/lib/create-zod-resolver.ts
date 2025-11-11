import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form"
import type { z } from "zod"

export function createZodResolver<TFieldValues extends FieldValues>(
  schema: z.Schema<TFieldValues>,
): Resolver<TFieldValues> {
  return async (values, context, options) => {
    void context
    void options

    const result = await schema.safeParseAsync(values)
    if (result.success) {
      return {
        values: result.data,
        errors: {},
      }
    }

    const { fieldErrors: flattenedFieldErrors, formErrors } = result.error.flatten()
    const errors: FieldErrors<TFieldValues> = {}

    Object.entries(flattenedFieldErrors).forEach(([rawKey, messages]) => {
      if (messages && messages.length > 0) {
        ;(errors as Record<string, FieldError>)[rawKey] = {
          type: "manual",
          message: messages[0],
        }
      }
    })

    if (formErrors.length > 0) {
      errors.root = {
        type: "manual",
        message: formErrors[0],
      } as FieldErrors<TFieldValues>["root"]
    }

    return {
      values: {} as Record<string, never>,
      errors,
    }
  }
}

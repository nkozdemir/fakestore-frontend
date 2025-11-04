import type { InputHTMLAttributes } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Label } from "@/components/ui/label.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import { cn } from "@/lib/utils.ts"

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error"

const DEFAULT_STATUS_MESSAGES: Record<UsernameStatus, string> = {
  idle: "",
  checking: "Checking availability...",
  available: "Username available",
  unavailable: "Username is already taken",
  error: "We couldn't verify that username right now.",
}

const STATUS_COLORS: Record<UsernameStatus, string> = {
  idle: "text-muted-foreground",
  checking: "text-muted-foreground",
  available: "text-emerald-600",
  unavailable: "text-destructive",
  error: "text-destructive",
}

type UsernameFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "children" | "type"
> & {
  label?: string
  registration: UseFormRegisterReturn
  error?: string
  containerClassName?: string
  inputClassName?: string
  errorClassName?: string
  status?: UsernameStatus
  statusMessages?: Partial<Record<UsernameStatus, string>>
  statusMessageClassName?: string
  spinnerClassName?: string
}

export default function UsernameField({
  label = "Username",
  registration,
  error,
  containerClassName,
  inputClassName,
  errorClassName,
  status = "idle",
  statusMessages,
  statusMessageClassName,
  spinnerClassName,
  id: providedId,
  autoComplete = "username",
  required = true,
  placeholder = "Enter your username",
  ...inputProps
}: UsernameFieldProps) {
  const { className: inputClassNameProp, ...restInputProps } = inputProps
  const fieldId = providedId ?? registration.name ?? "username"
  const showSpinner = status === "checking"
  const messageTemplate =
    statusMessages?.[status] ?? DEFAULT_STATUS_MESSAGES[status]
  const shouldShowStatus =
    Boolean(status !== "idle" && messageTemplate) &&
    (status === "checking" || !error)
  const statusColor = STATUS_COLORS[status] ?? "text-muted-foreground"

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          type="text"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? "true" : "false"}
          className={cn(
            showSpinner && "pr-10",
            inputClassNameProp,
            inputClassName,
          )}
          {...restInputProps}
          {...registration}
        />
        {showSpinner ? (
          <Spinner
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",
              spinnerClassName,
            )}
          />
        ) : null}
      </div>
      {shouldShowStatus ? (
        <p
          className={cn(
            "mt-1 text-xs",
            statusColor,
            statusMessageClassName,
          )}
        >
          {messageTemplate}
        </p>
      ) : null}
      {error ? (
        <p
          className={cn("text-sm text-destructive", errorClassName)}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

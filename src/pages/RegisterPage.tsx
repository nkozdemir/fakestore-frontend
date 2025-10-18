import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { type FieldErrors, type Resolver, useForm } from "react-hook-form"
import { z } from "zod"
import { Check, Circle, CircleAlert, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { fetchJson } from "@/lib/api.ts"
import type { UsernameAvailabilityResponse } from "@/types/auth.ts"
import { Spinner } from "@/components/ui/spinner.tsx"

const passwordRequirement =
  "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/

const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .regex(/^[A-Za-z0-9]+$/, "Username can only contain letters and numbers")
    .min(4, "Username must be at least 4 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(6, passwordRequirement)
    .regex(passwordRegex, passwordRequirement),
  firstName: z
    .string()
    .min(1, "First name is required"),
  lastName: z
    .string()
    .min(1, "Last name is required"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

const registerResolver: Resolver<RegisterFormValues> = async (values) => {
  const result = registerSchema.safeParse(values)

  if (result.success) {
    return {
      values: result.data,
      errors: {},
    }
  }

  const fieldErrors = result.error.flatten()
  const errors: FieldErrors<RegisterFormValues> = {}

  Object.entries(fieldErrors.fieldErrors).forEach(([key, messages]) => {
    if (messages && messages.length > 0) {
      errors[key as keyof RegisterFormValues] = {
        type: "manual",
        message: messages[0],
      }
    }
  })

  if (fieldErrors.formErrors.length > 0) {
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

type UsernameStatus = "idle" | "checking" | "available" | "unavailable" | "error"

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser } = useAuth()
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle")
  const usernameCheckController = useRef<AbortController | null>(null)
  const {
    register: formRegister,
    handleSubmit,
    watch,
    clearErrors,
    setError,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
    resolver: registerResolver,
  })

  useEffect(() => {
    return () => {
      usernameCheckController.current?.abort()
    }
  }, [])

  const passwordValue = watch("password") ?? ""

  const passwordChecks = useMemo(
    () => [
      {
        id: "length",
        label: "At least 6 characters",
        met: passwordValue.length >= 6,
      },
      {
        id: "uppercase",
        label: "Contains an uppercase letter (A-Z)",
        met: /[A-Z]/.test(passwordValue),
      },
      {
        id: "lowercase",
        label: "Contains a lowercase letter (a-z)",
        met: /[a-z]/.test(passwordValue),
      },
      {
        id: "number",
        label: "Contains a number (0-9)",
        met: /\d/.test(passwordValue),
      },
      {
        id: "special",
        label: "Contains a special character (!@#$%^&*)",
        met: /[^A-Za-z0-9]/.test(passwordValue),
      },
    ],
    [passwordValue],
  )

  const checkUsernameAvailability = useCallback(async () => {
    const trimmed = getValues("username").trim()

    usernameCheckController.current?.abort()

    if (!trimmed) {
      setUsernameStatus("idle")
      clearErrors("username")
      return
    }

    if (trimmed.length < 4 || !/^[A-Za-z0-9]+$/.test(trimmed)) {
      setUsernameStatus("idle")
      return
    }

    const controller = new AbortController()
    usernameCheckController.current = controller

    setUsernameStatus("checking")

    try {
      const result = await fetchJson<UsernameAvailabilityResponse>(
        "/auth/validate-username/",
        {
          params: { username: trimmed },
          init: {
            signal: controller.signal,
          },
        },
      )

      if (!result.available) {
        setUsernameStatus("unavailable")
        setError("username", {
          type: "validate",
          message: "That username is already taken.",
        })
      } else {
        setUsernameStatus("available")
        clearErrors("username")
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      console.warn("Username availability check failed", error)
      setUsernameStatus("error")
    } finally {
      if (usernameCheckController.current === controller) {
        usernameCheckController.current = null
      }
    }
  }, [clearErrors, getValues, setError])

  const usernameField = formRegister("username", {
    onBlur: () => {
      void trigger("username")
      void checkUsernameAvailability()
    },
    onChange: () => {
      if (usernameCheckController.current) {
        usernameCheckController.current.abort()
        usernameCheckController.current = null
      }

      setUsernameStatus((status) =>
        status === "idle" ? status : "idle",
      )
      clearErrors("username")
    },
  })

  const from =
    (location.state as { from?: string } | null)?.from ?? "/"

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser(values)
      navigate(from, { replace: true })
    } catch (error) {
      const defaultMessage =
        "We couldn't create your account right now. Please try again."
      const message =
        error instanceof Error && error.message
          ? error.message
          : defaultMessage

      setError("root", {
        type: "server",
        message,
      })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
          <CardDescription>
            Join FakeStore to start exploring products and manage your carts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    {...usernameField}
                    placeholder="Choose a unique username"
                    autoComplete="username"
                    aria-invalid={errors.username ? "true" : "false"}
                    required
                    className={usernameStatus === "checking" ? "pr-10" : undefined}
                  />
                  {usernameStatus === "checking" && (
                    <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-1 text-xs">
                  {usernameStatus === "checking" && (
                    <span className="text-muted-foreground">
                      Checking availability...
                    </span>
                  )}
                  {usernameStatus === "available" && !errors.username && (
                    <span className="text-emerald-600">Username available</span>
                  )}
                  {usernameStatus === "unavailable" && !errors.username && (
                    <span className="text-destructive">Username is already taken</span>
                  )}
                  {usernameStatus === "error" && (
                    <span className="text-destructive">Couldn't verify username</span>
                  )}
                </div>
                {errors.username?.message && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...formRegister("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email?.message && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...formRegister("password")}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Your password must meet all the requirements below.
                  </p>
                  <ul className="grid gap-1 text-xs">
                    {passwordChecks.map(({ id, label, met }) => (
                      <li key={id} className="flex items-center gap-2">
                        {met ? (
                          <Check className="size-3 text-emerald-600" aria-hidden />
                        ) : (
                          <Circle className="size-3 text-muted-foreground" aria-hidden />
                        )}
                        <span
                          className={met ? "text-emerald-600" : "text-muted-foreground"}
                        >
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {errors.password?.message && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  {...formRegister("firstName")}
                  placeholder="Your first name"
                  autoComplete="given-name"
                  required
                  aria-invalid={errors.firstName ? "true" : "false"}
                />
                {errors.firstName?.message && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  {...formRegister("lastName")}
                  placeholder="Your last name"
                  autoComplete="family-name"
                  required
                  aria-invalid={errors.lastName ? "true" : "false"}
                />
                {errors.lastName?.message && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            {errors.root?.message && (
              <Alert variant="destructive">
                <CircleAlert className="size-5" aria-hidden />
                <AlertTitle>Sign-up failed</AlertTitle>
                <AlertDescription>
                  <p>{errors.root.message}</p>
                  <p>
                    If the problem continues, wait a moment and try again or contact support.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/login">
              Sign in
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CircleAlert, Loader2 } from "lucide-react"
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
import UsernameField, { type UsernameStatus } from "@/components/auth/UsernameField.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { fetchJson } from "@/lib/api.ts"
import { PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE } from "@/lib/password-policy.ts"
import { usernameStrictSchema } from "@/lib/username-policy.ts"
import { createZodResolver } from "@/lib/create-zod-resolver.ts"
import PasswordRequirements from "@/components/auth/PasswordRequirements.tsx"
import type { UsernameAvailabilityResponse } from "@/types/auth.ts"

const registerSchema = z.object({
  username: usernameStrictSchema,
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(6, PASSWORD_REQUIREMENT_MESSAGE)
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE),
  firstName: z
    .string()
    .min(1, "First name is required"),
  lastName: z
    .string()
    .min(1, "Last name is required"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

const registerResolver = createZodResolver(registerSchema)

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
              <UsernameField
                registration={usernameField}
                placeholder="Choose a unique username"
                autoComplete="username"
                required
                status={usernameStatus}
                error={errors.username?.message}
                statusMessages={{
                  checking: "Checking availability...",
                  available: "Username available",
                  unavailable: "Username is already taken",
                  error: "Couldn't verify username",
                }}
                errorClassName="text-xs"
                containerClassName="space-y-2 md:col-span-2"
              />
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
                  <PasswordRequirements
                    password={passwordValue}
                    className="grid gap-1 text-xs"
                    metIconClassName="size-3"
                    unmetIconClassName="size-3"
                  />
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

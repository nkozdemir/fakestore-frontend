import { useCallback } from "react"
import { Link } from "react-router"
import { useForm } from "react-hook-form"
import { Loader2, CircleAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Input } from "@/components/ui/input.tsx"
import PasswordInput from "@/components/ui/password-input.tsx"
import { Label } from "@/components/ui/label.tsx"
import PasswordRequirements from "@/components/auth/PasswordRequirements.tsx"
import UsernameField from "@/components/auth/UsernameField.tsx"
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability.ts"
import { PASSWORD_REQUIREMENT_MESSAGE } from "@/lib/password-policy.ts"
import {
  type RegisterFormValues,
  registerResolver,
} from "@/lib/register-schema.ts"

export type RegisterFormProps = {
  onSubmit: (values: RegisterFormValues) => Promise<void>
  isLoading?: boolean
  redirectHint?: string
}

export default function RegisterForm({
  onSubmit,
  redirectHint = "Already have an account?",
}: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    getValues,
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

  const usernameAvailability = useUsernameAvailability()
  const passwordValue = watch("password") ?? ""

  const validateUsernameAvailability = useCallback(async () => {
    const username = getValues("username")
    const result = await usernameAvailability.checkAvailability(username)

    if (result.checked && !result.available) {
      setError("username", {
        type: "validate",
        message: "That username is already taken.",
      })
    } else if (result.checked && result.available) {
      clearErrors("username")
    }

    return result
  }, [clearErrors, getValues, setError, usernameAvailability])

  const submitHandler = handleSubmit(async (values) => {
    const usernameResult = await validateUsernameAvailability()

    if (usernameResult.checked && !usernameResult.available) {
      return
    }

    try {
      await onSubmit(values)
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
  })

  const usernameFieldRegistration = register("username", {
    onBlur: () => {
      void validateUsernameAvailability()
    },
    onChange: () => {
      usernameAvailability.reset()
      clearErrors("username")
    },
  })

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
        <CardDescription>
          Join Fakestore to manage your profile, cart, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={submitHandler} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                aria-invalid={errors.firstName ? "true" : "false"}
                {...register("firstName")}
              />
              {errors.firstName?.message && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                aria-invalid={errors.lastName ? "true" : "false"}
                {...register("lastName")}
              />
              {errors.lastName?.message && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
              />
              {errors.email?.message && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <UsernameField
                registration={usernameFieldRegistration}
                status={usernameAvailability.status}
                error={errors.username?.message}
                placeholder="Choose a unique username"
                statusMessages={{
                  checking: "Checking availability...",
                  available: "Username available",
                  unavailable: "Username is already taken",
                  error: "Couldn't verify username",
                  idle: "",
                }}
                statusMessageClassName="mt-1 text-xs"
                errorClassName="text-xs text-destructive"
                spinnerClassName="text-muted-foreground"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password")}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {PASSWORD_REQUIREMENT_MESSAGE}
                </p>
                <PasswordRequirements
                  password={passwordValue}
                  className="text-xs"
                  metIconClassName="size-3"
                  unmetIconClassName="size-3"
                />
              </div>
              {errors.password?.message && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          {errors.root?.message && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>Sign-up failed</AlertTitle>
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
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
          {redirectHint}{" "}
          <Link className="font-medium text-primary hover:underline" to="/login">
            Sign in
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}

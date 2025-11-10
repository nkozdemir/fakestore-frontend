import { Link, useLocation, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CircleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import PasswordInput from "@/components/ui/password-input.tsx"
import { Label } from "@/components/ui/label.tsx"
import UsernameField from "@/components/auth/UsernameField.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { createZodResolver } from "@/lib/create-zod-resolver.ts"
import { usernameRequiredSchema } from "@/lib/username-policy.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"
import { translateValidationMessage } from "@/lib/validation-messages.ts"

const loginSchema = z.object({
  username: usernameRequiredSchema,
  password: z
    .string()
    .nonempty("Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>
const loginResolver = createZodResolver(loginSchema)

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { t } = useTranslation()
  const resolveError = (message?: string) =>
    translateValidationMessage(t, message) ?? message
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
    resolver: loginResolver,
  })

  const usernameRegistration = register("username")

  const from =
    (location.state as { from?: string } | null)?.from ?? "/"

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (error) {
      const defaultMessage =
        "We couldn’t sign you in with those details. Please try again."
      const networkMessage =
        "We couldn’t reach the sign-in service. Check your connection and try again."
      const message =
        error instanceof TypeError
          ? networkMessage
          : error instanceof Error
            ? error.message || defaultMessage
            : defaultMessage
      setError("root", {
        type: "server",
        message,
      })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">
            {t("auth.login.title", { defaultValue: "Welcome back" })}
          </CardTitle>
          <CardDescription>
            {t("auth.login.description", {
              defaultValue: "Sign in with your store credentials to continue.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <UsernameField
              registration={usernameRegistration}
              autoComplete="username"
              required
              error={resolveError(errors.username?.message)}
            />
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("auth.login.passwordLabel", { defaultValue: "Password" })}
              </Label>
              <PasswordInput
                id="password"
                {...register("password")}
                placeholder={t("auth.login.passwordPlaceholder", {
                  defaultValue: "Enter your password",
                })}
                required
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.password.message)}
                </p>
              )}
            </div>
            {errors.root?.message && (
              <Alert variant="destructive">
                <CircleAlert className="size-5" aria-hidden />
                <AlertTitle>
                  {t("auth.login.alertTitle", { defaultValue: "Unable to sign in" })}
                </AlertTitle>
                <AlertDescription>
                  <p>
                    {t(errors.root.message, {
                      defaultValue: errors.root.message,
                    })}
                  </p>
                  <p>
                    {t("auth.login.alertHint", {
                      defaultValue:
                        "If you forgot your password, try resetting it or contact support for help.",
                    })}
                  </p>
                </AlertDescription>
              </Alert>
            )}
            <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
              {t("auth.login.button", { defaultValue: "Sign in" })}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.login.registerPrompt", { defaultValue: "Need an account?" })}{" "}
            <Link className="font-medium text-primary hover:underline" to="/register">
              {t("auth.login.registerLink", { defaultValue: "Create one" })}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

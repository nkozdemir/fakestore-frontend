import { Link, useLocation, useNavigate } from "react-router"
import { type FieldErrors, type Resolver, useForm } from "react-hook-form"
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
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import useAuth from "@/hooks/useAuth.ts"

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required"),
  password: z
    .string()
    .nonempty("Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const loginResolver: Resolver<LoginFormValues> = async (values) => {
  const result = loginSchema.safeParse(values)

  if (result.success) {
    return {
      values: result.data,
      errors: {},
    }
  }

  const fieldErrors = result.error.flatten()
  const errors: FieldErrors<LoginFormValues> = {}

  Object.entries(fieldErrors.fieldErrors).forEach(([key, messages]) => {
    if (messages && messages.length > 0) {
      errors[key as keyof LoginFormValues] = {
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

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
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
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your store credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                {...register("username")}
                placeholder="Enter your username"
                required
                autoComplete="username"
                aria-invalid={errors.username ? "true" : "false"}
              />
              {errors.username?.message && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password?.message && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errors.root?.message && (
              <Alert variant="destructive">
                <CircleAlert className="size-5" aria-hidden />
                <AlertTitle>Unable to sign in</AlertTitle>
                <AlertDescription>
                  <p>{errors.root.message}</p>
                  <p>If you forgot your password, try resetting it or contact support for help.</p>
                </AlertDescription>
              </Alert>
            )}
            <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/register">
              Create one
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

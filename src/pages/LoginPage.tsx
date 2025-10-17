import { useState, type ChangeEvent, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router"
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

type CredentialState = {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState<CredentialState>({
    email: "",
    password: "",
  })

  const from =
    (location.state as { from?: string } | null)?.from ?? "/"

  const handleChange =
    (field: keyof CredentialState) => (event: ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    login()
    navigate(from, { replace: true })
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
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={handleChange("password")}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button className="w-full" type="submit" size="lg">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

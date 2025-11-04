import { useLocation, useNavigate } from "react-router"
import RegisterForm from "@/components/auth/RegisterForm.tsx"
import useAuth from "@/hooks/useAuth.ts"
import type { RegisterFormValues } from "@/lib/register-schema.ts"

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser } = useAuth()

  const from = (location.state as { from?: string } | null)?.from ?? "/"

  const handleRegister = async (values: RegisterFormValues) => {
    await registerUser(values)
    navigate(from, { replace: true })
  }

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6">
        <RegisterForm onSubmit={handleRegister} redirectHint="Already have an account?" />
      </section>
    </main>
  )
}

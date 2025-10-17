import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth.ts"
import { useNavigate } from "react-router-dom"

export default function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
      <p className="max-w-lg text-base text-slate-600">
        This is a protected route. Replace this content with your real dashboard once authentication is wired up.
      </p>
      <Button onClick={handleSignOut} variant="outline">
        Sign out
      </Button>
    </section>
  )
}

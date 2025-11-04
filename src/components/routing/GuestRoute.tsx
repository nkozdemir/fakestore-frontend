import type { ReactNode } from "react"
import { Navigate } from "react-router"
import useAuth from "@/hooks/useAuth.ts"

type GuestRouteProps = {
  children: ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking session...
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

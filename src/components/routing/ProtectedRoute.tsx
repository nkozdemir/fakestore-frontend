import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import useAuth from "@/hooks/useAuth.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex min-h-with-header items-center justify-center bg-white text-sm text-slate-500">
        {t("routing.checkingSession", { defaultValue: "Checking session..." })}
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

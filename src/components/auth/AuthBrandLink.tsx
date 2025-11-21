import { Link } from "react-router"
import { useTranslation } from "@/hooks/useTranslation.ts"
import { cn } from "@/lib/utils.ts"

type AuthBrandLinkProps = {
  className?: string
}

export default function AuthBrandLink({ className }: AuthBrandLinkProps) {
  const { t } = useTranslation()

  return (
    <Link to="/" className={cn("text-lg font-semibold tracking-tight text-primary", className)}>
      {t("common.appName", { defaultValue: "Fakestore" })}
    </Link>
  )
}

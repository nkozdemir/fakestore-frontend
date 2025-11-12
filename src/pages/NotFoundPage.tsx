import { Link } from "react-router"
import { Button } from "@/components/ui/button.tsx"
import { useTranslation } from "@/hooks/useTranslation.ts"

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="bg-background">
      <div className="page-section mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          {t("notFound.badge", { defaultValue: "404 error" })}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("notFound.title", { defaultValue: "Page not found" })}
        </h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground sm:text-lg">
          {t("notFound.description", {
            defaultValue:
              "We couldn't find the page you were looking for. It may have been moved or deleted.",
          })}
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link to="/">{t("notFound.action", { defaultValue: "Return home" })}</Link>
        </Button>
      </div>
    </main>
  )
}

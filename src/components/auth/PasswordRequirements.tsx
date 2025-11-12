import { Check, Circle } from "lucide-react"
import { evaluatePasswordChecks } from "@/lib/password-policy.ts"
import { cn } from "@/lib/utils.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"

type PasswordRequirementsProps = {
  password: string
  className?: string
  metIconClassName?: string
  unmetIconClassName?: string
}

export default function PasswordRequirements({
  password,
  className,
  metIconClassName = "size-4",
  unmetIconClassName = "size-4",
}: PasswordRequirementsProps) {
  const checks = evaluatePasswordChecks(password)
  const { t } = useTranslation()

  return (
    <ul className={cn("grid gap-1 text-sm", className)}>
      {checks.map(({ id, label, met }) => (
        <li key={id} className="flex items-center gap-2">
          {met ? (
            <Check className={cn(metIconClassName, "text-emerald-600")} aria-hidden />
          ) : (
            <Circle className={cn(unmetIconClassName, "text-muted-foreground")} aria-hidden />
          )}
          <span className={met ? "text-emerald-600" : "text-muted-foreground"}>
            {t(`auth.passwordChecks.${id}`, {
              defaultValue: label,
            })}
          </span>
        </li>
      ))}
    </ul>
  )
}

import { forwardRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input.tsx"
import { cn } from "@/lib/utils.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"

type PasswordInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "type"
>

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const { t } = useTranslation()

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
        >
          {isVisible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
          <span className="sr-only">
            {isVisible
              ? t("auth.passwordInput.hide", { defaultValue: "Hide password" })
              : t("auth.passwordInput.show", { defaultValue: "Show password" })}
          </span>
        </button>
      </div>
    )
  },
)

PasswordInput.displayName = "PasswordInput"

export default PasswordInput

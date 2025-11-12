import { LanguagesIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"
import { languageMetadata, supportedLanguages, type Language } from "@/i18n/translations.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"
import { cn } from "@/lib/utils.ts"

export type LanguageToggleProps = {
  className?: string
}

export default function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage, t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("language.ariaLabel", {
            defaultValue: "Change language",
          })}
          className={className}
        >
          <LanguagesIcon className="size-5" />
          <span className="sr-only">
            {t("language.switcherLabel", {
              defaultValue: "Language",
            })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>
          {t("language.switcherLabel", {
            defaultValue: "Language",
          })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedLanguages.map((code) => {
          const metadata = languageMetadata[code]
          return (
            <DropdownMenuItem
              key={code}
              onSelect={() => setLanguage(code as Language)}
              className="cursor-pointer"
              aria-checked={language === code}
            >
              <span className="flex w-full items-center justify-between text-sm">
                <span>{metadata.label}</span>
                <CheckIcon
                  className={cn("size-4 opacity-0 transition", language === code && "opacity-100")}
                />
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

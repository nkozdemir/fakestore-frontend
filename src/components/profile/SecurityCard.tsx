import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { Button } from "@/components/ui/button.tsx"
import { useTranslation } from "@/context/I18nProvider.tsx"

type SecurityCardProps = {
  onChangePassword: () => void
}

export default function SecurityCard({ onChangePassword }: SecurityCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("profile.security.title", { defaultValue: "Security" })}
        </CardTitle>
        <CardDescription>
          {t("profile.security.description", {
            defaultValue: "Update sensitive account information such as your password.",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("profile.security.body", {
            defaultValue: "Choose a strong password to keep your account secure.",
          })}
        </p>
        <Button onClick={onChangePassword} data-testid="change-password-button">
          {t("profile.security.button", { defaultValue: "Change password" })}
        </Button>
      </CardContent>
    </Card>
  )
}

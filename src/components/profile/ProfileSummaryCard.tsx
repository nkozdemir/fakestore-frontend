import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import type { AuthUser } from "@/types/auth.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"

type ProfileSummaryCardProps = {
  user: AuthUser
  onEdit: () => void
}

export default function ProfileSummaryCard({
  user,
  onEdit,
}: ProfileSummaryCardProps) {
  const { t, locale } = useTranslation()

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-2xl">
            {user.firstName} {user.lastName}
          </CardTitle>
          <CardDescription>
            {t("profile.summary.description", {
              defaultValue: "Account details from your Fakestore profile.",
            })}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 size-4" aria-hidden />
          {t("profile.summary.editButton", { defaultValue: "Edit profile" })}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t("profile.summary.contactSection", { defaultValue: "Contact" })}
          </p>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-muted-foreground">
            {user.phone
              ? user.phone
              : t("profile.summary.phoneMissing", {
                  defaultValue: "Phone not provided",
                })}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t("profile.summary.accountSection", { defaultValue: "Account" })}
          </p>
          <p className="text-muted-foreground">
            {t("profile.summary.usernameLabel", {
              defaultValue: "Username",
            })}
            : {user.username}
          </p>
          <p className="text-muted-foreground">
            {t("profile.summary.memberSince", {
              defaultValue: "Member since",
            })}
            :{" "}
            {new Date(user.dateJoined).toLocaleDateString(locale, {
              dateStyle: "medium",
            })}
          </p>
          {user.lastLogin && (
            <p className="text-muted-foreground">
              {t("profile.summary.lastLogin", {
                defaultValue: "Last login",
              })}
              :{" "}
              {new Date(user.lastLogin).toLocaleString(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

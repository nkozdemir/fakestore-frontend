import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import ProfileSummaryCard from "@/components/profile/ProfileSummaryCard.tsx"
import AddressSection from "@/components/profile/AddressSection.tsx"
import SecurityCard from "@/components/profile/SecurityCard.tsx"
import DeleteAccountSection from "@/components/profile/DeleteAccountSection.tsx"
import ProfileDetailsDialog from "@/components/profile/ProfileDetailsDialog.tsx"
import AddressDialog from "@/components/profile/AddressDialog.tsx"
import ChangePasswordDialog from "@/components/profile/ChangePasswordDialog.tsx"
import useProfilePageState from "@/pages/profile/useProfilePageState.ts"

export default function ProfilePage() {
  const {
    t,
    user,
    isLoading,
    goToLogin,
    summaryCardProps,
    addressSectionProps,
    securityCardProps,
    deleteAccountProps,
    profileDialogProps,
    addressDialogProps,
    passwordDialogProps,
  } = useProfilePageState()

  if (isLoading) {
    return (
      <main className="bg-background">
        <div className="page-section flex items-center justify-center px-6">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="bg-background">
        <div className="page-section flex items-center justify-center px-6">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>
                {t("profile.unavailable.title", {
                  defaultValue: "Profile unavailable",
                })}
              </CardTitle>
              <CardDescription>
                {t("profile.unavailable.description", {
                  defaultValue:
                    "We couldn't load your profile details. Please sign in again to continue.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={goToLogin}>
                {t("profile.unavailable.action", {
                  defaultValue: "Go to sign in",
                })}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-4xl flex-col gap-8 px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("profile.title", { defaultValue: "Profile" })}
          </h1>
          <p className="text-muted-foreground">
            {t("profile.subtitle", {
              defaultValue: "Manage your personal information and account preferences.",
            })}
          </p>
        </header>

        <ProfileSummaryCard {...summaryCardProps} />

        <AddressSection {...addressSectionProps} />

        <SecurityCard {...securityCardProps} />

        <DeleteAccountSection {...deleteAccountProps} />
      </section>

      <ProfileDetailsDialog {...profileDialogProps} />

      <AddressDialog {...addressDialogProps} />

      <ChangePasswordDialog {...passwordDialogProps} />
    </main>
  )
}

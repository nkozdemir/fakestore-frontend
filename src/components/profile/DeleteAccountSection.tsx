import { Button } from "@/components/ui/button.tsx"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { CircleAlert, Loader2 } from "lucide-react"
import { useTranslation } from "@/context/I18nProvider.tsx"

type DeleteAccountSectionProps = {
  isDialogOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
  error: string | null
}

export default function DeleteAccountSection({
  isDialogOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  error,
}: DeleteAccountSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 rounded-md border border-destructive/40 bg-destructive/5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-destructive">
          {t("profile.delete.title", { defaultValue: "Delete account" })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("profile.delete.description", {
            defaultValue: "Permanently remove your Fakestore account and all associated data.",
          })}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <CircleAlert className="size-5" aria-hidden />
          <AlertTitle>
            {t("profile.delete.alertTitle", { defaultValue: "Account deletion failed" })}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <AlertDialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" data-testid="delete-account-trigger">
            {t("profile.delete.button", { defaultValue: "Delete account" })}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("profile.delete.dialogTitle", {
                defaultValue: "Delete your account?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.delete.dialogDescription", {
                defaultValue:
                  "This action cannot be undone. All of your profile information, addresses, and saved data will be permanently removed.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("profile.delete.cancel", { defaultValue: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-account"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  {t("profile.delete.deleting", {
                    defaultValue: "Deleting...",
                  })}
                </>
              ) : (
                t("profile.delete.button", { defaultValue: "Delete account" })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

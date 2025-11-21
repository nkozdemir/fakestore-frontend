import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Label } from "@/components/ui/label.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Loader2 } from "lucide-react"
import { type ProfileDetailsFormValues, profileResolver } from "@/lib/profile-schemas.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"
import { translateValidationMessage } from "@/lib/validation-messages.ts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx"

type ProfileDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: ProfileDetailsFormValues
  onSubmit: (values: ProfileDetailsFormValues) => Promise<void>
}

export default function ProfileDetailsDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: ProfileDetailsDialogProps) {
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileDetailsFormValues>({
    defaultValues: initialValues,
    resolver: profileResolver,
  })
  const { t } = useTranslation()
  const resolveError = (message?: string) => translateValidationMessage(t, message) ?? message

  useEffect(() => {
    if (open) {
      reset(initialValues)
    }
  }, [initialValues, open, reset])

  const submitHandler = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("profile.messages.requestFailed", {
              defaultValue: "We couldn't complete that request right now. Please try again.",
            })
      setErrorDialogMessage(message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-6" onSubmit={submitHandler} noValidate data-testid="profile-form">
          <DialogHeader>
            <DialogTitle>
              {t("profile.dialogs.profile.title", { defaultValue: "Edit profile" })}
            </DialogTitle>
            <DialogDescription>
              {t("profile.dialogs.profile.description", {
                defaultValue:
                  "Update your personal details. Some changes may require you to sign in again.",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {t("auth.register.firstName", { defaultValue: "First name" })}
              </Label>
              <Input
                id="firstName"
                type="text"
                {...register("firstName")}
                autoComplete="given-name"
                required
                aria-invalid={errors.firstName ? "true" : "false"}
              />
              {errors.firstName?.message && (
                <p className="text-sm text-destructive">{resolveError(errors.firstName.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                {t("auth.register.lastName", { defaultValue: "Last name" })}
              </Label>
              <Input
                id="lastName"
                type="text"
                {...register("lastName")}
                autoComplete="family-name"
                required
                aria-invalid={errors.lastName ? "true" : "false"}
              />
              {errors.lastName?.message && (
                <p className="text-sm text-destructive">{resolveError(errors.lastName.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.register.email", { defaultValue: "Email" })}</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                autoComplete="email"
                required
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email?.message && (
                <p className="text-sm text-destructive">{resolveError(errors.email.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("profile.fields.phone", { defaultValue: "Phone" })}</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                autoComplete="tel"
                aria-invalid={errors.phone ? "true" : "false"}
              />
              {errors.phone?.message && (
                <p className="text-sm text-destructive">{resolveError(errors.phone.message)}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="profile-save">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  {t("profile.dialogs.profile.saving", {
                    defaultValue: "Saving...",
                  })}
                </>
              ) : (
                t("profile.dialogs.profile.save", {
                  defaultValue: "Save changes",
                })
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertDialog
        open={Boolean(errorDialogMessage)}
        onOpenChange={(open) => {
          if (!open) {
            setErrorDialogMessage(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("profile.dialogs.profile.alertTitle", { defaultValue: "Profile update failed" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resolveError(errorDialogMessage ?? undefined) ??
                t("profile.messages.requestFailed", {
                  defaultValue: "We couldn't complete that request right now. Please try again.",
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              {t("common.actions.close", { defaultValue: "Close" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

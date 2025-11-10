import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Label } from "@/components/ui/label.tsx"
import PasswordInput from "@/components/ui/password-input.tsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Loader2, CircleAlert } from "lucide-react"
import PasswordRequirements from "@/components/auth/PasswordRequirements.tsx"
import {
  type PasswordFormValues,
  passwordResolver,
} from "@/lib/profile-schemas.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"
import { translateValidationMessage } from "@/lib/validation-messages.ts"

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PasswordFormValues) => Promise<void>
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  onSubmit,
}: ChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setError,
  } = useForm<PasswordFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: passwordResolver,
  })
  const { t } = useTranslation()
  const resolveError = (message?: string) =>
    translateValidationMessage(t, message) ?? message

  useEffect(() => {
    if (!open) {
      reset({
        password: "",
        confirmPassword: "",
      })
    }
  }, [open, reset])

  const passwordValue = watch("password") ?? ""
  const submitHandler = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      reset({
        password: "",
        confirmPassword: "",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("profile.messages.requestFailed", {
              defaultValue:
                "We couldn't complete that request right now. Please try again.",
            })
      setError("root", {
        type: "server",
        message,
      })
      toast.error(message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-6" onSubmit={submitHandler} noValidate>
          <DialogHeader>
            <DialogTitle>
              {t("profile.dialogs.password.title", { defaultValue: "Change password" })}
            </DialogTitle>
            <DialogDescription>
              {t("profile.dialogs.password.description", {
                defaultValue: "Choose a strong password that meets all requirements.",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {t("profile.dialogs.password.newPassword", {
                  defaultValue: "New password",
                })}
              </Label>
              <PasswordInput
                id="new-password"
                {...register("password")}
                autoComplete="new-password"
                required
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.password.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t("profile.dialogs.password.confirmPassword", {
                  defaultValue: "Confirm password",
                })}
              </Label>
              <PasswordInput
                id="confirm-password"
                {...register("confirmPassword")}
                autoComplete="new-password"
                required
                aria-invalid={errors.confirmPassword ? "true" : "false"}
              />
              {errors.confirmPassword?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.confirmPassword.message)}
                </p>
              )}
            </div>
            <PasswordRequirements password={passwordValue} />
          </div>
          {errors.root?.message && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>
                {t("profile.dialogs.password.alertTitle", {
                  defaultValue: "Password update failed",
                })}
              </AlertTitle>
              <AlertDescription>{resolveError(errors.root.message)}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  {t("profile.dialogs.password.saving", {
                    defaultValue: "Saving...",
                  })}
                </>
              ) : (
                t("profile.dialogs.password.save", {
                  defaultValue: "Update password",
                })
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
          : "We couldn't update your password right now. Please try again."
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
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Choose a strong password that meets all requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                {...register("password")}
                autoComplete="new-password"
                required
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password?.message && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <PasswordInput
                id="confirm-password"
                {...register("confirmPassword")}
                autoComplete="new-password"
                required
                aria-invalid={errors.confirmPassword ? "true" : "false"}
              />
              {errors.confirmPassword?.message && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <PasswordRequirements password={passwordValue} />
          </div>
          {errors.root?.message && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>Password update failed</AlertTitle>
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Saving...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

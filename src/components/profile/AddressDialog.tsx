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
import { Input } from "@/components/ui/input.tsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Loader2, CircleAlert } from "lucide-react"
import {
  type AddressFormValues,
  addressResolver,
} from "@/lib/profile-schemas.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"
import { translateValidationMessage } from "@/lib/validation-messages.ts"

type AddressDialogProps = {
  open: boolean
  mode: "create" | "edit"
  initialValues: AddressFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AddressFormValues) => Promise<void>
}

export default function AddressDialog({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
}: AddressDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<AddressFormValues>({
    defaultValues: initialValues,
    resolver: addressResolver,
  })
  const { t } = useTranslation()
  const resolveError = (message?: string) =>
    translateValidationMessage(t, message) ?? message

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
              {mode === "edit"
                ? t("profile.dialogs.address.editTitle", { defaultValue: "Edit address" })
                : t("profile.dialogs.address.addTitle", { defaultValue: "Add new address" })}
            </DialogTitle>
            <DialogDescription>
              {t("profile.dialogs.address.description", {
                defaultValue: "Provide the full address details. All fields are required.",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">
                {t("profile.fields.street", { defaultValue: "Street" })}
              </Label>
              <Input
                id="street"
                type="text"
                {...register("street")}
                required
                aria-invalid={errors.street ? "true" : "false"}
              />
              {errors.street?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.street.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">
                {t("profile.fields.number", { defaultValue: "Number" })}
              </Label>
              <Input
                id="number"
                type="text"
                inputMode="numeric"
                {...register("number")}
                required
                aria-invalid={errors.number ? "true" : "false"}
              />
              {errors.number?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.number.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">
                {t("profile.fields.city", { defaultValue: "City" })}
              </Label>
              <Input
                id="city"
                type="text"
                {...register("city")}
                required
                aria-invalid={errors.city ? "true" : "false"}
              />
              {errors.city?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.city.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipcode">
                {t("profile.fields.zipcode", { defaultValue: "ZIP code" })}
              </Label>
              <Input
                id="zipcode"
                type="text"
                {...register("zipcode")}
                required
                aria-invalid={errors.zipcode ? "true" : "false"}
              />
              {errors.zipcode?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.zipcode.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">
                {t("profile.fields.latitude", { defaultValue: "Latitude" })}
              </Label>
              <Input
                id="latitude"
                type="text"
                {...register("latitude")}
                required
                aria-invalid={errors.latitude ? "true" : "false"}
              />
              {errors.latitude?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.latitude.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">
                {t("profile.fields.longitude", { defaultValue: "Longitude" })}
              </Label>
              <Input
                id="longitude"
                type="text"
                {...register("longitude")}
                required
                aria-invalid={errors.longitude ? "true" : "false"}
              />
              {errors.longitude?.message && (
                <p className="text-sm text-destructive">
                  {resolveError(errors.longitude.message)}
                </p>
              )}
            </div>
          </div>
          {errors.root?.message && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>
                {t("profile.dialogs.address.alertTitle", {
                  defaultValue: "Address update failed",
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
                  {t("profile.dialogs.address.saving", {
                    defaultValue: "Saving...",
                  })}
                </>
              ) : (
                mode === "edit"
                  ? t("profile.dialogs.address.saveEdit", {
                      defaultValue: "Update address",
                    })
                  : t("profile.dialogs.address.saveAdd", {
                      defaultValue: "Add address",
                    })
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

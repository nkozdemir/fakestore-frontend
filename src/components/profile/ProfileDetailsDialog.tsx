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
import UsernameField from "@/components/auth/UsernameField.tsx"
import {
  type ProfileDetailsFormValues,
  profileResolver,
} from "@/lib/profile-schemas.ts"

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<ProfileDetailsFormValues>({
    defaultValues: initialValues,
    resolver: profileResolver,
  })

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
          : "We couldn't update your profile right now. Please try again."
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
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your personal details. Some changes may require you to sign in
              again.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                {...register("firstName")}
                autoComplete="given-name"
                required
                aria-invalid={errors.firstName ? "true" : "false"}
              />
              {errors.firstName?.message && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                {...register("lastName")}
                autoComplete="family-name"
                required
                aria-invalid={errors.lastName ? "true" : "false"}
              />
              {errors.lastName?.message && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                autoComplete="email"
                required
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email?.message && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                autoComplete="tel"
                aria-invalid={errors.phone ? "true" : "false"}
              />
              {errors.phone?.message && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <UsernameField
              registration={register("username")}
              autoComplete="username"
              required
              error={errors.username?.message}
              containerClassName="space-y-2 sm:col-span-2"
            />
          </div>
          {errors.root?.message && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>Profile update failed</AlertTitle>
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
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

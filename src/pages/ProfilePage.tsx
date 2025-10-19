import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import {
  type FieldErrors,
  type Resolver,
  useForm,
} from "react-hook-form"
import { z } from "zod"
import {
  Check,
  Circle,
  CircleAlert,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { buildApiUrl } from "@/lib/api.ts"
import type { UserAddress } from "@/types/auth.ts"

const usernameRule = z
  .string()
  .trim()
  .min(4, "Username must be at least 4 characters.")
  .regex(/^[A-Za-z0-9]+$/, "Username can only contain letters and numbers")

const profileDetailsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional(),
  username: usernameRule,
})

const addressSchema = z.object({
  street: z
    .string()
    .trim()
    .min(1, "Street is required."),
  number: z
    .string()
    .trim()
    .min(1, "Street number is required.")
    .regex(/^\d+$/, "Street number must be numeric.")
    .refine(
      (value) => Number(value) > 0,
      "Street number must be greater than 0.",
    ),
  city: z
    .string()
    .trim()
    .min(1, "City is required."),
  zipcode: z
    .string()
    .trim()
    .min(1, "ZIP code is required."),
  latitude: z
    .string()
    .trim()
    .min(1, "Latitude is required."),
  longitude: z
    .string()
    .trim()
    .min(1, "Longitude is required."),
})

const passwordRequirement =
  "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, passwordRequirement)
      .regex(passwordRegex, passwordRequirement),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password."),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      message: "Passwords must match.",
      path: ["confirmPassword"],
    },
  )

type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>
type AddressFormValues = z.infer<typeof addressSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

function createResolver<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
): Resolver<z.infer<TSchema>> {
  return async (values) => {
    const parsed = schema.safeParse(values)

    if (parsed.success) {
      return {
        values: parsed.data,
        errors: {},
      }
    }

    const fieldErrors = parsed.error.flatten()
    const errors: FieldErrors<z.infer<TSchema>> = {}

    Object.entries(fieldErrors.fieldErrors).forEach(([key, value]) => {
      if (value?.length) {
        errors[key as keyof z.infer<TSchema>] = {
          type: "manual",
          message: value[0],
        }
      }
    })

    if (fieldErrors.formErrors.length) {
      errors.root = {
        type: "manual",
        message: fieldErrors.formErrors[0],
      }
    }

    return {
      values: {},
      errors,
    }
  }
}

const profileResolver = createResolver(profileDetailsSchema)
const addressResolver = createResolver(addressSchema)
const passwordResolver = createResolver(passwordSchema)

type AddressDialogState =
  | {
      mode: "create"
      address: null
    }
  | {
      mode: "edit"
      address: UserAddress
    }
  | null

export default function ProfilePage() {
  const navigate = useNavigate()
  const {
    user,
    accessToken,
    isLoading,
    refreshUser,
    logout,
  } = useAuth()

  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false)
  const [addressDialogState, setAddressDialogState] =
    useState<AddressDialogState>(null)
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(
    null,
  )
  const [isDeletingAddress, setIsDeletingAddress] = useState(false)
  const [deleteAddressError, setDeleteAddressError] = useState<string | null>(
    null,
  )

  const profileInitialValues = useMemo<ProfileDetailsFormValues>(
    () => ({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  )

  const addressInitialValues = useMemo<AddressFormValues>(
    () =>
      addressDialogState && addressDialogState.mode === "edit"
        ? {
            street: addressDialogState.address.street,
            number: String(addressDialogState.address.number),
            city: addressDialogState.address.city,
            zipcode: addressDialogState.address.zipcode,
            latitude: addressDialogState.address.latitude,
            longitude: addressDialogState.address.longitude,
          }
        : {
            street: "",
            number: "",
            city: "",
            zipcode: "",
            latitude: "",
            longitude: "",
          },
    [addressDialogState],
  )

  const authorizedRequest = useCallback(
    async (path: string, init: RequestInit) => {
      if (!accessToken) {
        throw new Error("You must be signed in to perform this action.")
      }

      const response = await fetch(buildApiUrl(path), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...init.headers,
        },
        ...init,
      })

      let parsedBody: unknown = null
      try {
        parsedBody = await response.json()
      } catch {
        parsedBody = null
      }

      if (!response.ok) {
        const detail =
          parsedBody &&
          typeof parsedBody === "object" &&
          "detail" in parsedBody &&
          typeof (parsedBody as { detail: unknown }).detail === "string"
            ? (parsedBody as { detail: string }).detail
            : null

        throw new Error(
          detail ??
            "We couldn't complete that request right now. Please try again.",
        )
      }

      return parsedBody
    },
    [accessToken],
  )

  const handleProfileSubmit = useCallback(
    async (values: ProfileDetailsFormValues) => {
      if (!user) {
        throw new Error("We couldn't find your profile. Please sign in again.")
      }

      const payload: Record<string, unknown> = {
        email: values.email.trim(),
        username: values.username.trim(),
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
      }

      const trimmedPhone = values.phone?.trim() ?? ""
      if (trimmedPhone) {
        payload.phone = trimmedPhone
      }

      await authorizedRequest(`/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })

      await refreshUser()
      setProfileDialogOpen(false)
      toast.success("Profile updated successfully.")
    },
    [authorizedRequest, refreshUser, user],
  )

  const handleAddressSubmit = useCallback(
    async (values: AddressFormValues) => {
      if (!user) {
        throw new Error("We couldn't find your profile. Please sign in again.")
      }

      const isEditMode = addressDialogState?.mode === "edit"

      const payload = {
        street: values.street.trim(),
        number: Number(values.number.trim()),
        city: values.city.trim(),
        zipcode: values.zipcode.trim(),
        geolocation: {
          lat: values.latitude.trim(),
          long: values.longitude.trim(),
        },
      }

      if (
        addressDialogState &&
        addressDialogState.mode === "edit" &&
        addressDialogState.address
      ) {
        await authorizedRequest(
          `/users/addresses/${addressDialogState.address.id}/`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        )
      } else {
        await authorizedRequest(`/users/${user.id}/addresses/`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await refreshUser()
      toast.success(
        isEditMode
          ? "Address updated successfully."
          : "Address added successfully.",
      )
      setAddressDialogState(null)
    },
    [addressDialogState, authorizedRequest, refreshUser, user],
  )

  const handleDeleteAddress = useCallback(async () => {
    const currentAddress = addressToDelete

    if (!currentAddress) {
      return
    }

    try {
      setDeleteAddressError(null)
      setIsDeletingAddress(true)
      await authorizedRequest(`/users/addresses/${currentAddress.id}/`, {
        method: "DELETE",
      })
      await refreshUser()
      toast.success("Address removed successfully.")
      setAddressToDelete(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't remove that address right now. Please try again."
      setDeleteAddressError(message)
      toast.error(message)
    } finally {
      setIsDeletingAddress(false)
    }
  }, [addressToDelete, authorizedRequest, refreshUser])

  const handlePasswordSubmit = useCallback(
    async (values: PasswordFormValues) => {
      if (!user) {
        throw new Error("We couldn't find your profile. Please sign in again.")
      }

      await authorizedRequest(`/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          password: values.password,
        }),
      })

      setPasswordDialogOpen(false)
      toast.success("Password updated successfully.")
    },
    [authorizedRequest, user],
  )

  const handleDeleteAccount = useCallback(async () => {
    if (!user) {
      setDeleteError("We couldn't find your profile. Please sign in again.")
      return
    }

    try {
      setDeleteError(null)
      setIsDeleting(true)
      await authorizedRequest(`/users/${user.id}/`, {
        method: "DELETE",
      })
      toast.success("Your account has been deleted.")
      setDeleteDialogOpen(false)
      await logout()
      navigate("/", { replace: true })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't delete your account right now. Please try again."
      setDeleteError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }, [authorizedRequest, logout, navigate, user])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>
              We couldn't load your profile details. Please sign in again to
              continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")}>Go to sign in</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const isAddressDialogOpen = Boolean(addressDialogState)

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences.
          </p>
        </header>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>
                Account details from your Fakestore profile.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProfileDialogOpen(true)}
            >
              <Pencil className="mr-2 size-4" aria-hidden />
              Edit profile
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6 text-sm md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Contact</p>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-muted-foreground">
                {user.phone ? user.phone : "Phone not provided"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Account</p>
              <p className="text-muted-foreground">
                Username: {user.username}
              </p>
              <p className="text-muted-foreground">
                Member since:{" "}
                {new Date(user.dateJoined).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
              {user.lastLogin && (
                <p className="text-muted-foreground">
                  Last login:{" "}
                  {new Date(user.lastLogin).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>
                Manage the delivery addresses linked to your account.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setAddressDialogState({
                  mode: "create",
                  address: null,
                })
              }
            >
              <Plus className="mr-2 size-4" aria-hidden />
              Add address
            </Button>
          </CardHeader>
          <CardContent>
            {user.addresses.length > 0 ? (
              <ul className="grid gap-4">
                {user.addresses.map((address) => (
                  <li
                    key={address.id}
                    className="rounded-md border p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {address.street} {address.number}
                        </p>
                        <p className="text-muted-foreground">
                          {address.city}, {address.zipcode}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Coordinates: {address.latitude}, {address.longitude}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAddressDialogState({
                              mode: "edit",
                              address,
                            })
                          }
                        >
                          <Pencil className="mr-2 size-4" aria-hidden />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive focus-visible:text-destructive"
                          onClick={() => {
                            setDeleteAddressError(null)
                            setAddressToDelete(address)
                          }}
                          aria-label={`Remove address at ${address.street} ${address.number}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                You haven't saved any addresses yet.
              </p>
            )}
            <AlertDialog
              open={Boolean(addressToDelete)}
              onOpenChange={(isOpen) => {
                if (!isOpen) {
                  setDeleteAddressError(null)
                  setAddressToDelete(null)
                }
              }}
            >
              {addressToDelete && (
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Remove this address?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      We'll remove {addressToDelete.street}{" "}
                      {addressToDelete.number} from your saved addresses. You
                      can add it again at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteAddressError && (
                    <Alert variant="destructive">
                      <CircleAlert className="size-5" aria-hidden />
                      <AlertTitle>Address removal failed</AlertTitle>
                      <AlertDescription>
                        {deleteAddressError}
                      </AlertDescription>
                    </Alert>
                  )}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingAddress}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault()
                        void handleDeleteAddress()
                      }}
                      disabled={isDeletingAddress}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAddress ? (
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="mr-2 size-4" aria-hidden />
                      )}
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              )}
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Update sensitive account information such as your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Choose a strong password to keep your account secure.
            </p>
            <Button onClick={() => setPasswordDialogOpen(true)}>
              Change password
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 rounded-md border border-destructive/40 bg-destructive/5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-destructive">
              Delete account
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently remove your Fakestore account and all associated data.
            </p>
          </div>
          {deleteError && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>Account deletion failed</AlertTitle>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All of your profile information,
                  addresses, and saved data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Deleting...
                    </>
                  ) : (
                    "Delete account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <ProfileDetailsDialog
        open={isProfileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        initialValues={profileInitialValues}
        onSubmit={handleProfileSubmit}
      />

      <AddressDialog
        open={isAddressDialogOpen}
        mode={addressDialogState?.mode ?? "create"}
        initialValues={addressInitialValues}
        onOpenChange={(open) => {
          if (!open) {
            setAddressDialogState(null)
          }
        }}
        onSubmit={handleAddressSubmit}
      />

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onSubmit={handlePasswordSubmit}
      />
    </main>
  )
}

type ProfileDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: ProfileDetailsFormValues
  onSubmit: (values: ProfileDetailsFormValues) => Promise<void>
}

function ProfileDetailsDialog({
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
              Update your personal details. Some changes may require you to
              sign in again.
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                {...register("username")}
                autoComplete="username"
                required
                aria-invalid={errors.username ? "true" : "false"}
              />
              {errors.username?.message && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
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

type AddressDialogProps = {
  open: boolean
  mode: "create" | "edit"
  initialValues: AddressFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AddressFormValues) => Promise<void>
}

function AddressDialog({
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
          : "We couldn't save that address right now. Please try again."
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
              {mode === "edit" ? "Edit address" : "Add new address"}
            </DialogTitle>
            <DialogDescription>
              Provide the full address details. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                type="text"
                {...register("street")}
                required
                aria-invalid={errors.street ? "true" : "false"}
              />
              {errors.street?.message && (
                <p className="text-sm text-destructive">
                  {errors.street.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Number</Label>
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
                  {errors.number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipcode">ZIP code</Label>
              <Input
                id="zipcode"
                type="text"
                {...register("zipcode")}
                required
                aria-invalid={errors.zipcode ? "true" : "false"}
              />
              {errors.zipcode?.message && (
                <p className="text-sm text-destructive">
                  {errors.zipcode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                {...register("city")}
                required
                aria-invalid={errors.city ? "true" : "false"}
              />
              {errors.city?.message && (
                <p className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="text"
                {...register("latitude")}
                required
                aria-invalid={errors.latitude ? "true" : "false"}
              />
              {errors.latitude?.message && (
                <p className="text-sm text-destructive">
                  {errors.latitude.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="text"
                {...register("longitude")}
                required
                aria-invalid={errors.longitude ? "true" : "false"}
              />
              {errors.longitude?.message && (
                <p className="text-sm text-destructive">
                  {errors.longitude.message}
                </p>
              )}
            </div>
          </div>
          {errors.root?.message && (
            <Alert variant="destructive">
              <CircleAlert className="size-5" aria-hidden />
              <AlertTitle>Address update failed</AlertTitle>
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
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Add address"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PasswordFormValues) => Promise<void>
}

function ChangePasswordDialog({
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

  const passwordValue = watch("password")
  const passwordChecks = useMemo(
    () => [
      {
        id: "length",
        label: "At least 6 characters",
        met: passwordValue.length >= 6,
      },
      {
        id: "uppercase",
        label: "Contains an uppercase letter (A-Z)",
        met: /[A-Z]/.test(passwordValue),
      },
      {
        id: "lowercase",
        label: "Contains a lowercase letter (a-z)",
        met: /[a-z]/.test(passwordValue),
      },
      {
        id: "number",
        label: "Contains a number (0-9)",
        met: /\d/.test(passwordValue),
      },
      {
        id: "special",
        label: "Contains a special character (!@#$%^&*)",
        met: /[^A-Za-z0-9]/.test(passwordValue),
      },
    ],
    [passwordValue],
  )

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
              <Input
                id="new-password"
                type="password"
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
              <Input
                id="confirm-password"
                type="password"
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
            <ul className="grid gap-1 text-sm">
              {passwordChecks.map(({ id, label, met }) => (
                <li key={id} className="flex items-center gap-2">
                  {met ? (
                    <Check className="size-4 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" aria-hidden />
                  )}
                  <span
                    className={met ? "text-emerald-600" : "text-muted-foreground"}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
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

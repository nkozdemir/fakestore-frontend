import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { buildApiUrl, formatApiErrorMessage, parseApiError } from "@/lib/api.ts"
import { authorizationHeader } from "@/lib/auth-headers.ts"
import type { UserAddress } from "@/types/auth.ts"
import ProfileSummaryCard from "@/components/profile/ProfileSummaryCard.tsx"
import AddressSection from "@/components/profile/AddressSection.tsx"
import SecurityCard from "@/components/profile/SecurityCard.tsx"
import DeleteAccountSection from "@/components/profile/DeleteAccountSection.tsx"
import ProfileDetailsDialog from "@/components/profile/ProfileDetailsDialog.tsx"
import AddressDialog from "@/components/profile/AddressDialog.tsx"
import ChangePasswordDialog from "@/components/profile/ChangePasswordDialog.tsx"
import {
  type ProfileDetailsFormValues,
  type AddressFormValues,
  type PasswordFormValues,
} from "@/lib/profile-schemas.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"

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
  const { t } = useTranslation()

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
        throw new Error(
          t("profile.messages.profileMissing", {
            defaultValue: "We couldn't find your profile. Please sign in again.",
          }),
        )
      }

      const defaultErrorMessage = t("profile.messages.requestFailed", {
        defaultValue: "We couldn't complete that request right now. Please try again.",
      })

      let response: Response

      try {
        response = await fetch(buildApiUrl(path), {
          headers: {
            "Content-Type": "application/json",
            ...authorizationHeader(accessToken),
            ...init.headers,
          },
          ...init,
        })
      } catch (networkError) {
        throw new Error(
          networkError instanceof Error && networkError.message.trim().length > 0
            ? networkError.message
            : defaultErrorMessage,
        )
      }

      if (!response.ok) {
        const apiError = await parseApiError(response)
        throw new Error(
          formatApiErrorMessage(apiError, defaultErrorMessage, [
            "Validation failed",
            "Request failed",
          ]),
        )
      }

      const rawText = await response.text().catch(() => "")

      if (!rawText) {
        return null
      }

      try {
        return JSON.parse(rawText)
      } catch {
        return null
      }
    },
    [accessToken, t],
  )

  const handleProfileSubmit = useCallback(
    async (values: ProfileDetailsFormValues) => {
      if (!user) {
        throw new Error(
          t("profile.messages.profileMissing", {
            defaultValue: "We couldn't find your profile. Please sign in again.",
          }),
        )
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
      toast.success(
        t("profile.toasts.profileUpdated", {
          defaultValue: "Profile updated successfully.",
        }),
      )
    },
    [authorizedRequest, refreshUser, t, user],
  )

  const handleAddressSubmit = useCallback(
    async (values: AddressFormValues) => {
      if (!user) {
        throw new Error(
          t("profile.messages.profileMissing", {
            defaultValue: "We couldn't find your profile. Please sign in again.",
          }),
        )
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
          ? t("profile.toasts.addressUpdated", {
              defaultValue: "Address updated successfully.",
            })
          : t("profile.toasts.addressAdded", {
              defaultValue: "Address added successfully.",
            }),
      )
      setAddressDialogState(null)
    },
    [addressDialogState, authorizedRequest, refreshUser, t, user],
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
      toast.success(
        t("profile.toasts.addressRemoved", {
          defaultValue: "Address removed successfully.",
        }),
      )
      setAddressToDelete(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("profile.toasts.addressRemoveError", {
              defaultValue:
                "We couldn't remove that address right now. Please try again.",
            })
      setDeleteAddressError(message)
      toast.error(message)
    } finally {
      setIsDeletingAddress(false)
    }
  }, [addressToDelete, authorizedRequest, refreshUser, t])

  const handlePasswordSubmit = useCallback(
    async (values: PasswordFormValues) => {
      if (!user) {
        throw new Error(
          t("profile.messages.profileMissing", {
            defaultValue: "We couldn't find your profile. Please sign in again.",
          }),
        )
      }

      await authorizedRequest(`/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          password: values.password,
        }),
      })

      setPasswordDialogOpen(false)
      toast.success(
        t("profile.toasts.passwordUpdated", {
          defaultValue: "Password updated successfully.",
        }),
      )
    },
    [authorizedRequest, t, user],
  )

  const handleDeleteAccount = useCallback(async () => {
    if (!user) {
      setDeleteError(
        t("profile.messages.profileMissing", {
          defaultValue: "We couldn't find your profile. Please sign in again.",
        }),
      )
      return
    }

    try {
      setDeleteError(null)
      setIsDeleting(true)
      await authorizedRequest(`/users/${user.id}/`, {
        method: "DELETE",
      })
      toast.success(
        t("profile.toasts.accountDeleted", {
          defaultValue: "Your account has been deleted.",
        }),
      )
      setDeleteDialogOpen(false)
      await logout()
      navigate("/", { replace: true })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("profile.toasts.accountDeleteError", {
              defaultValue:
                "We couldn't delete your account right now. Please try again.",
            })
      setDeleteError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }, [authorizedRequest, logout, navigate, t, user])

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
              <Button onClick={() => navigate("/login")}>
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

  const isAddressDialogOpen = Boolean(addressDialogState)

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

        <ProfileSummaryCard
          user={user}
          onEdit={() => setProfileDialogOpen(true)}
        />

        <AddressSection
          addresses={user.addresses}
          onAdd={() =>
            setAddressDialogState({
              mode: "create",
              address: null,
            })
          }
          onEdit={(address) =>
            setAddressDialogState({
              mode: "edit",
              address,
            })
          }
          onDeleteRequest={(address) => {
            setDeleteAddressError(null)
            setAddressToDelete(address)
          }}
          deleteDialog={{
            address: addressToDelete,
            error: deleteAddressError,
            isDeleting: isDeletingAddress,
            onCancel: () => {
              setDeleteAddressError(null)
              setAddressToDelete(null)
            },
            onConfirm: () => {
              void handleDeleteAddress()
            },
          }}
        />

        <SecurityCard onChangePassword={() => setPasswordDialogOpen(true)} />

        <DeleteAccountSection
          isDialogOpen={isDeleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteAccount}
          isDeleting={isDeleting}
          error={deleteError}
        />
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

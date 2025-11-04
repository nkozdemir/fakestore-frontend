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
import { buildApiUrl } from "@/lib/api.ts"
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
          ...authorizationHeader(accessToken),
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
            Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences.
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

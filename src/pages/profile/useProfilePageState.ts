import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import useAuth from "@/hooks/useAuth.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"
import {
  buildApiUrl,
  formatApiErrorMessage,
  parseApiError,
  resolvePreferredApiLanguage,
} from "@/lib/api.ts"
import { authorizationHeader } from "@/lib/auth-headers.ts"
import {
  type ProfileDetailsFormValues,
  type AddressFormValues,
  type PasswordFormValues,
} from "@/lib/profile-schemas.ts"
import type { UserAddress } from "@/types/auth.ts"

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

export default function useProfilePageState() {
  const navigate = useNavigate()
  const { user, accessToken, isLoading, refreshUser, logout } = useAuth()
  const { t } = useTranslation()

  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false)
  const [addressDialogState, setAddressDialogState] = useState<AddressDialogState>(null)
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(null)
  const [isDeletingAddress, setIsDeletingAddress] = useState(false)
  const [deleteAddressError, setDeleteAddressError] = useState<string | null>(null)

  const profileInitialValues = useMemo<ProfileDetailsFormValues>(
    () => ({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
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

      const preferredLanguage = resolvePreferredApiLanguage()

      try {
        response = await fetch(buildApiUrl(path), {
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": preferredLanguage,
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

      if (addressDialogState && addressDialogState.mode === "edit" && addressDialogState.address) {
        await authorizedRequest(`/users/addresses/${addressDialogState.address.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      } else {
        await authorizedRequest(`/users/${user.id}/addresses/`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await refreshUser()
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
      setAddressToDelete(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("profile.toasts.addressRemoveError", {
              defaultValue: "We couldn't remove that address right now. Please try again.",
            })
      setDeleteAddressError(message)
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
      setDeleteDialogOpen(false)
      await logout()
      navigate("/", { replace: true })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("profile.toasts.accountDeleteError", {
              defaultValue: "We couldn't delete your account right now. Please try again.",
            })
      setDeleteError(message)
    } finally {
      setIsDeleting(false)
    }
  }, [authorizedRequest, logout, navigate, t, user])

  const isAddressDialogOpen = Boolean(addressDialogState)

  const addressSectionProps = {
    addresses: user?.addresses ?? [],
    onAdd: () =>
      setAddressDialogState({
        mode: "create",
        address: null,
      }),
    onEdit: (address: UserAddress) =>
      setAddressDialogState({
        mode: "edit",
        address,
      }),
    onDeleteRequest: (address: UserAddress) => {
      setDeleteAddressError(null)
      setAddressToDelete(address)
    },
    deleteDialog: {
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
    },
  }

  return {
    t,
    user,
    isLoading,
    goToLogin: () => navigate("/login"),
    summaryCardProps: {
      user: user!,
      onEdit: () => setProfileDialogOpen(true),
    },
    addressSectionProps,
    securityCardProps: { onChangePassword: () => setPasswordDialogOpen(true) },
    deleteAccountProps: {
      isDialogOpen: isDeleteDialogOpen,
      onOpenChange: setDeleteDialogOpen,
      onConfirm: handleDeleteAccount,
      isDeleting,
      error: deleteError,
    },
    profileDialogProps: {
      open: isProfileDialogOpen,
      onOpenChange: setProfileDialogOpen,
      initialValues: profileInitialValues,
      onSubmit: handleProfileSubmit,
    },
    addressDialogProps: {
      open: isAddressDialogOpen,
      mode: addressDialogState?.mode ?? "create",
      initialValues: addressInitialValues,
      onOpenChange: (open: boolean) => {
        if (!open) {
          setAddressDialogState(null)
        }
      },
      onSubmit: handleAddressSubmit,
    },
    passwordDialogProps: {
      open: isPasswordDialogOpen,
      onOpenChange: setPasswordDialogOpen,
      onSubmit: handlePasswordSubmit,
    },
  }
}

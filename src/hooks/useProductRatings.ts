import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchJson, toFriendlyError } from "@/lib/api.ts"
import { authorizationHeader } from "@/lib/auth-headers.ts"
import type { Product, ProductRatingsList, RatingSummary } from "@/types/catalog.ts"
import type { AuthUser } from "@/types/auth.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"

export const PRODUCT_RATING_VALUES = [1, 2, 3, 4, 5] as const

const RATING_GENERIC_MESSAGES = [
  "Authentication required",
  "You do not have permission to perform this action",
] as const

type UseProductRatingsParams = {
  productId: string
  productQueryKey: readonly unknown[]
  product?: Product | null
  user?: AuthUser | null
  isAuthenticated: boolean
  accessToken: string | null | undefined
}

type RatedEntry = ProductRatingsList["ratings"][number]

function findUserRatingEntry(
  ratingEntries: RatedEntry[],
  userRatingRaw: unknown,
  user: AuthUser | null | undefined,
): RatedEntry | null {
  if (
    typeof userRatingRaw !== "number" ||
    Number.isNaN(userRatingRaw) ||
    userRatingRaw < 1 ||
    userRatingRaw > 5
  ) {
    return null
  }

  const entryById =
    ratingEntries.find((entry) => typeof entry.id === "number" && entry.id === userRatingRaw) ??
    null

  if (entryById) {
    return entryById
  }

  if (user) {
    const normalizedFirst = user.firstName?.trim().toLowerCase() ?? ""
    const normalizedLast = user.lastName?.trim().toLowerCase() ?? ""

    const entryByName =
      ratingEntries.find((entry) => {
        const entryFirst = entry.firstName?.trim().toLowerCase() ?? ""
        const entryLast = entry.lastName?.trim().toLowerCase() ?? ""
        return (
          entry.value === userRatingRaw &&
          normalizedFirst === entryFirst &&
          normalizedLast === entryLast
        )
      }) ?? null

    if (entryByName) {
      return entryByName
    }
  }

  const matchingEntries = ratingEntries.filter(
    (entry) => entry.value === userRatingRaw && typeof entry.id === "number",
  )

  return matchingEntries.length === 1 ? matchingEntries[0] : null
}

export function useProductRatings({
  productId,
  productQueryKey,
  product,
  user,
  isAuthenticated,
  accessToken,
}: UseProductRatingsParams) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const saveRatingFallbackMessage = t("productDetail.ratings.saveError", {
    defaultValue: "We couldn't save your rating. Please try again.",
  })
  const saveRatingCodeMessages: Partial<Record<string, string>> = {
    FORBIDDEN: t("productDetail.ratings.permissionError", {
      defaultValue: "You do not have permission to rate this product.",
    }),
    UNAUTHORIZED: t("productDetail.ratings.authError", {
      defaultValue: "You need to sign in again to rate this product.",
    }),
  }
  const removeRatingFallbackMessage = t("productDetail.ratings.removeError", {
    defaultValue: "We couldn't remove your rating. Please try again.",
  })
  const removeRatingCodeMessages: Partial<Record<string, string>> = {
    ...saveRatingCodeMessages,
    NOT_FOUND: t("productDetail.ratings.notFound", {
      defaultValue: "We couldn't find that rating to remove.",
    }),
  }
  const ratingSummaryQueryKey = [
    "product",
    productId,
    "rating-summary",
    user?.id ?? "guest",
  ] as const
  const ratingListQueryKey = ["product", productId, "ratings"] as const

  const ratingSummaryQuery = useQuery<RatingSummary, Error>({
    queryKey: ratingSummaryQueryKey,
    queryFn: async () => {
      if (!accessToken) {
        throw new Error("Missing access token for rating summary request.")
      }

      return fetchJson<RatingSummary>(`products/${productId}/rating/`, {
        init: {
          headers: {
            ...authorizationHeader(accessToken),
          },
        },
      })
    },
    enabled: Boolean(productId && isAuthenticated && accessToken && user?.id),
    retry: false,
  })

  const productRatingsQuery = useQuery<ProductRatingsList, Error>({
    queryKey: ratingListQueryKey,
    queryFn: () => fetchJson<ProductRatingsList>(`products/${productId}/ratings/`),
    enabled: Boolean(productId),
  })

  const setRatingMutation = useMutation<RatingSummary, Error, number>({
    mutationFn: async (value) => {
      if (!productId) {
        throw new Error(
          t("productDetail.missingId", {
            defaultValue: "Product identifier is missing.",
          }),
        )
      }

      if (!accessToken || !isAuthenticated) {
        throw new Error(
          t("productDetail.toasts.signInToRate", {
            defaultValue: "Sign in to rate this product.",
          }),
        )
      }

      try {
        return await fetchJson<RatingSummary>(`products/${productId}/rating/`, {
          init: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authorizationHeader(accessToken),
            },
            body: JSON.stringify({ value }),
          },
        })
      } catch (mutationError) {
        throw toFriendlyError(mutationError, {
          fallback: saveRatingFallbackMessage,
          codeMessages: saveRatingCodeMessages,
          genericMessages: [...RATING_GENERIC_MESSAGES],
        })
      }
    },
    onSuccess: (updatedSummary, value) => {
      if (!productId) {
        return
      }

      queryClient.setQueryData(ratingSummaryQueryKey, updatedSummary)
      void queryClient.invalidateQueries({ queryKey: ratingListQueryKey })
      queryClient.setQueryData(productQueryKey, (existing: Product | undefined) => {
        if (!existing) {
          return existing
        }

        const nextRate = Number.isFinite(updatedSummary.rating.rate)
          ? updatedSummary.rating.rate.toFixed(2)
          : existing.rate

        return {
          ...existing,
          rate: nextRate,
          count: updatedSummary.rating.count,
        }
      })

      toast.success(
        t("productDetail.ratings.thanks", {
          defaultValue: "Thanks for rating this product {{value}} star{{suffix}}.",
          values: {
            value,
            suffix: value === 1 ? "" : "s",
          },
        }),
      )
    },
    onError: (mutationError) => {
      console.error(mutationError)
      const message =
        mutationError instanceof Error ? mutationError.message : saveRatingFallbackMessage
      toast.error(message)
    },
  })

  const deleteRatingMutation = useMutation<RatingSummary, Error, number>({
    mutationFn: async (ratingId) => {
      if (!productId) {
        throw new Error(
          t("productDetail.missingId", {
            defaultValue: "Product identifier is missing.",
          }),
        )
      }

      if (!accessToken || !isAuthenticated) {
        throw new Error(
          t("productDetail.toasts.signInToRate", {
            defaultValue: "Sign in to rate this product.",
          }),
        )
      }

      try {
        return await fetchJson<RatingSummary>(`products/${productId}/rating/`, {
          params: {
            ratingId,
          },
          init: {
            method: "DELETE",
            headers: {
              ...authorizationHeader(accessToken),
            },
          },
        })
      } catch (mutationError) {
        throw toFriendlyError(mutationError, {
          fallback: removeRatingFallbackMessage,
          codeMessages: removeRatingCodeMessages,
          genericMessages: [...RATING_GENERIC_MESSAGES],
        })
      }
    },
    onSuccess: (updatedSummary) => {
      if (!productId) {
        return
      }

      queryClient.setQueryData(ratingSummaryQueryKey, updatedSummary)
      void queryClient.invalidateQueries({ queryKey: ratingListQueryKey })
      queryClient.setQueryData(productQueryKey, (existing: Product | undefined) => {
        if (!existing) {
          return existing
        }

        const nextRate = Number.isFinite(updatedSummary.rating.rate)
          ? updatedSummary.rating.rate.toFixed(2)
          : existing.rate

        return {
          ...existing,
          rate: nextRate,
          count: updatedSummary.rating.count,
        }
      })

      toast.success(
        t("productDetail.ratings.removeSuccess", {
          defaultValue: "Your rating was removed.",
        }),
      )
    },
    onError: (mutationError) => {
      console.error(mutationError)
      const message =
        mutationError instanceof Error ? mutationError.message : removeRatingFallbackMessage
      toast.error(message)
    },
  })

  const derived = useMemo(() => {
    const ratingSummaryData = ratingSummaryQuery.data
    const ratingsData = productRatingsQuery.data
    const ratingEntries = ratingsData?.ratings ?? []
    const userRatingRaw = ratingSummaryData?.userRating ?? null

    const entry = findUserRatingEntry(ratingEntries, userRatingRaw, user)

    const userRatingId =
      entry?.id ??
      null ??
      (typeof userRatingRaw === "number" && userRatingRaw > 5 ? userRatingRaw : null)

    const currentUserRating =
      entry?.value ??
      (typeof userRatingRaw === "number" && userRatingRaw >= 1 && userRatingRaw <= 5
        ? userRatingRaw
        : null)

    const averageFromList =
      ratingsData && ratingsData.count > 0
        ? ratingsData.ratings.reduce((sum, rating) => sum + rating.value, 0) / ratingsData.count
        : null

    const productRateNumber =
      product && product.rate !== undefined ? Number.parseFloat(product.rate) : null

    const normalizedProductRate =
      productRateNumber !== null && Number.isFinite(productRateNumber) ? productRateNumber : null

    const averageRating =
      ratingSummaryData?.rating.rate ?? averageFromList ?? normalizedProductRate ?? null

    const ratingCount = ratingSummaryData?.rating.count ?? ratingsData?.count ?? product?.count ?? 0

    const formattedAverageRating =
      averageRating !== null && Number.isFinite(averageRating) ? averageRating.toFixed(1) : null

    const hasRatings = ratingCount > 0

    const pendingUserRating =
      setRatingMutation.isPending && setRatingMutation.variables !== undefined
        ? setRatingMutation.variables
        : null

    const isRemovingRating = deleteRatingMutation.isPending
    const isRatingMutating = setRatingMutation.isPending || isRemovingRating
    const highlightedUserRating = isRemovingRating
      ? 0
      : (pendingUserRating ?? currentUserRating ?? 0)

    const displayedRatings = ratingEntries.slice(0, 5)

    return {
      averageRating,
      formattedAverageRating,
      ratingCount,
      hasRatings,
      highlightedUserRating,
      currentUserRating,
      userRatingId,
      canRemoveRating: Boolean(userRatingId),
      displayedRatings,
      isRatingMutating,
      isRemovingRating,
    }
  }, [
    deleteRatingMutation.isPending,
    product,
    productRatingsQuery.data,
    ratingSummaryQuery.data,
    setRatingMutation.isPending,
    setRatingMutation.variables,
    user,
  ])

  return {
    ratingSummaryQuery,
    productRatingsQuery,
    setRatingMutation,
    deleteRatingMutation,
    ratingSummaryQueryKey,
    ratingListQueryKey,
    ...derived,
    rateProduct: (value: number) => {
      setRatingMutation.mutate(value)
    },
    removeRating: () => {
      const { userRatingId } = derived
      if (!userRatingId) {
        void productRatingsQuery.refetch()
        toast.error(
          t("productDetail.ratings.localNotFound", {
            defaultValue: "We couldn't find your rating to remove. Please refresh and try again.",
          }),
        )
        return
      }
      deleteRatingMutation.mutate(userRatingId)
    },
  }
}

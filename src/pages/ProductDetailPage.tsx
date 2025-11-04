import { Link, useNavigate, useParams } from "react-router"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { fetchJson } from "@/lib/api.ts"
import { authorizationHeader } from "@/lib/auth-headers.ts"
import { Spinner } from "@/components/ui/spinner.tsx"
import type {
  Product,
  ProductRatingsList,
  RatingSummary,
} from "@/types/catalog.ts"
import useAuth from "@/hooks/useAuth.ts"
import useCart from "@/hooks/useCart.ts"
import { toast } from "sonner"
import { Star } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx"

const RATING_VALUES = [1, 2, 3, 4, 5] as const

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    accessToken,
    user,
  } = useAuth()
  const { addItem, isUpdating: isCartUpdating } = useCart()
  const queryClient = useQueryClient()
  const normalizedProductId = productId ?? ""
  const userId = user?.id

  const productQueryKey = ["product", normalizedProductId] as const
  const ratingSummaryQueryKey = [
    "product",
    normalizedProductId,
    "rating-summary",
    userId ?? "guest",
  ] as const
  const ratingListQueryKey = [
    "product",
    normalizedProductId,
    "ratings",
  ] as const

  const {
    data: product,
    isPending,
    error,
  } = useQuery<Product, Error>({
    queryKey: productQueryKey,
    queryFn: () => fetchJson<Product>(`products/${normalizedProductId}/`),
    enabled: Boolean(normalizedProductId),
  })

  const ratingSummaryQuery = useQuery<RatingSummary, Error>({
    queryKey: ratingSummaryQueryKey,
    queryFn: async () => {
      if (!accessToken) {
        throw new Error("Missing access token for rating summary request.")
      }

      return fetchJson<RatingSummary>(`products/${normalizedProductId}/rating/`, {
        init: {
          headers: {
            ...authorizationHeader(accessToken),
          },
        },
      })
    },
    enabled: Boolean(
      normalizedProductId && isAuthenticated && accessToken && userId,
    ),
    retry: false,
  })

  const productRatingsQuery = useQuery<ProductRatingsList, Error>({
    queryKey: ratingListQueryKey,
    queryFn: () =>
      fetchJson<ProductRatingsList>(`products/${normalizedProductId}/ratings/`),
    enabled: Boolean(normalizedProductId),
  })

  const setRatingMutation = useMutation<RatingSummary, Error, number>({
    mutationFn: async (value) => {
      if (!normalizedProductId) {
        throw new Error("Missing product identifier.")
      }

      if (!accessToken || !isAuthenticated) {
        throw new Error("You need to sign in to rate this product.")
      }

      try {
        return await fetchJson<RatingSummary>(
          `products/${normalizedProductId}/rating/`,
          {
            init: {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authorizationHeader(accessToken),
              },
              body: JSON.stringify({ value }),
            },
          },
        )
      } catch (mutationError) {
        if (mutationError instanceof Error) {
          const message = mutationError.message.includes("403")
            ? "You do not have permission to rate this product."
            : mutationError.message.includes("401")
              ? "You need to sign in again to rate this product."
              : "We couldn't save your rating. Please try again."

          throw new Error(message)
        }

        throw mutationError
      }
    },
    onSuccess: (updatedSummary, value) => {
      if (!normalizedProductId) {
        return
      }

      queryClient.setQueryData(ratingSummaryQueryKey, updatedSummary)
      void queryClient.invalidateQueries({ queryKey: ratingListQueryKey })
      queryClient.setQueryData(
        productQueryKey,
        (existing: Product | undefined) => {
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
        },
      )

      toast.success(
        `Thanks for rating this product ${value} star${value === 1 ? "" : "s"}.`,
      )
    },
    onError: (mutationError) => {
      console.error(mutationError)
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "We couldn't save your rating. Please try again."
      toast.error(message)
    },
  })

  const deleteRatingMutation = useMutation<RatingSummary, Error, number>({
    mutationFn: async (ratingId) => {
      if (!normalizedProductId) {
        throw new Error("Missing product identifier.")
      }

      if (!accessToken || !isAuthenticated) {
        throw new Error("You need to sign in to update your rating.")
      }

      try {
        return await fetchJson<RatingSummary>(
          `products/${normalizedProductId}/rating/`,
          {
            params: {
              ratingId,
            },
            init: {
              method: "DELETE",
              headers: {
                ...authorizationHeader(accessToken),
              },
            },
          },
        )
      } catch (mutationError) {
        if (mutationError instanceof Error) {
          const message = mutationError.message.includes("404")
            ? "We couldn't find that rating to remove."
            : mutationError.message.includes("401")
              ? "You need to sign in again to update your rating."
              : "We couldn't remove your rating. Please try again."

          throw new Error(message)
        }

        throw mutationError
      }
    },
    onSuccess: (updatedSummary) => {
      if (!normalizedProductId) {
        return
      }

      queryClient.setQueryData(ratingSummaryQueryKey, updatedSummary)
      void queryClient.invalidateQueries({ queryKey: ratingListQueryKey })
      queryClient.setQueryData(
        productQueryKey,
        (existing: Product | undefined) => {
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
        },
      )

      toast.success("Your rating was removed.")
    },
    onError: (mutationError) => {
      console.error(mutationError)
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "We couldn't remove your rating. Please try again."
      toast.error(message)
    },
  })

  const ratingSummaryData = ratingSummaryQuery.data
  const ratingsData = productRatingsQuery.data
  const averageFromList =
    ratingsData && ratingsData.count > 0
      ? ratingsData.ratings.reduce((sum, entry) => sum + entry.value, 0) /
        ratingsData.count
      : null
  const productRateNumber =
    product && product.rate !== undefined
      ? Number.parseFloat(product.rate)
      : null
  const normalizedProductRate =
    productRateNumber !== null && Number.isFinite(productRateNumber)
      ? productRateNumber
      : null
  const averageRating =
    ratingSummaryData?.rating.rate ??
    (averageFromList ?? normalizedProductRate ?? null)
  const ratingCount =
    ratingSummaryData?.rating.count ??
    ratingsData?.count ??
    (product?.count ?? 0)
  const ratingEntries = ratingsData?.ratings ?? []
  const userRatingRaw = ratingSummaryData?.userRating ?? null
  const primaryCategory = product?.categories?.[0] ?? null
  const primaryCategoryLink = primaryCategory
    ? `/?category=${encodeURIComponent(primaryCategory.name)}`
    : null
  // Reconcile the current user's rating so we can highlight and allow removal.
  let userRatingEntry =
    ratingEntries.find(
      (entry) =>
        typeof userRatingRaw === "number" &&
        entry.id === userRatingRaw,
    ) ?? null

  if (
    !userRatingEntry &&
    typeof userRatingRaw === "number" &&
    userRatingRaw >= 1 &&
    userRatingRaw <= 5 &&
    user
  ) {
    const normalizedFirst = user.firstName?.trim().toLowerCase() ?? ""
    const normalizedLast = user.lastName?.trim().toLowerCase() ?? ""

    userRatingEntry =
      ratingEntries.find((entry) => {
        const entryFirst = entry.firstName?.trim().toLowerCase() ?? ""
        const entryLast = entry.lastName?.trim().toLowerCase() ?? ""
        return (
          entry.value === userRatingRaw &&
          normalizedFirst === entryFirst &&
          normalizedLast === entryLast
        )
      }) ?? null
  }

  if (
    !userRatingEntry &&
    typeof userRatingRaw === "number" &&
    userRatingRaw >= 1 &&
    userRatingRaw <= 5
  ) {
    const matchingEntries = ratingEntries.filter(
      (entry) =>
        entry.value === userRatingRaw && typeof entry.id === "number",
    )

    if (matchingEntries.length === 1) {
      userRatingEntry = matchingEntries[0]
    }
  }

  const userRatingId =
    (userRatingEntry?.id ?? null) ??
    (typeof userRatingRaw === "number" && userRatingRaw > 5
      ? userRatingRaw
      : null)

  const currentUserRating =
    userRatingEntry?.value ??
    (typeof userRatingRaw === "number" && userRatingRaw >= 1 && userRatingRaw <= 5
      ? userRatingRaw
      : null)

  const displayedRatings = ratingEntries.slice(0, 5)
  const formattedAverageRating =
    averageRating !== null && Number.isFinite(averageRating)
      ? averageRating.toFixed(1)
      : null
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
  const canRemoveRating = Boolean(userRatingId)

  if (!normalizedProductId) {
    return (
      <main className="bg-background">
        <section className="page-section mx-auto flex w-full max-w-4xl flex-col gap-6 px-6">
          <Button asChild variant="outline" className="w-fit">
            <Link to="/">← Back to products</Link>
          </Button>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Product identifier is missing.
          </div>
        </section>
      </main>
    )
  }

  const handleAddToCart = (currentProduct: Product) => {
    if (!isAuthenticated) {
      toast.info("Sign in to add items to your cart.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/login"),
        },
      })
      return
    }

    void addItem(currentProduct.id, 1)
      .then(() => {
        toast.success(`Added "${currentProduct.title}" to your cart.`)
      })
      .catch((addError) => {
        console.error(addError)
        toast.error(
          addError instanceof Error
            ? addError.message
            : "We couldn't add that product to your cart.",
        )
      })
  }

  const handleRateProduct = (value: number) => {
    if (!normalizedProductId) {
      return
    }

    if (!isAuthenticated) {
      toast.info("Sign in to rate this product.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/login"),
        },
      })
      return
    }

    if (isRatingMutating) {
      return
    }

    setRatingMutation.mutate(value)
  }

  const handleRemoveRating = () => {
    if (!normalizedProductId) {
      return
    }

    if (!isAuthenticated) {
      toast.info("Sign in to rate this product.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/login"),
        },
      })
      return
    }

    if (isRatingMutating) {
      return
    }

    if (!userRatingId) {
      void productRatingsQuery.refetch()
      toast.error("We couldn't find your rating to remove. Please refresh and try again.")
      return
    }

    deleteRatingMutation.mutate(userRatingId)
  }

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-4xl flex-col gap-6 px-6">
        <Button asChild variant="outline" className="w-fit">
          <Link to="/">← Back to products</Link>
        </Button>

        {isPending ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Spinner className="size-6" />
            <span>Loading product details...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : product ? (
          <>
            <Breadcrumb className="w-full">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Products</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {primaryCategory && primaryCategoryLink ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={primaryCategoryLink}>{primaryCategory.name}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                ) : null}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Card className="overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
                <div className="bg-muted/20">
                  <img
                    alt={product.title}
                    src={product.image}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-3xl font-semibold">
                      {product.title}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {product.categories.length > 0 ? (
                        product.categories.map((category) => (
                          <span
                            key={category.id}
                            className="rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No categories assigned
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-semibold text-primary">
                        ${product.price}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasRatings && formattedAverageRating
                          ? `${formattedAverageRating} average · ${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"}`
                          : "No ratings yet"}
                      </p>
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      size="lg"
                      disabled={isAuthLoading || isCartUpdating}
                      onClick={() => handleAddToCart(product)}
                    >
                      {isCartUpdating ? "Updating cart..." : "Add to cart"}
                    </Button>
                    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 text-primary">
                          {RATING_VALUES.map((value) => {
                            const isFilled =
                              averageRating !== null && averageRating >= value - 0.25

                            return (
                              <Star
                                key={`average-${value}`}
                                className="size-5"
                                strokeWidth={1.5}
                                fill={isFilled ? "currentColor" : "transparent"}
                                aria-hidden="true"
                              />
                            )
                          })}
                        </div>
                        <span className="text-lg font-semibold">
                          {formattedAverageRating ?? "No ratings yet"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {hasRatings
                            ? `${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"}`
                            : "Be the first to rate"}
                        </span>
                        {(ratingSummaryQuery.isFetching ||
                          productRatingsQuery.isFetching) && (
                          <Spinner className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      {isAuthenticated ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Your rating</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {RATING_VALUES.map((value) => (
                              <button
                                key={`select-${value}`}
                                type="button"
                                className="rounded-md p-1 transition hover:text-primary focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/40 disabled:cursor-not-allowed"
                                onClick={() => handleRateProduct(value)}
                                disabled={isRatingMutating}
                                aria-label={`Rate this product ${value} star${value === 1 ? "" : "s"}`}
                              >
                                <Star
                                  className="size-6"
                                  strokeWidth={1.5}
                                  fill={
                                    value <= highlightedUserRating
                                      ? "currentColor"
                                      : "transparent"
                                  }
                                />
                              </button>
                            ))}
                            {isRatingMutating && (
                              <Spinner className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {isRemovingRating ? (
                              <span>Removing your rating...</span>
                            ) : currentUserRating !== null ? (
                              <span>
                                You rated this product {currentUserRating} star
                                {currentUserRating === 1 ? "" : "s"}.
                              </span>
                            ) : canRemoveRating ? (
                              <span>You rated this product.</span>
                            ) : (
                              <span>Select a star rating.</span>
                            )}
                            {canRemoveRating && (
                              <button
                                type="button"
                                className="font-medium text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
                                onClick={handleRemoveRating}
                                disabled={isRatingMutating}
                              >
                                {isRemovingRating ? "Removing..." : "Remove rating"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                          Sign in to rate this product.
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          What shoppers are saying
                        </p>
                        {productRatingsQuery.isPending ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Spinner className="size-4" />
                            <span>Loading ratings...</span>
                          </div>
                        ) : productRatingsQuery.error ? (
                          <p className="text-xs text-destructive">
                            Unable to load ratings right now.
                          </p>
                        ) : displayedRatings.length > 0 ? (
                          <ul className="space-y-2">
                            {displayedRatings.map((entry) => {
                              const name =
                                [entry.firstName, entry.lastName]
                                  .filter(
                                    (part) =>
                                      typeof part === "string" &&
                                      part.trim().length > 0,
                                  )
                                  .join(" ") || "Anonymous shopper"

                              return (
                                <li
                                  key={`${entry.id ?? "rating"}-${entry.updatedAt ?? entry.createdAt ?? entry.value}`}
                                  className="flex flex-col gap-1 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{name}</span>
                                    <div className="flex items-center gap-1 text-primary">
                                      {RATING_VALUES.map((value) => (
                                        <Star
                                          key={`entry-${entry.id ?? "rating"}-${value}`}
                                          className="size-4"
                                          strokeWidth={1.5}
                                          fill={
                                            value <= entry.value
                                              ? "currentColor"
                                              : "transparent"
                                          }
                                        />
                                      ))}
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {entry.value}/5
                                      </span>
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No ratings yet. Be the first to leave a rating.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Product not found.
          </div>
        )}
      </section>
    </main>
  )
}

import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import { fetchJson } from "@/lib/api.ts"
import useAuth from "@/hooks/useAuth.ts"
import useCart from "@/hooks/useCart.ts"
import { toast } from "sonner"
import { showSignInPrompt } from "@/components/auth/showSignInPrompt.tsx"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx"
import ProductOverviewCard from "@/components/product/ProductOverviewCard.tsx"
import ProductRatingsCard from "@/components/product/ProductRatingsCard.tsx"
import { useProductRatings } from "@/hooks/useProductRatings.ts"
import type { Product } from "@/types/catalog.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"

const productQueryKeyFor = (productId: string, language: string) =>
  ["product", productId, language] as const

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const normalizedProductId = productId ?? ""
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading, accessToken, user } = useAuth()
  const { addItem, isUpdating: isCartUpdating } = useCart()
  const [quantity, setQuantity] = useState(1)
  const { t, language } = useTranslation()
  useEffect(() => {
    setQuantity(1)
  }, [normalizedProductId])

  const productQueryKey = productQueryKeyFor(normalizedProductId, language)

  const {
    data: product,
    isPending,
    error,
  } = useQuery<Product, Error>({
    queryKey: productQueryKey,
    queryFn: () => fetchJson<Product>(`products/${normalizedProductId}/`),
    enabled: Boolean(normalizedProductId),
  })

  const ratingsState = useProductRatings({
    productId: normalizedProductId,
    productQueryKey,
    product,
    user,
    isAuthenticated,
    accessToken,
  })

  const primaryCategory = product?.categories?.[0] ?? null
  const primaryCategoryLink = primaryCategory
    ? `/?category=${encodeURIComponent(primaryCategory.name)}`
    : null

  if (!normalizedProductId) {
    return (
      <main className="bg-background">
        <section className="page-section mx-auto flex w-full max-w-4xl flex-col gap-6 px-6">
          <Button asChild variant="outline" className="w-fit">
            <Link to="/">
              {t("productDetail.backToProducts", {
                defaultValue: "← Back to products",
              })}
            </Link>
          </Button>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("productDetail.missingId", {
              defaultValue: "Product identifier is missing.",
            })}
          </div>
        </section>
      </main>
    )
  }

  const handleAddToCart = (currentProduct: Product) => {
    if (!isAuthenticated) {
      showSignInPrompt({
        message: t("products.toasts.signInRequired", {
          defaultValue: "Sign in to add items to your cart.",
        }),
        actionLabel: t("products.toasts.signInAction", {
          defaultValue: "Sign in",
        }),
        onSignIn: () => navigate("/login"),
      })
      return
    }

    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.trunc(quantity)) : 1

    void addItem(currentProduct.id, normalizedQuantity)
      .then(() => {
        toast.success(
          t("products.toasts.addToCartWithQuantity", {
            defaultValue: 'Added {{count}} of "{{product}}" to your cart.',
            values: {
              count: normalizedQuantity,
              product: currentProduct.title,
            },
          }),
        )
      })
      .catch((addError) => {
        console.error(addError)
        toast.error(
          addError instanceof Error
            ? addError.message
            : t("products.toasts.addToCartError", {
                defaultValue: "We couldn't add that product to your cart.",
              }),
        )
      })
  }

  const handleRateProduct = (value: number) => {
    if (!normalizedProductId) {
      return
    }

    if (!isAuthenticated) {
      showSignInPrompt({
        message: t("productDetail.toasts.signInToRate", {
          defaultValue: "Sign in to rate this product.",
        }),
        actionLabel: t("products.toasts.signInAction", {
          defaultValue: "Sign in",
        }),
        onSignIn: () => navigate("/login"),
      })
      return
    }

    if (ratingsState.isRatingMutating) {
      return
    }

    ratingsState.rateProduct(value)
  }

  const handleRemoveRating = () => {
    if (!normalizedProductId) {
      return
    }

    if (!isAuthenticated) {
      showSignInPrompt({
        message: t("productDetail.toasts.signInToRate", {
          defaultValue: "Sign in to rate this product.",
        }),
        actionLabel: t("products.toasts.signInAction", {
          defaultValue: "Sign in",
        }),
        onSignIn: () => navigate("/login"),
      })
      return
    }

    if (ratingsState.isRatingMutating) {
      return
    }

    ratingsState.removeRating()
  }

  const ratingPanel = (
    <ProductRatingsCard
      averageRating={ratingsState.averageRating}
      formattedAverageRating={ratingsState.formattedAverageRating}
      ratingCount={ratingsState.ratingCount}
      hasRatings={ratingsState.hasRatings}
      isSummaryFetching={
        ratingsState.ratingSummaryQuery.isFetching || ratingsState.productRatingsQuery.isFetching
      }
      ratingsQueryState={{
        isPending: ratingsState.productRatingsQuery.isPending,
        isFetching: ratingsState.productRatingsQuery.isFetching,
        error: ratingsState.productRatingsQuery.error ?? null,
      }}
      displayedRatings={ratingsState.displayedRatings}
      isAuthenticated={isAuthenticated}
      highlightedUserRating={ratingsState.highlightedUserRating}
      currentUserRating={ratingsState.currentUserRating}
      canRemoveRating={ratingsState.canRemoveRating}
      isRatingMutating={ratingsState.isRatingMutating}
      isRemovingRating={ratingsState.isRemovingRating}
      onRate={handleRateProduct}
      onRemove={handleRemoveRating}
    />
  )

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-4xl flex-col gap-6 px-6">
        <Button asChild variant="outline" className="w-fit">
          <Link to="/">
            {t("productDetail.backToProducts", {
              defaultValue: "← Back to products",
            })}
          </Link>
        </Button>

        {isPending ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Spinner className="size-6" />
            <span>
              {t("productDetail.loading", {
                defaultValue: "Loading product details...",
              })}
            </span>
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
                    <Link to="/">{t("navigation.products", { defaultValue: "Products" })}</Link>
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

            <ProductOverviewCard
              product={product}
              formattedAverageRating={ratingsState.formattedAverageRating}
              ratingCount={ratingsState.ratingCount}
              hasRatings={ratingsState.hasRatings}
              onAddToCart={() => handleAddToCart(product)}
              isAddToCartDisabled={isAuthLoading || isCartUpdating}
              isAddToCartProcessing={isCartUpdating}
              quantity={quantity}
              onQuantityChange={setQuantity}
              isQuantityDisabled={isCartUpdating}
              ratingPanel={ratingPanel}
            />
          </>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("productDetail.notFound", {
              defaultValue: "Product not found.",
            })}
          </div>
        )}
      </section>
    </main>
  )
}

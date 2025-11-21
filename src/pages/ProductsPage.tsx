import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import PaginationControls from "@/components/pagination/PaginationControls.tsx"
import ProductCatalogHeader from "@/components/products/ProductCatalogHeader.tsx"
import ProductResultsSummary from "@/components/products/ProductResultsSummary.tsx"
import ProductGrid from "@/components/products/ProductGrid.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import { useProductCatalog, PRODUCTS_PAGE_SIZE } from "@/hooks/useProductCatalog.ts"
import useAuth from "@/hooks/useAuth.ts"
import useCart from "@/hooks/useCart.ts"
import type { Product } from "@/types/catalog.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"
import { toast } from "sonner"
import { showSignInPrompt } from "@/components/auth/showSignInPrompt.tsx"

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [pendingAddProductId, setPendingAddProductId] = useState<number | null>(null)
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { addItem } = useCart()
  const { t } = useTranslation()

  const selectedCategoryParam = searchParams.get("category")
  const selectedCategory =
    selectedCategoryParam && selectedCategoryParam !== "all" ? selectedCategoryParam : null

  const catalog = useProductCatalog({ page, selectedCategory })

  const categories = catalog.categories
  const categoryValue = selectedCategory ?? "all"
  const selectedCategoryLabel = selectedCategory
    ? (categories.find((category) => category.slug === selectedCategory)?.name ??
      selectedCategory)
    : null

  useEffect(() => {
    if (!selectedCategory) {
      return
    }

    const matchingCategory = categories.find(
      (category) => category.name === selectedCategory && category.slug !== selectedCategory,
    )

    if (!matchingCategory) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("category", matchingCategory.slug)
    setSearchParams(nextParams, { replace: true })
  }, [categories, searchParams, selectedCategory, setSearchParams])

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    if (page > catalog.totalPages) {
      setPage(catalog.totalPages)
    }
  }, [page, catalog.totalPages])

  const hasScrolledInitialRef = useRef(false)
  const addToCartPendingRef = useRef(false)

  useEffect(() => {
    if (!hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true
      return
    }
    scrollToTop()
  }, [page, scrollToTop])

  const handleCategoryChange = (value: string) => {
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)

    if (value === "all") {
      nextParams.delete("category")
    } else {
      nextParams.set("category", value)
    }

    setSearchParams(nextParams, { replace: true })
    scrollToTop()
  }

  const handleAddToCart = (product: Product) => {
    if (addToCartPendingRef.current) {
      return
    }

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

    addToCartPendingRef.current = true
    setPendingAddProductId(product.id)

    void addItem(product.id, 1)
      .then(() => {
        toast.success(
          t("products.toasts.addToCartSuccess", {
            defaultValue: 'Added "{{product}}" to your cart.',
            values: { product: product.title },
          }),
        )
      })
      .catch((error) => {
        console.error(error)
        toast.error(
          error instanceof Error
            ? error.message
            : t("products.toasts.addToCartError", {
                defaultValue: "We couldn't add that product to your cart.",
              }),
        )
      })
      .finally(() => {
        addToCartPendingRef.current = false
        setPendingAddProductId((current) => (current === product.id ? null : current))
      })
  }

  const showPagination =
    catalog.products.length > 0 &&
    (catalog.totalPages > 1 || catalog.canGoPrevious || catalog.canGoNext)

  const summaryVisible =
    !catalog.isInitialLoading && !catalog.errorMessage && catalog.products.length > 0

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
        <ProductCatalogHeader
          categories={categories}
          selectedCategoryValue={categoryValue}
          onCategoryChange={handleCategoryChange}
          isLoadingCategories={catalog.isLoadingCategories}
        />

        {catalog.isRefetching ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            <span>
              {t("products.summary.updating", {
                defaultValue: "Updating products…",
              })}
            </span>
          </div>
        ) : null}

        <ProductResultsSummary
          isVisible={summaryVisible}
          firstItem={catalog.firstItemIndex}
          lastItem={catalog.displayLastItemIndex}
          totalCount={catalog.formattedTotalCount}
          summaryLabel={
            selectedCategoryLabel
              ? t("products.summary.categoryLabel", {
                  defaultValue: "{{category}} products",
                  values: { category: selectedCategoryLabel },
                })
              : t("products.summary.genericLabel", {
                  defaultValue: "products",
                })
          }
        />

        <ProductGrid
          products={catalog.products}
          isInitialLoading={catalog.isInitialLoading}
          errorMessage={catalog.errorMessage}
          emptyMessage={t("products.grid.empty", {
            defaultValue: "No products found for the selected filters.",
          })}
          onAddToCart={handleAddToCart}
          isAddToCartDisabled={isAuthLoading}
          activeAddToCartProductId={pendingAddProductId}
          pageSize={PRODUCTS_PAGE_SIZE}
        />

        {showPagination ? (
          <div className="flex flex-col gap-4 border-t pt-6">
            <PaginationControls
              currentPage={page}
              totalPages={catalog.totalPages}
              canGoPrevious={catalog.canGoPrevious}
              canGoNext={catalog.canGoNext}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </main>
  )
}

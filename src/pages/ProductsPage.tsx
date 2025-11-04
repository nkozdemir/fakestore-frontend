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
import type { Category, Product } from "@/types/catalog.ts"
import { toast } from "sonner"

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { addItem, isUpdating: isCartUpdating } = useCart()

  const selectedCategoryParam = searchParams.get("category")
  const selectedCategory =
    selectedCategoryParam && selectedCategoryParam !== "all"
      ? selectedCategoryParam
      : null

  const catalog = useProductCatalog({ page, selectedCategory })

  const categories = catalog.categoriesQuery.data ?? []
  const categoryValue = selectedCategory ?? "all"
  const selectedCategoryLabel = selectedCategory
    ? categories.find((category: Category) => category.name === selectedCategory)?.name ??
      selectedCategory
    : null

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
    if (!isAuthenticated) {
      toast.info("Sign in to add items to your cart.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/login"),
        },
      })
      return
    }

    void addItem(product.id, 1)
      .then(() => {
        toast.success(`Added "${product.title}" to your cart.`)
      })
      .catch((error) => {
        console.error(error)
        toast.error(
          error instanceof Error
            ? error.message
            : "We couldn't add that product to your cart.",
        )
      })
  }

  const showPagination =
    catalog.products.length > 0 &&
    (catalog.totalPages > 1 || catalog.canGoPrevious || catalog.canGoNext)

  const summaryVisible =
    !catalog.isInitialLoading &&
    !catalog.errorMessage &&
    catalog.products.length > 0

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
        <ProductCatalogHeader
          categories={categories}
          selectedCategoryValue={categoryValue}
          onCategoryChange={handleCategoryChange}
          isLoadingCategories={catalog.categoriesQuery.isPending}
        />

        {catalog.isRefetching ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            <span>Updating products…</span>
          </div>
        ) : null}

        <ProductResultsSummary
          isVisible={summaryVisible}
          firstItem={catalog.firstItemIndex}
          lastItem={catalog.displayLastItemIndex}
          totalCount={catalog.formattedTotalCount}
          summaryLabel={
            selectedCategoryLabel
              ? `${selectedCategoryLabel} products`
              : "products"
          }
        />

        <ProductGrid
          products={catalog.products}
          isInitialLoading={catalog.isInitialLoading}
          errorMessage={catalog.errorMessage}
          emptyMessage="No products found for the selected filters."
          onAddToCart={handleAddToCart}
          isAddToCartDisabled={isAuthLoading || isCartUpdating}
          isAddToCartProcessing={isCartUpdating}
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

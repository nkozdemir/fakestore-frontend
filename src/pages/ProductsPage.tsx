import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import { Skeleton } from "@/components/ui/skeleton.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import PaginationControls from "@/components/pagination/PaginationControls.tsx"
import { fetchJson } from "@/lib/api.ts"
import type { Category, ProductResponse } from "@/types/catalog.ts"
import useAuth from "@/hooks/useAuth.ts"
import useCart from "@/hooks/useCart.ts"
import { toast } from "sonner"

const PAGE_SIZE = 8
const TITLE_CHAR_LIMIT = 60
const DESCRIPTION_CHAR_LIMIT = 160

function shortenText(value: string, limit: number): string {
  const normalized = value.trim()

  if (normalized.length <= limit) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`
}

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

  const {
    data: productsData,
    isPending: isPendingProducts,
    isFetching: isFetchingProducts,
    error: productsError,
  } = useQuery<ProductResponse, Error>({
    queryKey: ["products", { limit: PAGE_SIZE, page, category: selectedCategory }],
    queryFn: () =>
      fetchJson<ProductResponse>("products/", {
        params: {
          limit: PAGE_SIZE,
          page,
          category: selectedCategory ?? undefined,
        },
      }),
    keepPreviousData: true,
  })

  const {
    data: categoriesData,
    isPending: isPendingCategories,
    error: categoriesError,
  } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () => fetchJson<Category[]>("categories/"),
  })

  const products = productsData?.results ?? []
  const categories = categoriesData ?? []
  const rawCount = productsData?.count
  const normalizedCount =
    rawCount === undefined || rawCount === null ? undefined : Number(rawCount)
  const fallbackItemsCount = (page - 1) * PAGE_SIZE + products.length
  const hasExplicitCount =
    typeof normalizedCount === "number" &&
    Number.isFinite(normalizedCount) &&
    normalizedCount >= fallbackItemsCount
  const totalCount = hasExplicitCount
    ? normalizedCount
    : fallbackItemsCount + (productsData?.next ? PAGE_SIZE : 0)
  const totalPages = hasExplicitCount
    ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    : Math.max(1, page + (productsData?.next ? 1 : 0))

  const canGoPrevious = page > 1 || Boolean(productsData?.previous)
  const canGoNext =
    Boolean(productsData?.next) || (hasExplicitCount && page < totalPages)

  const isInitialProductsLoading = isPendingProducts && !productsData
  const isRefetchingProducts = isFetchingProducts && !isInitialProductsLoading
  const errorMessage = productsError?.message ?? categoriesError?.message ?? null

  const categoryValue = selectedCategory ?? "all"
  const selectedCategoryLabel = selectedCategory
    ? categories.find((category) => category.name === selectedCategory)?.name ??
      selectedCategory
    : null

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

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

  const handleAddToCart = (productId: number, productTitle: string) => {
    if (!isAuthenticated) {
      toast.info("Sign in to add items to your cart.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/login"),
        },
      })
      return
    }

    void addItem(productId, 1)
      .then(() => {
        toast.success(`Added "${productTitle}" to your cart.`)
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
    products.length > 0 && (totalPages > 1 || canGoPrevious || canGoNext)
  const firstItemIndex = (page - 1) * PAGE_SIZE + 1
  const lastItemIndex = firstItemIndex + products.length - 1
  const displayLastItemIndex = hasExplicitCount
    ? Math.min(lastItemIndex, totalCount)
    : lastItemIndex
  const displayTotalCount = hasExplicitCount
    ? totalCount
    : Math.max(displayLastItemIndex, fallbackItemsCount)
  const formattedTotalCount = Math.max(0, Math.round(displayTotalCount))

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Products
            </h1>
            <p className="text-muted-foreground">
              Discover curated picks from our Fakestore catalog.
            </p>
          </div>
          <Select
            value={categoryValue}
            onValueChange={handleCategoryChange}
            disabled={isPendingCategories}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue
                placeholder={
                  isPendingCategories ? "Loading categories..." : "All categories"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        {isRefetchingProducts && !isInitialProductsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            <span>Updating products…</span>
          </div>
        ) : null}

        {!isInitialProductsLoading && !errorMessage && products.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing {firstItemIndex.toLocaleString()}–
              {displayLastItemIndex.toLocaleString()} of{" "}
              {formattedTotalCount.toLocaleString()}{" "}
              {selectedCategoryLabel
                ? `${selectedCategoryLabel} products`
                : "products"}
            </span>
          </div>
        ) : null}

        {isInitialProductsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Card key={`product-skeleton-${index}`} className="flex h-full flex-col">
                <CardHeader className="gap-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex h-60 items-center justify-center overflow-hidden rounded-lg border bg-muted/10">
                    <Skeleton className="h-52 w-52" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter className="mt-auto flex items-center justify-between gap-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No products found for the selected filters.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const shortenedTitle = shortenText(product.title, TITLE_CHAR_LIMIT)
              const shortenedDescription = shortenText(
                product.description,
                DESCRIPTION_CHAR_LIMIT,
              )

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group block h-full"
                >
                  <Card className="flex h-full flex-col transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg">
                    <CardHeader className="gap-1">
                      <CardTitle className="text-xl font-semibold">
                        <span title={product.title}>{shortenedTitle}</span>
                      </CardTitle>
                      <CardDescription>
                        {product.rate
                          ? `Rated ${product.rate}`
                          : "Rating unavailable"}{" "}
                        • {product.count ?? 0} reviews
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex h-60 items-center justify-center overflow-hidden rounded-lg border bg-muted/10">
                      <img
                        alt={product.title}
                        src={product.image}
                        className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                      <p
                        className="text-sm text-muted-foreground"
                        title={product.description}
                      >
                        {shortenedDescription}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-lg font-semibold">
                        ${product.price}
                      </span>
                      <Button
                        size="sm"
                        disabled={isAuthLoading || isCartUpdating}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          handleAddToCart(product.id, product.title)
                        }}
                      >
                        Add to cart
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {showPagination ? (
          <div className="flex flex-col gap-4 border-t pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {isRefetchingProducts ? (
                <div className="flex items-center gap-2 text-xs">
                  <Spinner className="size-3.5" />
                  <span>Refreshing…</span>
                </div>
              ) : null}
            </div>
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              onPageChange={(nextPage) => {
                setPage(nextPage)
              }}
            />
          </div>
        ) : null}
      </section>
    </main>
  )
}

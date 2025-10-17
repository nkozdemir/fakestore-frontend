import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import { Skeleton } from "@/components/ui/skeleton.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import { fetchJson } from "@/lib/api.ts"
import { cn } from "@/lib/utils.ts"
import type { Category, ProductResponse } from "@/types/catalog.ts"

const PAGE_SIZE = 5

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginationItems = useMemo<(number | "ellipsis")[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (page <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages]
    }

    if (page >= totalPages - 2) {
      return [
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages]
  }, [page, totalPages])

  const handleCategoryChange = (value: string) => {
    setPage(1)
    if (value === "all") {
      setSelectedCategory(null)
      return
    }

    setSelectedCategory(value)
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
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Card key={`product-skeleton-${index}`} className="flex h-full flex-col">
                <CardHeader className="gap-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <Skeleton className="h-60 w-full" />
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="flex h-full flex-col">
                <CardHeader className="gap-1">
                  <CardTitle className="text-xl font-semibold">
                    {product.title}
                  </CardTitle>
                  <CardDescription>
                    {product.rate
                      ? `Rated ${product.rate}`
                      : "Rating unavailable"}{" "}
                    • {product.count ?? 0} reviews
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="overflow-hidden rounded-lg border bg-muted/20">
                    <img
                      alt={product.title}
                      src={product.image}
                      className="h-60 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto flex items-center justify-between gap-4">
                  <span className="text-lg font-semibold">${product.price}</span>
                  <Button asChild>
                    <Link to={`/products/${product.id}`}>View details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (canGoPrevious) {
                        setPage((current) => Math.max(1, current - 1))
                      }
                    }}
                    className={cn(
                      !canGoPrevious && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={!canGoPrevious}
                  />
                </PaginationItem>
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        onClick={(event) => {
                          event.preventDefault()
                          if (item !== page) {
                            setPage(item)
                          }
                        }}
                        isActive={item === page}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (canGoNext) {
                        setPage((current) => current + 1)
                      }
                    }}
                    className={cn(
                      !canGoNext && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={!canGoNext}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </section>
    </main>
  )
}

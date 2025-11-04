import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api.ts"
import type { Category, ProductResponse } from "@/types/catalog.ts"

export const PRODUCTS_PAGE_SIZE = 8

export type UseProductCatalogParams = {
  page: number
  selectedCategory: string | null
}

export function useProductCatalog({
  page,
  selectedCategory,
}: UseProductCatalogParams) {
  const productsQuery = useQuery<ProductResponse, Error>({
    queryKey: [
      "products",
      { limit: PRODUCTS_PAGE_SIZE, page, category: selectedCategory },
    ],
    queryFn: () =>
      fetchJson<ProductResponse>("products/", {
        params: {
          limit: PRODUCTS_PAGE_SIZE,
          page,
          category: selectedCategory ?? undefined,
        },
      }),
    keepPreviousData: true,
  })

  const categoriesQuery = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () => fetchJson<Category[]>("categories/"),
  })

  const computed = useMemo(() => {
    const products = productsQuery.data?.results ?? []
    const rawCount = productsQuery.data?.count
    const normalizedCount =
      rawCount === undefined || rawCount === null ? undefined : Number(rawCount)
    const fallbackItemsCount = (page - 1) * PRODUCTS_PAGE_SIZE + products.length
    const hasExplicitCount =
      typeof normalizedCount === "number" &&
      Number.isFinite(normalizedCount) &&
      normalizedCount >= fallbackItemsCount
    const totalCount = hasExplicitCount
      ? normalizedCount
      : fallbackItemsCount + (productsQuery.data?.next ? PRODUCTS_PAGE_SIZE : 0)
    const totalPages = hasExplicitCount
      ? Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE))
      : Math.max(1, page + (productsQuery.data?.next ? 1 : 0))

    const canGoPrevious = page > 1 || Boolean(productsQuery.data?.previous)
    const canGoNext =
      Boolean(productsQuery.data?.next) || (hasExplicitCount && page < totalPages)

    const isInitialLoading = productsQuery.isPending && !productsQuery.data
    const isRefetching = productsQuery.isFetching && !isInitialLoading
    const errorMessage =
      productsQuery.error?.message ?? categoriesQuery.error?.message ?? null

    const firstItemIndex = (page - 1) * PRODUCTS_PAGE_SIZE + 1
    const lastItemIndex = firstItemIndex + products.length - 1
    const displayLastItemIndex = hasExplicitCount
      ? Math.min(lastItemIndex, totalCount)
      : lastItemIndex
    const displayTotalCount = hasExplicitCount
      ? totalCount
      : Math.max(displayLastItemIndex, fallbackItemsCount)
    const formattedTotalCount = Math.max(0, Math.round(displayTotalCount))

    return {
      products,
      totalPages,
      totalCount,
      canGoPrevious,
      canGoNext,
      isInitialLoading,
      isRefetching,
      errorMessage,
      firstItemIndex,
      displayLastItemIndex,
      formattedTotalCount,
    }
  }, [
    categoriesQuery.error?.message,
    page,
    productsQuery.data,
    productsQuery.error,
    productsQuery.isPending,
    productsQuery.isFetching,
  ])

  return {
    productsQuery,
    categoriesQuery,
    ...computed,
  }
}

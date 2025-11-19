import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api.ts"
import type { Category, CategoryFilterOption, ProductResponse } from "@/types/catalog.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"
import { fallbackLanguage } from "@/i18n/translations.ts"

export const PRODUCTS_PAGE_SIZE = 8

export type UseProductCatalogParams = {
  page: number
  selectedCategory: string | null
}

export function useProductCatalog({ page, selectedCategory }: UseProductCatalogParams) {
  const { language } = useTranslation()
  const shouldUseCanonicalCategories = language !== fallbackLanguage
  const productQueryKey = [
    "products",
    { limit: PRODUCTS_PAGE_SIZE, page, category: selectedCategory, language },
  ] as const

  const productsQuery = useQuery<ProductResponse, Error, ProductResponse, typeof productQueryKey>({
    queryKey: productQueryKey,
    queryFn: () =>
      fetchJson<ProductResponse>("products/", {
        params: {
          limit: PRODUCTS_PAGE_SIZE,
          page,
          category: selectedCategory ?? undefined,
        },
      }),
    placeholderData: (previousData): ProductResponse | undefined => previousData ?? undefined,
  })

  const categoriesQuery = useQuery<Category[], Error>({
    queryKey: ["categories", language] as const,
    queryFn: () => fetchJson<Category[]>("categories/"),
  })

  const canonicalCategoriesQuery = useQuery<Category[], Error>({
    queryKey: ["categories", "canonical", fallbackLanguage] as const,
    queryFn: () =>
      fetchJson<Category[]>("categories/", {
        params: { lang: fallbackLanguage },
        init: { headers: { "Accept-Language": fallbackLanguage } },
      }),
    enabled: shouldUseCanonicalCategories,
  })

  const categories = useMemo<CategoryFilterOption[]>(() => {
    const localizedCategories = categoriesQuery.data ?? []

    if (localizedCategories.length === 0) {
      return []
    }

    if (shouldUseCanonicalCategories) {
      const canonicalCategories = canonicalCategoriesQuery.data ?? []
      if (canonicalCategories.length === 0) {
        return []
      }

      const canonicalById = new Map<number, string>(
        canonicalCategories.map((category) => [category.id, category.name]),
      )

      return localizedCategories.map((category) => ({
        ...category,
        slug: canonicalById.get(category.id) ?? category.name,
      }))
    }

    return localizedCategories.map((category) => ({
      ...category,
      slug: category.name,
    }))
  }, [categoriesQuery.data, canonicalCategoriesQuery.data, shouldUseCanonicalCategories])

  const isLoadingCategories =
    categoriesQuery.isPending ||
    (shouldUseCanonicalCategories && canonicalCategoriesQuery.isPending)

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
    const canGoNext = Boolean(productsQuery.data?.next) || (hasExplicitCount && page < totalPages)

    const isInitialLoading = productsQuery.isPending && !productsQuery.data
    const isRefetching = productsQuery.isFetching && !isInitialLoading
    const errorMessage =
      productsQuery.error?.message ??
      categoriesQuery.error?.message ??
      canonicalCategoriesQuery.error?.message ??
      null

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
    canonicalCategoriesQuery.error?.message,
    page,
    productsQuery.data,
    productsQuery.error,
    productsQuery.isPending,
    productsQuery.isFetching,
  ])

  return {
    productsQuery,
    categoriesQuery,
    canonicalCategoriesQuery,
    categories,
    isLoadingCategories,
    ...computed,
  }
}

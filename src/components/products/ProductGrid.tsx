import ProductCard from "@/components/products/ProductCard.tsx"
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton.tsx"
import type { Product } from "@/types/catalog.ts"

export type ProductGridProps = {
  products: Product[]
  isInitialLoading: boolean
  errorMessage: string | null
  emptyMessage: string
  onAddToCart: (product: Product) => void
  isAddToCartDisabled: boolean
  isAddToCartProcessing: boolean
  pageSize: number
}

export default function ProductGrid({
  products,
  isInitialLoading,
  errorMessage,
  emptyMessage,
  onAddToCart,
  isAddToCartDisabled,
  isAddToCartProcessing,
  pageSize,
}: ProductGridProps) {
  if (isInitialLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: pageSize }).map((_, index) => (
          <ProductCardSkeleton key={`product-skeleton-${index}`} />
        ))}
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {errorMessage}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          isAddToCartDisabled={isAddToCartDisabled}
          isAddToCartProcessing={isAddToCartProcessing}
        />
      ))}
    </div>
  )
}

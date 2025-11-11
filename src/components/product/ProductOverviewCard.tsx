import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Button } from "@/components/ui/button.tsx"
import type { Product } from "@/types/catalog.ts"
import QuantityStepper from "@/components/cart/QuantityStepper.tsx"
import { useTranslation } from "@/context/I18nProvider.tsx"

type ProductOverviewCardProps = {
  product: Product
  formattedAverageRating: string | null
  ratingCount: number
  hasRatings: boolean
  onAddToCart: () => void
  isAddToCartDisabled: boolean
  isAddToCartProcessing: boolean
  quantity: number
  onQuantityChange: (nextQuantity: number) => void
  isQuantityDisabled?: boolean
  ratingPanel: ReactNode
}

export default function ProductOverviewCard({
  product,
  formattedAverageRating,
  ratingCount,
  hasRatings,
  onAddToCart,
  isAddToCartDisabled,
  isAddToCartProcessing,
  quantity,
  onQuantityChange,
  isQuantityDisabled = false,
  ratingPanel,
}: ProductOverviewCardProps) {
  const { t, formatCurrency, locale } = useTranslation()
  const parsedPrice = Number.parseFloat(product.price)
  const formattedPrice = Number.isNaN(parsedPrice) ? product.price : formatCurrency(parsedPrice)
  const ratingLabel =
    hasRatings && formattedAverageRating
      ? t("productDetail.overview.ratingSummary", {
          defaultValue: "{{rating}} average · {{count}} {{label}}",
          values: {
            rating: formattedAverageRating,
            count: ratingCount.toLocaleString(locale),
            label:
              ratingCount === 1
                ? t("productDetail.overview.ratingLabelSingular", {
                    defaultValue: "rating",
                  })
                : t("productDetail.overview.ratingLabelPlural", {
                    defaultValue: "ratings",
                  }),
          },
        })
      : t("productDetail.overview.ratingUnavailable", {
          defaultValue: "No ratings yet",
        })

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        <div className="flex items-center justify-center bg-muted/20 p-4">
          <img
            alt={product.title}
            src={product.image}
            className="max-h-full max-w-full object-contain object-center"
            loading="lazy"
          />
        </div>
        <div>
          <CardHeader className="gap-2">
            <CardTitle className="text-3xl font-semibold">{product.title}</CardTitle>
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
                  {t("productDetail.overview.noCategories", {
                    defaultValue: "No categories assigned",
                  })}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-primary">{formattedPrice}</p>
              <p className="text-sm text-muted-foreground">{ratingLabel}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                className="w-full sm:w-auto"
                size="lg"
                disabled={isAddToCartDisabled}
                onClick={onAddToCart}
                data-testid="product-detail-add-button"
                data-product-id={product.id}
              >
                {isAddToCartProcessing
                  ? t("products.actions.updatingCart", {
                      defaultValue: "Updating cart...",
                    })
                  : t("products.actions.addToCart", {
                      defaultValue: "Add to cart",
                    })}
              </Button>
              <QuantityStepper
                value={quantity}
                onChange={onQuantityChange}
                disabled={isQuantityDisabled}
                testId="product-detail-quantity"
              />
            </div>
            {ratingPanel}
          </CardContent>
        </div>
      </div>
    </Card>
  )
}

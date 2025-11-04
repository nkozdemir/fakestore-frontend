import { Link } from "react-router"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { truncateText } from "@/lib/string.ts"
import type { Product } from "@/types/catalog.ts"

const TITLE_CHAR_LIMIT = 60
const DESCRIPTION_CHAR_LIMIT = 160

export type ProductCardProps = {
  product: Product
  onAddToCart: (product: Product) => void
  isAddToCartDisabled: boolean
  isAddToCartProcessing: boolean
}

export default function ProductCard({
  product,
  onAddToCart,
  isAddToCartDisabled,
  isAddToCartProcessing,
}: ProductCardProps) {
  const shortenedTitle = truncateText(product.title, TITLE_CHAR_LIMIT)
  const shortenedDescription = truncateText(
    product.description,
    DESCRIPTION_CHAR_LIMIT,
  )

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <Card className="flex h-full flex-col transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg">
        <CardHeader className="gap-1">
          <CardTitle className="text-xl font-semibold">
            <span title={product.title}>{shortenedTitle}</span>
          </CardTitle>
          <CardDescription>
            {product.rate ? `Rated ${product.rate}` : "Rating unavailable"}{" "}
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
          <p className="text-sm text-muted-foreground" title={product.description}>
            {shortenedDescription}
          </p>
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">${product.price}</span>
          <Button
            size="sm"
            disabled={isAddToCartDisabled}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onAddToCart(product)
            }}
          >
            {isAddToCartProcessing ? "Updating cart..." : "Add to cart"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

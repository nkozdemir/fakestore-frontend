import { Link, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { fetchJson } from "@/lib/api.ts"
import { Spinner } from "@/components/ui/spinner.tsx"
import type { Product } from "@/types/catalog.ts"
import useAuth from "@/hooks/useAuth.ts"
import useCart from "@/hooks/useCart.ts"
import { toast } from "sonner"

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { addItem, isUpdating: isCartUpdating } = useCart()
  const normalizedProductId = productId ?? ""

  const {
    data: product,
    isPending,
    error,
  } = useQuery<Product, Error>({
    queryKey: ["product", normalizedProductId],
    queryFn: () => fetchJson<Product>(`products/${normalizedProductId}/`),
    enabled: Boolean(normalizedProductId),
  })

  if (!normalizedProductId) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
          <Button asChild variant="outline" className="w-fit">
            <Link to="/">← Back to products</Link>
          </Button>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Product identifier is missing.
          </div>
        </section>
      </main>
    )
  }

  const handleAddToCart = (currentProduct: Product) => {
    if (!isAuthenticated) {
      toast.info("Sign in to add items to your cart.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/login"),
        },
      })
      return
    }

    void addItem(currentProduct.id, 1)
      .then(() => {
        toast.success(`Added “${currentProduct.title}” to your cart.`)
      })
      .catch((addError) => {
        console.error(addError)
        toast.error(
          addError instanceof Error
            ? addError.message
            : "We couldn’t add that product to your cart.",
        )
      })
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Button asChild variant="outline" className="w-fit">
          <Link to="/">← Back to products</Link>
        </Button>

        {isPending ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Spinner className="size-6" />
            <span>Loading product details...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : product ? (
          <Card className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
              <div className="bg-muted/20">
                <img
                  alt={product.title}
                  src={product.image}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <CardHeader className="gap-2">
                  <CardTitle className="text-3xl font-semibold">
                    {product.title}
                  </CardTitle>
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
                        No categories assigned
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Rating: {product.rate ?? "N/A"} ({product.count ?? 0} reviews)
                    </p>
                    <p className="text-2xl font-semibold text-primary">
                      ${product.price}
                    </p>
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    size="lg"
                    disabled={isAuthLoading || isCartUpdating}
                    onClick={() => handleAddToCart(product)}
                  >
                    {isCartUpdating ? "Updating cart..." : "Add to cart"}
                  </Button>
                </CardContent>
              </div>
            </div>
          </Card>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Product not found.
          </div>
        )}
      </section>
    </main>
  )
}

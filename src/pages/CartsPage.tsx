import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { Spinner } from "@/components/ui/spinner.tsx"
import QuantityStepper from "@/components/cart/QuantityStepper.tsx"
import { Trash2Icon } from "lucide-react"
import useCart from "@/hooks/useCart.ts"
import { toast } from "sonner"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

export default function CartsPage() {
  const {
    cart,
    isLoading,
    isRefetching,
    error,
    totalItems,
    updateItemQuantity,
    removeItem,
    isUpdating,
    refetch,
  } = useCart()

  const rawItems = cart?.items
  const cartItems = Array.isArray(rawItems) ? rawItems : []

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number.parseFloat(item.product.price ?? "0")
    if (Number.isNaN(price)) {
      return sum
    }
    return sum + price * item.quantity
  }, 0)

  const hasItems = cartItems.length > 0

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-5xl flex-col gap-6 px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your Cart
          </h1>
          <p className="text-muted-foreground">
            Review the items you&apos;ve added before checking out.
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Spinner className="size-6" />
            <span>Loading your cart...</span>
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>We couldn&apos;t load your cart</CardTitle>
              <CardDescription>
                {error.message || "Something went wrong while loading your cart."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  void refetch().catch((fetchError) => {
                    console.error(fetchError)
                    toast.error(
                      fetchError instanceof Error
                        ? fetchError.message
                        : "Failed to reload your cart.",
                    )
                  })
                }}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Retrying…
                  </span>
                ) : (
                  "Try again"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : !hasItems ? (
          <Card>
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
              <CardDescription>
                Browse products and add items to see them appear here.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              When you add items from the catalog they&apos;ll show up here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {isRefetching ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Spinner className="size-3.5" />
                  <span>Refreshing cart…</span>
                </div>
              ) : null}
              {isUpdating ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Spinner className="size-3.5" />
                  <span>Applying your changes…</span>
                </div>
              ) : null}
              {cartItems.map((item) => {
                const price = Number.parseFloat(item.product.price ?? "0")
                const itemTotal = Number.isNaN(price)
                  ? 0
                  : price * item.quantity

                return (
                  <Card key={item.product.id}>
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex w-full gap-4">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-muted/20">
                          <img
                            alt={item.product.title}
                            src={item.product.image}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <h2 className="text-lg font-medium">
                                {item.product.title}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(Number.isNaN(price) ? 0 : price)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={isUpdating || isRefetching}
                              onClick={() => {
                                void removeItem(item.product.id)
                                  .then(() => {
                                    toast.success("Removed item from cart.")
                                  })
                                  .catch((removeError) => {
                                    console.error(removeError)
                                    toast.error(
                                      removeError instanceof Error
                                        ? removeError.message
                                        : "Failed to remove item from cart.",
                                    )
                                  })
                              }}
                              aria-label={`Remove ${item.product.title} from cart`}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Quantity</span>
                              <QuantityStepper
                                value={item.quantity}
                                disabled={isUpdating || isRefetching}
                                onChange={(nextQuantity) => {
                                  void updateItemQuantity(item.product.id, nextQuantity)
                                    .then(() => {
                                      toast.success("Updated cart quantity.")
                                    })
                                    .catch((updateError) => {
                                      console.error(updateError)
                                      toast.error(
                                        updateError instanceof Error
                                          ? updateError.message
                                          : "Failed to update quantity.",
                                      )
                                    })
                                }}
                              />
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(itemTotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
                <CardDescription>
                  You have {totalItems} {totalItems === 1 ? "item" : "items"} in your
                  cart.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex w-full items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!hasItems}
                  onClick={() => {
                    toast.info("Ordering isn’t available yet. Please check back soon!")
                  }}
                >
                  Place order
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Order placement will be available once checkout is ready.
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </section>
    </main>
  )
}

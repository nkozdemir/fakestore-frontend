import { useEffect, useRef } from "react"
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
import { useTranslation } from "@/hooks/useTranslation.ts"

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
  const { t, formatCurrency, locale } = useTranslation()
  const applyingToastIdRef = useRef<string | number | null>(null)

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

  useEffect(() => {
    if (isUpdating) {
      if (applyingToastIdRef.current) {
        return
      }

      applyingToastIdRef.current = toast.loading(
        t("cart.banners.applying", {
          defaultValue: "Applying your changes…",
        }),
        {
          duration: Infinity,
        },
      )
      return
    }

    if (applyingToastIdRef.current) {
      toast.dismiss(applyingToastIdRef.current)
      applyingToastIdRef.current = null
    }
  }, [isUpdating, t])

  useEffect(() => {
    return () => {
      if (applyingToastIdRef.current) {
        toast.dismiss(applyingToastIdRef.current)
        applyingToastIdRef.current = null
      }
    }
  }, [])

  return (
    <main className="bg-background">
      <section className="page-section mx-auto flex w-full max-w-5xl flex-col gap-6 px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("cart.title", { defaultValue: "Your Cart" })}
          </h1>
          <p className="text-muted-foreground">
            {t("cart.subtitle", {
              defaultValue: "Review the items you've added before checking out.",
            })}
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Spinner className="size-6" />
            <span>
              {t("cart.loading", {
                defaultValue: "Loading your cart...",
              })}
            </span>
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("cart.reloadErrorTitle", {
                  defaultValue: "We couldn't load your cart",
                })}
              </CardTitle>
              <CardDescription>
                {error.message ||
                  t("cart.reloadErrorFallback", {
                    defaultValue: "Something went wrong while loading your cart.",
                  })}
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
                        : t("cart.reloadErrorRetry", {
                            defaultValue: "Failed to reload your cart.",
                          }),
                    )
                  })
                }}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    {t("cart.retrying", { defaultValue: "Retrying…" })}
                  </span>
                ) : (
                  t("common.actions.retry", { defaultValue: "Try again" })
                )}
              </Button>
            </CardContent>
          </Card>
        ) : !hasItems ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("cart.empty.title", { defaultValue: "Your cart is empty" })}</CardTitle>
              <CardDescription>
                {t("cart.empty.description", {
                  defaultValue: "Browse products and add items to see them appear here.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("cart.empty.hint", {
                defaultValue: "When you add items from the catalog they'll show up here.",
              })}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {isRefetching ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Spinner className="size-3.5" />
                  <span>
                    {t("cart.banners.refreshing", {
                      defaultValue: "Refreshing cart…",
                    })}
                  </span>
                </div>
              ) : null}
              {cartItems.map((item) => {
                const price = Number.parseFloat(item.product.price ?? "0")
                const itemTotal = Number.isNaN(price) ? 0 : price * item.quantity

                return (
                  <Card
                    key={item.product.id}
                    data-testid="cart-item-card"
                    data-product-id={item.product.id}
                  >
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex w-full gap-4">
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/20 p-2">
                          <img
                            alt={item.product.title}
                            src={item.product.image}
                            className="max-h-full max-w-full object-contain object-center"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <h2 className="text-lg font-medium">{item.product.title}</h2>
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
                                    toast.success(
                                      t("cart.item.removeSuccess", {
                                        defaultValue: "Removed item from cart.",
                                      }),
                                    )
                                  })
                                  .catch((removeError) => {
                                    console.error(removeError)
                                    toast.error(
                                      removeError instanceof Error
                                        ? removeError.message
                                        : t("cart.item.removeError", {
                                            defaultValue: "Failed to remove item from cart.",
                                          }),
                                    )
                                  })
                              }}
                              aria-label={t("cart.item.removeAria", {
                                defaultValue: 'Remove "{{product}}" from cart',
                                values: { product: item.product.title },
                              })}
                              data-testid="cart-item-remove"
                              data-product-id={item.product.id}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {t("cart.quantity.label", {
                                  defaultValue: "Quantity",
                                })}
                              </span>
                              <QuantityStepper
                                value={item.quantity}
                                disabled={isUpdating || isRefetching}
                                onChange={(nextQuantity) => {
                                  void updateItemQuantity(item.product.id, nextQuantity)
                                    .then(() => {
                                      toast.success(
                                        t("cart.item.updateSuccess", {
                                          defaultValue: "Updated cart quantity.",
                                        }),
                                      )
                                    })
                                    .catch((updateError) => {
                                      console.error(updateError)
                                      toast.error(
                                        updateError instanceof Error
                                          ? updateError.message
                                          : t("cart.item.updateError", {
                                              defaultValue: "Failed to update quantity.",
                                            }),
                                      )
                                    })
                                }}
                                testId={`cart-item-${item.product.id}-quantity`}
                              />
                            </div>
                            <div className="text-sm font-medium">{formatCurrency(itemTotal)}</div>
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
                <CardTitle>{t("cart.summary.title", { defaultValue: "Order summary" })}</CardTitle>
                <CardDescription>
                  {t("cart.summary.description", {
                    defaultValue: "You have {{count}} {{items}} in your cart.",
                    values: {
                      count: totalItems.toLocaleString(locale),
                      items:
                        totalItems === 1
                          ? t("cart.summary.itemSingular", { defaultValue: "item" })
                          : t("cart.summary.itemPlural", { defaultValue: "items" }),
                    },
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>{t("cart.summary.subtotal", { defaultValue: "Subtotal" })}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("cart.summary.shipping", { defaultValue: "Shipping" })}</span>
                  <span>
                    {t("cart.summary.shippingNote", {
                      defaultValue: "Calculated at checkout",
                    })}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex w-full items-center justify-between text-sm font-semibold">
                  <span>{t("cart.summary.total", { defaultValue: "Total" })}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!hasItems}
                  onClick={() => {
                    toast.info(
                      t("cart.summary.orderUnavailable", {
                        defaultValue: "Ordering isn’t available yet. Please check back soon!",
                      }),
                    )
                  }}
                >
                  {t("cart.summary.placeOrder", { defaultValue: "Place order" })}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t("cart.summary.disabledHint", {
                    defaultValue: "Order placement will be available once checkout is ready.",
                  })}
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </section>
    </main>
  )
}

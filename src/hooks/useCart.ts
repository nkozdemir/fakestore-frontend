import { useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { fetchJson, toFriendlyError } from "@/lib/api.ts"
import useAuth from "@/hooks/useAuth.ts"
import { optionalAuthorizationHeader } from "@/lib/auth-headers.ts"
import type { Cart, CartItem, CartPatchPayload } from "@/types/cart.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"

const cartQueryKey = (userId: number | undefined, language: string): QueryKey => [
  "cart",
  userId ?? "guest",
  language,
]

const normalizeCartItems = (items: Cart["items"]): CartItem[] =>
  Array.isArray(items) ? items : []

const mergeCartItemsWithExistingOrder = (
  nextItems: CartItem[],
  previousItems: CartItem[],
): CartItem[] => {
  if (previousItems.length === 0) {
    return nextItems
  }

  const nextById = new Map<number, CartItem>()
  for (const item of nextItems) {
    nextById.set(item.product.id, item)
  }

  const ordered: CartItem[] = []

  for (const previousItem of previousItems) {
    const updated = nextById.get(previousItem.product.id)
    if (!updated) {
      continue
    }
    ordered.push(updated)
    nextById.delete(previousItem.product.id)
  }

  if (nextById.size === 0) {
    return ordered
  }

  for (const item of nextItems) {
    if (!nextById.has(item.product.id)) {
      continue
    }
    ordered.push(item)
    nextById.delete(item.product.id)
  }

  return ordered
}

export default function useCart() {
  const { user, accessToken, isAuthenticated } = useAuth()
  const { t, language } = useTranslation()
  const cartUpdateFallbackMessage = t("cart.messages.updateFailed", {
    defaultValue: "Failed to update cart. Please try again.",
  })
  const cartValidationMessage = t("cart.messages.validationFailed", {
    defaultValue: "We couldn’t apply those cart changes. Please review and try again.",
  })
  const queryClient = useQueryClient()

  const userId = user?.id
  const fetchCart = useCallback(async (): Promise<Cart> => {
    if (!userId || !accessToken) {
      throw new Error(
        t("cart.messages.accessRequired", {
          defaultValue: "You need to be signed in to access the cart.",
        }),
      )
    }

    const rawCart = await fetchJson<Cart | Cart[]>("carts/", {
      params: {
        userId,
      },
      init: {
        headers: {
          ...optionalAuthorizationHeader(accessToken),
        },
      },
    })

    const cart = Array.isArray(rawCart) ? rawCart[0] : rawCart

    if (!cart) {
      throw new Error(
        t("cart.messages.notFound", {
          defaultValue: "Unable to locate your cart.",
        }),
      )
    }

    return {
      ...cart,
      items: normalizeCartItems(cart.items),
    }
  }, [accessToken, t, userId])

  const cartQuery = useQuery<Cart, Error>({
    queryKey: cartQueryKey(userId, language),
    queryFn: fetchCart,
    enabled: Boolean(isAuthenticated && userId && accessToken),
    staleTime: 0,
  })

  const ensureCartData = useCallback(async () => {
    const cachedCart = cartQuery.data

    if (cachedCart?.id) {
      return cachedCart
    }

    const fetchedCart = await fetchCart()
    queryClient.setQueryData(cartQueryKey(userId, language), fetchedCart)
    return fetchedCart
  }, [cartQuery.data, fetchCart, language, queryClient, userId])

  const patchCartMutation = useMutation<Cart, Error, CartPatchPayload>({
    mutationFn: async (payload) => {
      if (!userId || !accessToken) {
        throw new Error(
          t("cart.messages.updateRequired", {
            defaultValue: "You need to be signed in to update the cart.",
          }),
        )
      }

      if (!payload || (!payload.add && !payload.update && !payload.remove)) {
        throw new Error(
          t("cart.messages.missingChanges", {
            defaultValue: "No cart changes were provided.",
          }),
        )
      }

      const cart = await ensureCartData()

      try {
        const updatedCart = await fetchJson<Cart>(`carts/${cart.id}/`, {
          init: {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...optionalAuthorizationHeader(accessToken),
            },
            body: JSON.stringify(payload satisfies CartPatchPayload),
          },
        })

        const normalizedItems = normalizeCartItems(updatedCart.items)
        const normalizedCart: Cart = {
          ...updatedCart,
          items: normalizedItems,
        }

        const previousItems = normalizeCartItems(cart.items)
        const mergedItems = mergeCartItemsWithExistingOrder(normalizedItems, previousItems)

        return {
          ...normalizedCart,
          items: mergedItems,
        }
      } catch (mutationError) {
        throw toFriendlyError(mutationError, {
          fallback: cartUpdateFallbackMessage,
          codeMessages: {
            VALIDATION_ERROR: cartValidationMessage,
          },
        })
      }
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey(userId, language), updatedCart)
    },
  })

  const addItem = useCallback(
    async (productId: number, quantity = 1) => {
      const normalizedQuantity = Math.max(1, Math.trunc(quantity))
      const cart = await ensureCartData()

      const currentItems = Array.isArray(cart.items) ? cart.items : []
      const existingItem = currentItems.find((item) => item.product.id === productId)

      if (existingItem) {
        const nextQuantity = existingItem.quantity + normalizedQuantity
        return patchCartMutation.mutateAsync({
          update: [
            {
              product_id: productId,
              quantity: nextQuantity,
            },
          ],
        })
      }

      return patchCartMutation.mutateAsync({
        add: [
          {
            product_id: productId,
            quantity: normalizedQuantity,
          },
        ],
      })
    },
    [ensureCartData, patchCartMutation, t],
  )

  const removeItem = useCallback(
    async (productId: number) => {
      const cart = await ensureCartData()
      const currentItems = Array.isArray(cart.items) ? cart.items : []

      const isInCart = currentItems.some((item) => item.product.id === productId)

      if (!isInCart) {
        throw new Error(
          t("cart.messages.itemMissing", {
            defaultValue: "The selected item is not in your cart.",
          }),
        )
      }

      return patchCartMutation.mutateAsync({
        remove: [productId],
      })
    },
    [ensureCartData, patchCartMutation, t],
  )

  const updateItemQuantity = useCallback(
    async (productId: number, quantity: number) => {
      const normalizedQuantity = Math.trunc(quantity)

      if (Number.isNaN(normalizedQuantity)) {
        throw new Error(
          t("cart.messages.quantityInvalid", {
            defaultValue: "Quantity must be a valid number.",
          }),
        )
      }

      if (normalizedQuantity <= 0) {
        return removeItem(productId)
      }

      const cart = await ensureCartData()
      const currentItems = Array.isArray(cart.items) ? cart.items : []

      const isInCart = currentItems.some((item) => item.product.id === productId)

      if (!isInCart) {
        throw new Error(
          t("cart.messages.itemMissing", {
            defaultValue: "The selected item is not in your cart.",
          }),
        )
      }

      return patchCartMutation.mutateAsync({
        update: [
          {
            product_id: productId,
            quantity: normalizedQuantity,
          },
        ],
      })
    },
    [ensureCartData, patchCartMutation, removeItem, t],
  )

  const clearCart = useCallback(async () => {
    const cart = await ensureCartData()
    const currentItems = Array.isArray(cart.items) ? cart.items : []

    if (currentItems.length === 0) {
      return cart
    }

    return patchCartMutation.mutateAsync({
      remove: currentItems.map((item) => item.product.id),
    })
  }, [ensureCartData, patchCartMutation])

  const totalItems = useMemo(() => {
    return cartQuery.data?.items?.reduce((sum, item) => sum + Math.max(0, item.quantity), 0) ?? 0
  }, [cartQuery.data?.items])

  return {
    cart: cartQuery.data ?? null,
    isLoading: cartQuery.isPending,
    isRefetching: cartQuery.isFetching,
    error: cartQuery.error ?? null,
    totalItems,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    isUpdating: patchCartMutation.isPending,
    lastUpdatedCart: patchCartMutation.data ?? null,
    refetch: cartQuery.refetch,
  }
}

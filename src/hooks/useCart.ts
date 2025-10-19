import { useCallback, useMemo } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query"
import { buildApiUrl, fetchJson } from "@/lib/api.ts"
import useAuth from "@/hooks/useAuth.ts"
import type { Cart, CartPatchPayload } from "@/types/cart.ts"

const cartQueryKey = (userId?: number): QueryKey => ["cart", userId ?? "guest"]

function createAuthorizationHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function useCart() {
  const { user, accessToken, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const userId = user?.id

  const fetchCart = useCallback(async (): Promise<Cart> => {
    if (!userId || !accessToken) {
      throw new Error("You need to be signed in to access the cart.")
    }

    const rawCart = await fetchJson<Cart | Cart[]>("carts/", {
      params: {
        userId,
      },
      init: {
        headers: {
          ...createAuthorizationHeader(accessToken),
        },
      },
    })

    const cart = Array.isArray(rawCart) ? rawCart[0] : rawCart

    if (!cart) {
      throw new Error("Unable to locate your cart.")
    }

    return {
      ...cart,
      items: Array.isArray(cart.items) ? cart.items : [],
    }
  }, [accessToken, userId])

  const cartQuery = useQuery<Cart, Error>({
    queryKey: cartQueryKey(userId),
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
    queryClient.setQueryData(cartQueryKey(userId), fetchedCart)
    return fetchedCart
  }, [cartQuery.data, fetchCart, queryClient, userId])

  const patchCartMutation = useMutation<Cart, Error, CartPatchPayload>({
    mutationFn: async (payload) => {
      if (!userId || !accessToken) {
        throw new Error("You need to be signed in to update the cart.")
      }

      if (!payload || (!payload.add && !payload.update && !payload.remove)) {
        throw new Error("No cart changes were provided.")
      }

      const cart = await ensureCartData()

      const response = await fetch(buildApiUrl(`carts/${cart.id}/`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...createAuthorizationHeader(accessToken),
        },
        body: JSON.stringify(payload satisfies CartPatchPayload),
      })

      if (!response.ok) {
        const detail = await response.text().catch(() => "")
        throw new Error(
          detail
            ? `Failed to update cart: ${detail}`
            : "Failed to update cart. Please try again.",
        )
      }

      const updatedCart = (await response.json()) as Cart

      const normalizedCart: Cart = {
        ...updatedCart,
        items: Array.isArray(updatedCart.items) ? updatedCart.items : [],
      }

      return normalizedCart
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey(userId), updatedCart)
    },
  })

  const addItem = useCallback(
    async (productId: number, quantity = 1) => {
      const normalizedQuantity = Math.max(1, Math.trunc(quantity))
      const cart = await ensureCartData()

      const currentItems = Array.isArray(cart.items) ? cart.items : []
      const existingItem = currentItems.find(
        (item) => item.product.id === productId,
      )

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
    [ensureCartData, patchCartMutation],
  )

  const removeItem = useCallback(
    async (productId: number) => {
      const cart = await ensureCartData()
      const currentItems = Array.isArray(cart.items) ? cart.items : []

      const isInCart = currentItems.some(
        (item) => item.product.id === productId,
      )

      if (!isInCart) {
        throw new Error("The selected item is not in your cart.")
      }

      return patchCartMutation.mutateAsync({
        remove: [productId],
      })
    },
    [ensureCartData, patchCartMutation],
  )

  const updateItemQuantity = useCallback(
    async (productId: number, quantity: number) => {
      const normalizedQuantity = Math.trunc(quantity)

      if (Number.isNaN(normalizedQuantity)) {
        throw new Error("Quantity must be a valid number.")
      }

      if (normalizedQuantity <= 0) {
        return removeItem(productId)
      }

      const cart = await ensureCartData()
      const currentItems = Array.isArray(cart.items) ? cart.items : []

      const isInCart = currentItems.some(
        (item) => item.product.id === productId,
      )

      if (!isInCart) {
        throw new Error("The selected item is not in your cart.")
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
    [ensureCartData, patchCartMutation, removeItem],
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
    return (
      cartQuery.data?.items?.reduce(
        (sum, item) => sum + Math.max(0, item.quantity),
        0,
      ) ?? 0
    )
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

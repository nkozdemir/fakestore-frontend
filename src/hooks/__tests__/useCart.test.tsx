import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import { AuthContext, type AuthContextValue } from "@/context/auth-context.ts"
import useCart from "@/hooks/useCart.ts"
import type { Cart, CartItem, CartPatchPayload } from "@/types/cart.ts"
import type { Product } from "@/types/catalog.ts"
import { server } from "@/test/msw-server.ts"

const API_BASE_URL = "http://localhost:8000/api/"

const defaultProduct = (id: number): Product => ({
  id,
  title: `Product ${id}`,
  price: "12.34",
  description: "Sample product",
  image: "https://example.com/image.png",
  rate: "4.5",
  count: 10,
  categories: [],
})

const defaultAuthValue = (): AuthContextValue => ({
  user: {
    id: 1,
    username: "janedoe",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    lastLogin: null,
    dateJoined: "2020-01-01T00:00:00Z",
    isStaff: false,
    isSuperuser: false,
    phone: undefined,
    addresses: [],
  },
  accessToken: "access-token",
  refreshToken: "refresh-token",
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
})

function cloneCart(cart: Cart): Cart {
  return {
    ...cart,
    items:
      cart.items?.map((item) => ({
        product: { ...item.product },
        quantity: item.quantity,
      })) ?? [],
  }
}

function applyCartPatch(cart: Cart, payload: CartPatchPayload) {
  const itemsMap = new Map<number, CartItem>()
  const currentItems = Array.isArray(cart.items) ? cart.items : []

  currentItems.forEach((item) => {
    itemsMap.set(item.product.id, { product: { ...item.product }, quantity: item.quantity })
  })

  payload.add?.forEach(({ product_id, quantity }) => {
    const existing = itemsMap.get(product_id)
    if (existing) {
      existing.quantity += quantity
    } else {
      itemsMap.set(product_id, {
        product: defaultProduct(product_id),
        quantity,
      })
    }
  })

  payload.update?.forEach(({ product_id, quantity }) => {
    const existing = itemsMap.get(product_id)
    if (existing) {
      existing.quantity = quantity
    }
  })

  if (payload.remove) {
    payload.remove.forEach((id) => itemsMap.delete(id))
  }

  cart.items = Array.from(itemsMap.values())
}

function setupCartHandlers(cart: Cart, patchSpy?: CartPatchPayload[]) {
  server.use(
    http.get(`${API_BASE_URL}carts/`, () => HttpResponse.json([cloneCart(cart)])),
    http.patch(`${API_BASE_URL}carts/${cart.id}/`, async ({ request }) => {
      const payload = (await request.json()) as CartPatchPayload
      applyCartPatch(cart, payload)
      patchSpy?.push(payload)
      return HttpResponse.json(cloneCart(cart))
    }),
  )
}

function createWrapper(authOverrides: Partial<AuthContextValue> = {}): {
  wrapper: ({ children }: { children: ReactNode }) => JSX.Element
  queryClient: QueryClient
} {
  const authValue = {
    ...defaultAuthValue(),
    ...authOverrides,
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  )

  return { wrapper: Wrapper, queryClient }
}

describe("useCart", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("adds an item to the cart and updates the total count", async () => {
    const cartState: Cart = {
      id: 10,
      user_id: 1,
      date: "2024-01-01",
      items: [],
    }
    setupCartHandlers(cartState)
    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => {
      expect(result.current.cart).not.toBeNull()
    })

    await act(async () => {
      await result.current.addItem(101, 2)
    })

    await waitFor(() => {
      expect(result.current.totalItems).toBe(2)
    })

    expect(result.current.cart?.items).toEqual([
      {
        product: expect.objectContaining({ id: 101 }),
        quantity: 2,
      },
    ])

    queryClient.clear()
  })

  it("removes an item and updates totals accordingly", async () => {
    const cartState: Cart = {
      id: 11,
      user_id: 1,
      date: "2024-01-02",
      items: [
        {
          product: defaultProduct(101),
          quantity: 2,
        },
        {
          product: defaultProduct(202),
          quantity: 1,
        },
      ],
    }
    setupCartHandlers(cartState)
    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => {
      expect(result.current.totalItems).toBe(3)
    })

    await act(async () => {
      await result.current.removeItem(101)
    })

    await waitFor(() => {
      expect(result.current.totalItems).toBe(1)
    })

    expect(result.current.cart?.items).toEqual([
      {
        product: expect.objectContaining({ id: 202 }),
        quantity: 1,
      },
    ])

    queryClient.clear()
  })

  it("normalizes an empty cart response", async () => {
    const cartState: Cart = {
      id: 12,
      user_id: 1,
      date: "2024-01-03",
      items: null,
    }

    const patchCalls: CartPatchPayload[] = []
    setupCartHandlers(cartState, patchCalls)
    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => {
      expect(result.current.cart).not.toBeNull()
    })

    expect(result.current.cart?.items).toEqual([])
    expect(result.current.totalItems).toBe(0)

    await act(async () => {
      await result.current.clearCart()
    })

    expect(patchCalls).toHaveLength(0)

    queryClient.clear()
  })
})

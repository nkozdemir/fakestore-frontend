import {
  AUTH_STORAGE_KEY,
  escapeRegExp,
  getApiBaseUrl,
  stubAuthSuccess,
  stubCatalogRoutes,
} from "../support/api-helpers"

const CART_TOKENS = {
  access: "cart-access-token",
  refresh: "cart-refresh-token",
}

type CartProduct = {
  id: number
  title: string
  price: string
  description: string
  image: string
  rate: string
  count: number
  categories: { id: number; name: string }[]
}

const PRODUCT_FIXTURES: Record<number, CartProduct> = {
  1: {
    id: 1,
    title: "Mens Cotton Jacket",
    price: "55.99",
    description:
      "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions.",
    image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg",
    rate: "4.0",
    count: 259,
    categories: [{ id: 1, name: "men's clothing" }],
  },
  6: {
    id: 6,
    title: "WD 2TB Elements Portable External Hard Drive",
    price: "64",
    description:
      "USB 3.0 and USB 2.0 compatibility with improved performance for next-level backup.",
    image: "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg",
    rate: "3.0",
    count: 2,
    categories: [{ id: 3, name: "electronics" }],
  },
}

type CartScenario = {
  cart: {
    id: number
    user_id: number
    date: string
    items: Array<{ product: CartProduct; quantity: number }>
  }
}

const createCartScenario = (): CartScenario => ({
  cart: {
    id: 500,
    user_id: 1,
    date: "2024-11-07T12:00:00Z",
    items: [],
  },
})

type JsonRecord = Record<string, unknown>

const parseBody = (body: unknown): JsonRecord => {
  if (!body) {
    return {}
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as JsonRecord
    } catch {
      return {}
    }
  }

  if (typeof body === "object") {
    return body as JsonRecord
  }

  return {}
}

const setupCartInterceptors = (scenario: CartScenario) => {
  const apiBaseUrl = getApiBaseUrl()
  const cartBase = `${apiBaseUrl}carts/`
  const cartId = scenario.cart.id
  const cartUrl = `${cartBase}${cartId}/`

  cy.intercept("GET", new RegExp(`^${escapeRegExp(cartBase)}\\?`), (req) => {
    if (req.url.indexOf("userId=") !== -1) {
      req.alias = "getCart"
      req.reply(scenario.cart)
      return
    }

    req.continue()
  })

  cy.intercept("GET", cartUrl, scenario.cart)

  cy.intercept("PATCH", cartUrl, (req) => {
    const payload = parseBody(req.body)

    if (Array.isArray(payload.add)) {
      for (const entry of payload.add) {
        const productId = Number(entry.product_id)
        const product = PRODUCT_FIXTURES[productId]
        const quantity = Number(entry.quantity) || 1
        if (!product) {
          continue
        }
        let existingEntry: { product: CartProduct; quantity: number } | null = null
        for (const item of scenario.cart.items) {
          if (item.product.id === product.id) {
            existingEntry = item
            break
          }
        }
        if (existingEntry) {
          existingEntry.quantity += quantity
          continue
        }
        scenario.cart.items.push({ product, quantity })
      }
      req.alias = "cartAdd"
    }

    if (Array.isArray(payload.update)) {
      for (const entry of payload.update) {
        const productId = Number(entry.product_id)
        let targetEntry: { product: CartProduct; quantity: number } | null = null
        for (const item of scenario.cart.items) {
          if (item.product.id === productId) {
            targetEntry = item
            break
          }
        }
        if (targetEntry) {
          targetEntry.quantity =
            Number(entry.quantity) || targetEntry.quantity
        }
      }
      req.alias = "cartUpdate"
    }

    if (Array.isArray(payload.remove)) {
      const removals = payload.remove
        .map((value) => Number(value))
        .filter((id) => !isNaN(id) && isFinite(id))

      scenario.cart.items = scenario.cart.items.filter((item) => {
        for (const candidate of removals) {
          if (item.product.id === candidate) {
            return false
          }
        }
        return true
      })
      req.alias = "cartRemove"
    }

    scenario.cart = {
      ...scenario.cart,
      items: [...scenario.cart.items],
    }

    req.reply(scenario.cart)
  })
}

const visitWithAuth = (path = "/") =>
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(CART_TOKENS))
    },
  })

describe("Cart operations", () => {
  beforeEach(() => {
    stubCatalogRoutes()
    stubAuthSuccess({ tokens: CART_TOKENS })
    const cartScenario = createCartScenario()
    setupCartInterceptors(cartScenario)
    cy.wrap(cartScenario).as("cartScenario")

    const apiBaseUrl = getApiBaseUrl()
    cy.intercept("GET", `${apiBaseUrl}products/6/`, {
      fixture: "products/product-6.json",
    }).as("getProduct6")
    cy.intercept("GET", `${apiBaseUrl}products/6/rating/`, {
      productId: 6,
      rating: { rate: 3, count: 1 },
      userRating: null,
    }).as("getProduct6RatingSummary")
    cy.intercept("GET", `${apiBaseUrl}products/6/ratings/`, {
      productId: 6,
      count: 1,
      ratings: [
        {
          id: 900,
          firstName: "Sam",
          lastName: "Lee",
          value: 3,
          createdAt: "2024-11-01T10:00:00Z",
          updatedAt: "2024-11-01T10:00:00Z",
        },
      ],
    }).as("getProduct6Ratings")
  })

  it("adds a product from the catalog with default quantity", () => {
    visitWithAuth("/")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCategories")
    cy.wait("@getProducts")

    cy.contains('[data-testid="product-card"]', "Mens Cotton Jacket")
      .should("be.visible")
      .within(() => {
        cy.get('[data-testid="product-card-add-button"]').click()
      })

    cy.wait("@cartAdd")

    visitWithAuth("/carts")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCart")

    cy.contains('[data-testid="cart-item-card"]', "Mens Cotton Jacket")
      .should("be.visible")
      .within(() => {
        cy.get('[data-testid="cart-item-1-quantity-input"]').should(
          "have.value",
          "1",
        )
      })
  })

  it("adds a product from the detail page with a selected quantity", () => {
    visitWithAuth("/products/6")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getProduct6")
    cy.wait("@getProduct6RatingSummary")
    cy.wait("@getProduct6Ratings")

    cy.get('[data-testid="product-detail-quantity-increase"]').click().click()
    cy.get('[data-testid="product-detail-add-button"]').click()
    cy.wait("@cartAdd")

    visitWithAuth("/carts")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCart")

    cy.contains('[data-testid="cart-item-card"]', "WD 2TB Elements")
      .should("be.visible")
      .within(() => {
        cy.get('[data-testid="cart-item-6-quantity-input"]').should(
          "have.value",
          "3",
        )
      })
  })

  it("updates quantities and removes items directly in the cart", () => {
    cy.get<CartScenario>("@cartScenario").then((state) => {
      state.cart.items = [
        { product: PRODUCT_FIXTURES[1], quantity: 2 },
        { product: PRODUCT_FIXTURES[6], quantity: 1 },
      ]
    })

    visitWithAuth("/carts")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCart")

    cy.get('[data-testid="cart-item-1-quantity-increase"]').click()
    cy.wait("@cartUpdate")
    cy.get('[data-testid="cart-item-1-quantity-input"]').should(
      "have.value",
      "3",
    )

    cy.get('[data-testid="cart-item-remove"][data-product-id="6"]').click()
    cy.wait("@cartRemove")
    cy.get('[data-testid="cart-item-card"][data-product-id="6"]').should(
      "not.exist",
    )
  })
})

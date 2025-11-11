/// <reference types="cypress" />

const FALLBACK_API_BASE_URL = "http://localhost:8000/api/"
export const AUTH_STORAGE_KEY = "fakestore.authTokens"

export const getApiBaseUrl = (): string =>
  (Cypress.env("apiBaseUrl") as string | undefined) ?? FALLBACK_API_BASE_URL

export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

type AuthStubOptions = {
  meFixture?: string
  profileFixture?: string
  tokens?: {
    access: string
    refresh: string
  }
}

export function stubCatalogRoutes() {
  const apiBaseUrl = getApiBaseUrl()
  const productsMatcher = new RegExp(`^${escapeRegExp(apiBaseUrl)}products/.*`)

  cy.intercept("GET", `${apiBaseUrl}categories/`, {
    fixture: "categories.json",
  }).as("getCategories")

  cy.intercept("GET", productsMatcher, (req) => {
    if (req.url.includes("category=electronics")) {
      req.reply({ fixture: "products/electronics-products.json" })
      return
    }

    req.reply({ fixture: "products/all-products.json" })
  }).as("getProducts")
}

export function stubAuthSuccess(options: AuthStubOptions = {}) {
  const apiBaseUrl = getApiBaseUrl()
  const tokens = options.tokens ?? {
    access: "test-access-token",
    refresh: "test-refresh-token",
  }

  cy.intercept("POST", `${apiBaseUrl}auth/login/`, {
    statusCode: 200,
    body: tokens,
  }).as("loginRequest")

  cy.intercept("GET", `${apiBaseUrl}auth/me/`, {
    fixture: options.meFixture ?? "auth/me.json",
  }).as("authMe")

  cy.intercept(
    "GET",
    new RegExp(`^${escapeRegExp(apiBaseUrl)}users/\\d+/`),
    {
      fixture: options.profileFixture ?? "auth/profile.json",
    },
  ).as("userProfile")
}

export function stubUsernameAvailability(alias = "checkUsername") {
  const apiBaseUrl = getApiBaseUrl()

  cy.intercept("GET", `${apiBaseUrl}auth/validate-username/**`, (req) => {
    const url = new URL(req.url)
    const username = url.searchParams.get("username") ?? ""

    req.reply({
      statusCode: 200,
      body: {
        username,
        available: true,
      },
    })
  }).as(alias)
}

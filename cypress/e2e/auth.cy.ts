import {
  getApiBaseUrl,
  stubAuthSuccess,
  stubCatalogRoutes,
  stubUsernameAvailability,
} from "../support/api-helpers"

const forms = {
  login: '[data-testid="login-form"]',
  register: '[data-testid="register-form"]',
}

describe("Authentication", () => {
  beforeEach(() => {
    stubCatalogRoutes()
  })

  it("signs in an existing user and lands on the catalog", () => {
    stubAuthSuccess()

    cy.visit("/login")

    cy.get(forms.login).within(() => {
      cy.get('input[name="username"]').type("john")
      cy.get('input[name="password"]').type("Password123!")
      cy.get('[data-testid="login-submit"]').click()
    })

    cy.wait("@loginRequest")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCategories")
    cy.wait("@getProducts")

    cy.location("pathname").should("eq", "/")
    cy.contains("button", "John").should("be.visible")
    cy.contains('[data-testid="product-summary"]', "Showing 1–8 of 20 products").should(
      "be.visible",
    )
  })

  it("registers a new account and auto signs in", () => {
    stubAuthSuccess({
      meFixture: "auth/me-new.json",
      profileFixture: "auth/profile-new.json",
    })
    stubUsernameAvailability()

    const apiBaseUrl = getApiBaseUrl()

    cy.intercept("POST", `${apiBaseUrl}auth/register/`, {
      statusCode: 201,
      body: { id: 2 },
    }).as("registerRequest")

    cy.visit("/register")

    const newUsername = "ava123"

    cy.get(forms.register).within(() => {
      cy.get("#firstName").type("Ava")
      cy.get("#lastName").type("Summers")
      cy.get("#email").type("ava@example.com")
      cy.get("#username").type(newUsername)
      cy.get("#username").blur()
    })

    cy.wait("@checkUsername")

    cy.get(forms.register).within(() => {
      cy.get("#password").type("Password123!")
      cy.get('[data-testid="register-submit"]').click()
    })

    cy.wait("@registerRequest").its("request.body").should("deep.include", {
      username: newUsername,
    })
    cy.wait("@loginRequest")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCategories")
    cy.wait("@getProducts")

    cy.location("pathname").should("eq", "/")
    cy.contains("button", "Ava").should("be.visible")
  })
})

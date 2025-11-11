import { stubCatalogRoutes } from "../support/api-helpers"

const selectors = {
  productCard: '[data-testid="product-card"]',
  summary: '[data-testid="product-summary"]',
  categoryFilter: '[data-testid="category-filter"]',
}

describe("Product catalog", () => {
  beforeEach(() => {
    stubCatalogRoutes()
  })

  it("shows the first catalog page and filters by category", () => {
    cy.visit("/")

    cy.wait("@getCategories")
    cy.wait("@getProducts")

    cy.contains("h1", "Products").should("be.visible")
    cy.contains("p", "Discover curated picks from our Fakestore catalog.").should("be.visible")

    cy.contains(selectors.summary, "Showing 1–8 of 20 products").should("be.visible")

    cy.get(selectors.productCard).should("have.length", 8)
    cy.contains(selectors.productCard, "Mens Cotton Jacket")
      .should("be.visible")
      .and("contain.text", "$55.99")
    cy.contains(selectors.productCard, "Solid Gold Petite Micropave").should("exist")

    cy.get(selectors.categoryFilter).click()
    cy.get('[data-testid="category-option-electronics"]').click()

    cy.wait("@getProducts").its("request.url").should("contain", "category=electronics")

    cy.url().should("include", "category=electronics")
    cy.get(selectors.productCard).should("have.length", 2)
    cy.contains(selectors.productCard, "WD 2TB Elements Portable External Hard Drive").should(
      "be.visible",
    )
    cy.contains(selectors.productCard, "SanDisk SSD PLUS 1TB Internal SSD").should("be.visible")
    cy.contains(selectors.summary, /electronics products/i).should("be.visible")
  })
})
